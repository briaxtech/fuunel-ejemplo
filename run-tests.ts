import dotenv from 'dotenv';
import colors from 'colors/safe.js';
import fs from 'node:fs';
import path from 'node:path';
import { goldenTestCases, GoldenTestCase } from './scripts/golden-test-cases';
import { templateCoverageCases } from './scripts/template-coverage-cases';

// Carga variables de entorno (prioriza .env.local)
dotenv.config({ path: '.env.local' });
dotenv.config();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeKey = (key?: string) => key?.trim().toUpperCase() || '';

const pickCases = (allCases: GoldenTestCase[], ids: string[]): GoldenTestCase[] => {
  if (!ids.length) return allCases;
  const selected = allCases.filter(tc => ids.includes(tc.id));
  const missing = ids.filter(id => !selected.find(tc => tc.id === id));
  if (missing.length) {
    console.log(colors.yellow(`Advertencia: IDs no encontrados: ${missing.join(', ')}`));
  }
  return selected;
};

const getExpectedKeys = (testCase: GoldenTestCase) => [
  testCase.expectedTemplateKey,
  ...(testCase.acceptedTemplateKeys || []),
].map(normalizeKey);

const hasValidApiKey = () => Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);

type CliOptions = {
  useCoverage: boolean;
  ids: string[];
  output?: string;
  quietPass?: boolean;
};

const parseArgs = (argv: string[]): CliOptions => {
  const opts: CliOptions = { useCoverage: false, ids: [], output: undefined, quietPass: false };
  for (const arg of argv) {
    if (arg === '--coverage') {
      opts.useCoverage = true;
      continue;
    }
    if (arg === '--quiet-pass') {
      opts.quietPass = true;
      continue;
    }
    if (arg.startsWith('--output=')) {
      opts.output = arg.split('=')[1];
      continue;
    }
    if (arg.startsWith('--output')) {
      // next arg should be the path
      continue;
    }
    opts.ids.push(arg);
  }

  // Handle separated --output <path>
  const outputIndex = argv.findIndex(a => a === '--output');
  if (outputIndex !== -1 && argv[outputIndex + 1]) {
    opts.output = argv[outputIndex + 1];
  }

  return opts;
};

async function run() {
  // Importamos despues de cargar dotenv para que GEMINI_API_KEY este disponible
  const { analyzeImmigrationProfile } = await import('./services/geminiService');

  if (!hasValidApiKey()) {
    console.error(colors.red('Falta GEMINI_API_KEY o API_KEY en el entorno.'));
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const dataset = args.useCoverage ? templateCoverageCases : goldenTestCases;
  const cases = pickCases(dataset, args.ids);

  console.log(
    colors.cyan(
      `Iniciando Test Suite Masivo (${cases.length} casos)${
        args.useCoverage ? ' [modo cobertura]' : ''
      }...\n`,
    ),
  );

  let passed = 0;
  let failed = 0;
  const errors: any[] = [];
  const passes: any[] = [];

  for (const testCase of cases) {
    process.stdout.write(colors.gray(`Probando ${testCase.id} - ${testCase.description}... `));
    try {
      const result = await analyzeImmigrationProfile(testCase.profile);
      const expectedKeys = getExpectedKeys(testCase);
      const receivedKeys = (result.recommendations || []).map(r => normalizeKey(r.templateKey));

      const firstMatchIndex = receivedKeys.findIndex(key => expectedKeys.includes(key));
      const passesTest = testCase.strictMode
        ? expectedKeys.includes(receivedKeys[0])
        : firstMatchIndex !== -1;

      if (passesTest) {
        passed++;
        passes.push({
          id: testCase.id,
          expected: expectedKeys.join(' | '),
          received: receivedKeys.join(', ') || '-',
          description: testCase.description,
        });
        if (!args.quietPass) {
          console.log(colors.green('PASS'));
        } else {
          console.log(colors.green('OK'));
        }
      } else {
        failed++;
        console.log(colors.red('FAIL'));
        const detail = {
          id: testCase.id,
          expected: expectedKeys.join(' | '),
          received: receivedKeys.join(', ') || '-',
          reasoning: result.actionReasoning || 'sin razonamiento',
          description: testCase.description,
        };
        errors.push(detail);
        console.log(colors.yellow(`   Esperado: ${detail.expected}`));
        console.log(colors.yellow(`   Recibido: ${detail.received}`));
        console.log(colors.gray(`   Razonamiento: ${detail.reasoning}`));
      }
    } catch (error) {
      failed++;
      console.log(colors.red('ERROR'));
      console.error(error);
      errors.push({
        id: testCase.id,
        error: (error as Error).message,
        description: testCase.description,
      });
    }

    await wait(500); // Pausa corta para evitar rate limits
  }

  const summary = {
    total: cases.length,
    passed,
    failed,
    errors,
    passes,
    useCoverage: args.useCoverage,
    timestamp: new Date().toISOString(),
  };

  if (args.output) {
    try {
      const outPath = path.resolve(process.cwd(), args.output);
      fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
      console.log(colors.cyan(`\nResumen guardado en ${outPath}`));
    } catch (err) {
      console.log(colors.red(`\nNo se pudo escribir el archivo de salida: ${(err as Error).message}`));
    }
  }

  console.log('\n=======================================');
  console.log(`RESULTADOS FINALES: ${passed}/${cases.length} PASADOS`);
  console.log('=======================================\n');

  if (failed > 0) {
    console.log(colors.red(`Resumen de errores (${failed}):`));
    console.table(errors);
    process.exitCode = 1;
  }
}

run();

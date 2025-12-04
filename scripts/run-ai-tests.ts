import { config } from "dotenv";
config({ path: ".env.local" });
config();

import colors from "colors/safe.js";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { preClassify } from "../services/preClassify";
import { TEMPLATE_KEYS } from "../services/templates";
import { filterCases, listCases } from "./tests";
import { normalizeTemplateKey } from "./tests/fixtures";
import { AiTestCase, TestResult } from "./tests/types";

type CliOptions = {
  tags: string[];
  match?: string;
  output?: string;
  delayMs: number;
  dryRun: boolean;
  listOnly: boolean;
};

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    tags: [],
    match: undefined,
    output: undefined,
    delayMs: 1200,
    dryRun: false,
    listOnly: false,
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--list") {
      opts.listOnly = true;
      continue;
    }
    if (arg.startsWith("--tags=")) {
      opts.tags = arg.replace("--tags=", "").split(",").filter(Boolean);
      continue;
    }
    if (arg.startsWith("--match=")) {
      opts.match = arg.replace("--match=", "");
      continue;
    }
    if (arg.startsWith("--output=")) {
      opts.output = arg.replace("--output=", "");
      continue;
    }
    if (arg.startsWith("--delay=")) {
      const val = Number(arg.replace("--delay=", ""));
      if (!Number.isNaN(val) && val > 0) {
        opts.delayMs = val;
      }
      continue;
    }
  }

  // Handle "--output path" separated
  const outputIdx = args.findIndex((a) => a === "--output");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    opts.output = args[outputIdx + 1];
  }

  return opts;
};

const printAvailableCases = () => {
  const catalog = listCases();
  console.log(colors.cyan("Casos disponibles:\n"));
  catalog.forEach((tc) => {
    const tags = tc.tags?.length ? ` [${tc.tags.join(", ")}]` : "";
    console.log(`- ${colors.green(tc.id)}: ${tc.name}${tags}`);
  });
  console.log(`\nTotal: ${catalog.length}`);
};

const loadAnalyzer = async () => {
  const mod = await import("../services/geminiService");
  return mod.analyzeImmigrationProfile;
};

const runCase = async (
  testCase: AiTestCase,
  opts: CliOptions,
  analyzeImmigrationProfile?: (profile: any) => Promise<any>,
): Promise<TestResult> => {
  const started = Date.now();
  const pre = preClassify(testCase.profile);
  const candidateTemplates = pre.candidateTemplates || [];
  const normalizedCandidates = candidateTemplates.map((c) => normalizeTemplateKey(c));
  const allowedTemplates = TEMPLATE_KEYS.map((t) => normalizeTemplateKey(t));
  const expectation = testCase.expectation;

  // Validación preliminar de preClassify
  if (expectation?.expectedFlow && pre.flowCategory !== expectation.expectedFlow) {
    return {
      id: testCase.id,
      name: testCase.name,
      status: "failed",
      durationMs: Date.now() - started,
      flowCategory: pre.flowCategory,
      candidateTemplates,
      message: `Flujo esperado ${expectation.expectedFlow}, recibido ${pre.flowCategory}`,
      notes: testCase.notes,
    };
  }

  if (opts.dryRun) {
    return {
      id: testCase.id,
      name: testCase.name,
      status: "passed",
      durationMs: Date.now() - started,
      flowCategory: pre.flowCategory,
      candidateTemplates,
      message: "Dry run: solo se evaluó preClassify.",
      notes: testCase.notes,
    };
  }

  if (!analyzeImmigrationProfile) {
    throw new Error("Analyzer not loaded");
  }

  try {
    const ai = await analyzeImmigrationProfile(testCase.profile);
    const recommendationTemplates =
      (ai.recommendations || []).map((r: any) => r.templateKey).filter(Boolean);
    const primary = recommendationTemplates[0];
    const normalizedPrimary = normalizeTemplateKey(primary);

    let status: TestResult["status"] = "passed";
    let message: string | undefined;

    if (expectation?.mustInclude?.length) {
      const matches = expectation.mustInclude.some(
        (tpl) => normalizeTemplateKey(tpl) === normalizedPrimary,
      );
      if (!matches) {
        status = "failed";
        message = `Esperaba ${expectation.mustInclude.join(" / ")}, recibido ${primary || "N/A"}`;
      }
    }

    if (!allowedTemplates.includes(normalizedPrimary)) {
      status = "failed";
      message = message
        ? `${message}; clave no reconocida`
        : `Template ${primary} no existe en catálogo`;
    }

    if (!message) {
      message = `OK (${primary})`;
    }

    return {
      id: testCase.id,
      name: testCase.name,
      status,
      durationMs: Date.now() - started,
      flowCategory: pre.flowCategory,
      candidateTemplates,
      recommendationTemplates,
      message,
      notes: testCase.notes,
    };
  } catch (error) {
    return {
      id: testCase.id,
      name: testCase.name,
      status: "failed",
      durationMs: Date.now() - started,
      flowCategory: pre.flowCategory,
      candidateTemplates,
      recommendationTemplates: [],
      error: error instanceof Error ? error.message : String(error),
      notes: testCase.notes,
    };
  }
};

async function main() {
  const opts = parseArgs();

  if (opts.listOnly) {
    printAvailableCases();
    return;
  }

  const selected = filterCases(opts.tags, opts.match);

  if (!selected.length) {
    console.log(colors.red("No se encontraron casos con los filtros proporcionados."));
    return;
  }

  console.log(colors.cyan(`Iniciando AI test runner (${selected.length} casos)`));
  if (opts.dryRun) {
    console.log(colors.gray("Modo dry-run: no se llamará a Gemini, solo preClassify.\n"));
  } else {
    console.log(colors.gray("Usando GEMINI_API_KEY/API_KEY presente en el entorno.\n"));
  }

  let analyzeImmigrationProfile: ((profile: any) => Promise<any>) | undefined;
  if (!opts.dryRun) {
    analyzeImmigrationProfile = await loadAnalyzer();
  }

  const results: TestResult[] = [];

  for (const testCase of selected) {
    const result = await runCase(testCase, opts, analyzeImmigrationProfile);
    results.push(result);

    const symbol =
      result.status === "passed"
        ? colors.green("✓")
        : result.status === "failed"
          ? colors.red("✗")
          : colors.yellow("?");

    console.log(
      `${symbol} ${colors.bold(result.id)} - ${result.name} ${colors.gray(`(${result.durationMs}ms)`)} ${result.message ? "- " + result.message : ""
      }`,
    );

    if (!opts.dryRun) {
      await sleep(opts.delayMs);
    }
  }

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.length - passed;

  console.log("\n=========================");
  console.log(`Total:   ${results.length}`);
  console.log(colors.green(`Passed:  ${passed}`));
  console.log(colors.red(`Failed:  ${failed}`));
  console.log("=========================\n");

  if (opts.output) {
    const outPath = path.resolve(process.cwd(), opts.output);
    const payload = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed,
        failed,
      },
      results,
    };
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
    console.log(colors.cyan(`Resultados guardados en ${outPath}`));
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(colors.red("Error fatal en el runner:"), err);
  process.exit(1);
});

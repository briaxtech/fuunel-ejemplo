import {
  EducationLevel,
  ImmigrationStatus,
  TimeInSpain,
  UserProfile,
} from '../types';
import { TEMPLATE_KEYS } from '../services/templates';
import { GoldenTestCase } from './golden-test-cases';

type CaseShape = {
  description: string;
  overrides: Partial<UserProfile>;
  reason: string;
  strictMode?: boolean;
  acceptedTemplateKeys?: string[];
};

const SKIP_TEMPLATES = new Set<string>([
  'AGENDAR CITA',
  'CITA AGENDADA',
  'PEDIDO PAGO',
  'PRIMER PAGO NACIONALIDAD (UN EXPEDIENTE)',
  'PRIMER PAGO NACIONALIDAD (VARIOS EXPEDIENTES)',
]);

const baseProfile: UserProfile = {
  firstName: 'Test',
  lastName: 'User',
  nationality: 'Argentina',
  age: 30,
  educationLevel: EducationLevel.UNIVERSITY,
  entryDate: '2024-01-01',
  currentStatus: ImmigrationStatus.TOURIST,
  timeInSpain: TimeInSpain.LESS_THAN_1_YEAR,
  province: 'Madrid',
  hasCriminalRecord: false,
  hasFamilyInSpain: false,
  familyDetails: '',
  isEmpadronado: false,
  jobSituation: 'Sin contrato, explorando opciones',
  comments: '',
  locationStatus: 'spain',
  familyNationality: undefined,
  familyRelation: undefined,
  primaryGoal: 'reside_work',
};

const makeProfile = (overrides: Partial<UserProfile>): UserProfile => ({
  ...baseProfile,
  ...overrides,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

const createCase = (
  templateKey: string,
  index: number,
  shape: CaseShape,
): GoldenTestCase => ({
  id: `${slugify(templateKey)}_${index.toString().padStart(2, '0')}`,
  description: shape.description,
  profile: makeProfile(shape.overrides),
  expectedTemplateKey: templateKey,
  acceptedTemplateKeys: shape.acceptedTemplateKeys,
  strictMode: shape.strictMode ?? true,
  reason: shape.reason,
});

const ensureAtLeastThree = (templateKey: string, shapes: CaseShape[]) => {
  const cases = shapes.map((shape, idx) => createCase(templateKey, idx + 1, shape));
  while (cases.length < 3) {
    cases.push(
      createCase(templateKey, cases.length + 1, {
        description: `Caso genérico adicional para ${templateKey}`,
        overrides: { comments: `Cobertura adicional para ${templateKey}` },
        reason: 'Cobertura mínima de 3 casos.',
        strictMode: false,
      }),
    );
  }
  return cases;
};

const studyCases = (templateKey: string): CaseShape[] => [
  {
    description: 'Desde origen con admisión y seguro',
    overrides: {
      locationStatus: 'origin',
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: 'Admisión a estudios, fondos y seguro',
      primaryGoal: 'study',
    },
    reason: `Caso base de estudios (${templateKey}).`,
  },
  {
    description: 'Turista en España con preinscripción',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      jobSituation: 'Preinscripción y medios',
      primaryGoal: 'study',
    },
    reason: `Cambio de estatus a estudios (${templateKey}).`,
  },
  {
    description: 'FP oficial presencial con medios',
    overrides: {
      educationLevel: EducationLevel.BASIC,
      locationStatus: 'origin',
      jobSituation: 'Matrícula en FP 600h',
      primaryGoal: 'study',
    },
    reason: `Estudios reglados (${templateKey}).`,
  },
];

const studyRenewCases = (): CaseShape[] => [
  {
    description: 'Renovación de grado con buen expediente',
    overrides: {
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      isEmpadronado: true,
      primaryGoal: 'study',
    },
    reason: 'Sigue mismos estudios y cumple requisitos.',
  },
  {
    description: 'Prórroga de máster para prácticas',
    overrides: {
      currentStatus: ImmigrationStatus.STUDENT,
      jobSituation: 'Prácticas pendientes',
      isEmpadronado: true,
      primaryGoal: 'study',
    },
    reason: 'Necesita completar prácticas.',
  },
  {
    description: 'Doctorado con beca activa',
    overrides: {
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      primaryGoal: 'study',
    },
    reason: 'Doctorado en curso.',
  },
];

const arraigoSocialCases = (): CaseShape[] => [
  {
    description: 'Irregular 3 años con oferta laboral',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Contrato indefinido 40h',
      primaryGoal: 'reside_work',
    },
    reason: 'Arraigo social con oferta.',
  },
  {
    description: 'Irregular con medios propios e informe',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Medios propios demostrables',
    },
    reason: 'Arraigo social con medios.',
  },
  {
    description: 'Contrato parcial y padrón estable',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Contrato 20h',
    },
    reason: 'Permanencia y contrato.',
  },
];

const arraigoSociolaboralCases = (): CaseShape[] => [
  {
    description: 'Acta de Inspección y nóminas, 3 años',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Pruebas laborales previas',
    },
    reason: 'Relación laboral acreditada.',
  },
  {
    description: 'Sentencia reconociendo relación laboral',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      jobSituation: 'Sentencia favorable',
    },
    reason: 'Prueba judicial.',
  },
  {
    description: 'Acta de conciliación por despido',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Conciliación laboral',
    },
    reason: 'Pruebas de vínculo laboral.',
  },
];

const arraigoSocioformativoCases = (): CaseShape[] => [
  {
    description: 'Preinscripción a curso 600h con padrón 3 años',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Preinscripción formación reglada',
      primaryGoal: 'study',
    },
    reason: 'Permanencia y compromiso formativo.',
  },
  {
    description: 'Matrícula en curso sanitario reglado',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'Curso sanitario 700h',
    },
    reason: 'Formación reglada acreditada.',
  },
  {
    description: 'Plaza en FP dual confirmada',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: 'FP dual',
    },
    reason: 'Compromiso de formación.',
  },
];

const arragoFamiliarCases = (): CaseShape[] => [
  {
    description: 'Progenitor de menor español conviviente',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      hasFamilyInSpain: true,
      familyNationality: 'spanish_eu',
      familyRelation: 'child',
      isEmpadronado: true,
      primaryGoal: 'family',
    },
    reason: 'Progenitor de menor español.',
  },
  {
    description: 'Cónyuge de español con matrimonio inscrito',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyNationality: 'spanish_eu',
      familyRelation: 'spouse',
      isEmpadronado: true,
      primaryGoal: 'family',
    },
    reason: 'Cónyuge de español.',
    acceptedTemplateKeys: ['FAMILIAR UE 2025', 'PAREJA DE HECHO'],
  },
  {
    description: 'Hijo de español de origen residente en España',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: 'spanish_eu',
      familyRelation: 'parent',
      isEmpadronado: true,
    },
    reason: 'Hijo de español de origen.',
  },
];

const nacionalidadCases = (): CaseShape[] => [
  {
    description: 'Iberoamericano con 2 años de residencia',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      primaryGoal: 'nationality',
    },
    reason: 'Plazo reducido iberoamericanos.',
  },
  {
    description: 'Residente larga duración 10 años',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      entryDate: '2014-01-01',
      isEmpadronado: true,
      primaryGoal: 'nationality',
    },
    reason: 'Plazo general 10 años.',
  },
  {
    description: 'Filipino con 2 años de residencia',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      primaryGoal: 'nationality',
    },
    reason: 'Plazo reducido por nacionalidad.',
  },
];

const nacionalidadMatrimonioCases = (): CaseShape[] => [
  {
    description: 'Casado con española, 1 año de residencia',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
      primaryGoal: 'nationality',
    },
    reason: 'Plazo reducido por matrimonio.',
  },
  {
    description: 'Cónyuge de español con 14 meses de residencia',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
      primaryGoal: 'nationality',
    },
    reason: 'Convivencia y residencia mínima.',
  },
  {
    description: 'Esposo de española con NIE en vigor',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      primaryGoal: 'nationality',
    },
    reason: 'Nacionalidad por matrimonio.',
  },
];

const nomadaCases = (): CaseShape[] => [
  {
    description: 'Contrato remoto full time con empresa extranjera',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Teletrabajo internacional 120k',
      primaryGoal: 'reside_work',
    },
    reason: 'Perfil nómada digital.',
  },
  {
    description: 'Turista en España con contrato remoto UK',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      jobSituation: 'Contrato remoto 70k',
    },
    reason: 'Teletrabajo desde España.',
  },
  {
    description: 'Freelance IT con clientes extranjeros',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Autónomo con facturación exterior 80k',
    },
    reason: 'Actividad remota con clientes fuera de España.',
  },
];

const inversorCases = (): CaseShape[] => [
  {
    description: 'Compra de vivienda de 600k€',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Inversor con fondos',
      primaryGoal: 'reside_work',
    },
    reason: 'Golden visa por inmueble.',
  },
  {
    description: 'Inversión financiera 2M€',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Inversor financiero',
    },
    reason: 'Golden visa por inversión financiera.',
  },
  {
    description: 'Participación empresarial 1M€',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Inversión en empresa española',
    },
    reason: 'Golden visa por inversión societaria.',
  },
];

const hqCases = (): CaseShape[] => [
  {
    description: 'Oferta 55k en multinacional',
    overrides: { locationStatus: 'origin', jobSituation: 'Contrato HQ salario alto' },
    reason: 'Profesional altamente cualificado.',
  },
  {
    description: 'Perfil directivo 70k en empresa grande',
    overrides: { locationStatus: 'origin', jobSituation: 'Oferta directiva' },
    reason: 'Puesto directivo elegible.',
  },
  {
    description: 'Investigador senior en centro acreditado',
    overrides: { locationStatus: 'origin', jobSituation: 'Contrato de investigación' },
    reason: 'Investigador cualificado.',
  },
];

const emprenderCases = (): CaseShape[] => [
  {
    description: 'Startup tecnológica con inversión 80k',
    overrides: {
      locationStatus: 'origin',
      jobSituation: 'Fundador con plan de negocio',
      primaryGoal: 'reside_work',
    },
    reason: 'Permiso por emprendimiento.',
  },
  {
    description: 'Chef quiere abrir restaurante con socio',
    overrides: {
      locationStatus: 'spain',
      jobSituation: 'Proyecto hostelería con socio local',
    },
    reason: 'Cuenta propia con inversión.',
  },
  {
    description: 'Consultor autónomo con cartera de clientes',
    overrides: {
      locationStatus: 'spain',
      currentStatus: ImmigrationStatus.TOURIST,
      jobSituation: 'Clientes internacionales y plan',
    },
    reason: 'Cuenta propia con medios.',
  },
];

const familiariespanolCases = (): CaseShape[] => [
  {
    description: 'Esposo de española quiere tarjeta familiar',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
      primaryGoal: 'family',
    },
    reason: 'Familiar de ciudadano español.',
    acceptedTemplateKeys: ['FAMILIAR UE 2025'],
  },
  {
    description: 'Pareja de hecho registrada con ciudadano español',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'registered_partner',
      familyNationality: 'spanish_eu',
    },
    reason: 'Pareja registrada con español.',
    acceptedTemplateKeys: ['PAREJA DE HECHO'],
  },
  {
    description: 'Ascendiente a cargo de ciudadano español',
    overrides: {
      locationStatus: 'origin',
      hasFamilyInSpain: true,
      familyRelation: 'child',
      familyNationality: 'spanish_eu',
    },
    reason: 'Reagrupación de ascendiente de español.',
    acceptedTemplateKeys: ['ESTAR A CARGO'],
  },
];

const familiarUECases = (): CaseShape[] => [
  {
    description: 'Cónyuge de español con matrimonio inscrito',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
      primaryGoal: 'family',
    },
    reason: 'Tarjeta de familiar de ciudadano UE.',
    acceptedTemplateKeys: ['ARRAIGO FAMILIAR'],
  },
  {
    description: 'Pareja registrada de ciudadano UE',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'registered_partner',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Pareja de hecho con ciudadano UE.',
  },
  {
    description: 'Hijo menor a cargo de ciudadano UE',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'child',
      familyNationality: 'spanish_eu',
    },
    reason: 'Familiar directo de ciudadano UE.',
  },
];

const parejaHechoCases = (): CaseShape[] => [
  {
    description: 'Pareja de hecho registrada con español',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'registered_partner',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
      primaryGoal: 'family',
    },
    reason: 'Pareja de hecho registrada.',
    acceptedTemplateKeys: ['FAMILIAR UE 2025'],
  },
  {
    description: 'Pareja registrada con ciudadano UE en Barcelona',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'registered_partner',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Pareja registrada con ciudadano UE.',
  },
  {
    description: 'Pareja estable con convivencia, quiere inscribirse',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      hasFamilyInSpain: true,
      familyRelation: 'unregistered_partner',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Preparar inscripción como pareja de hecho.',
  },
];

const trabajoFamiliarUETCases = (): CaseShape[] => [
  {
    description: 'Resguardo de solicitud, consulta derecho a trabajar',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Trabajo con resguardo familiar UE.',
    acceptedTemplateKeys: ['PUEDO TRABAJAR CON LA RESIDENCIA EN TRÁMITE'],
  },
  {
    description: 'Pareja de hecho con resguardo, tiene oferta',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'registered_partner',
      familyNationality: 'spanish_eu',
    },
    reason: 'Derechos laborales durante trámite.',
  },
  {
    description: 'Hijo de ciudadano UE con solicitud presentada',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'child',
      familyNationality: 'spanish_eu',
    },
    reason: 'Trabajo mientras espera tarjeta.',
  },
];

const residenciaIndependienteCases = (): CaseShape[] => [
  {
    description: 'Tarjeta comunitaria, quiere independencia tras separación',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Conservar residencia independiente.',
  },
  {
    description: 'Víctima de violencia con tarjeta familiar UE',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      familyNationality: 'spanish_eu',
      isEmpadronado: true,
    },
    reason: 'Residencia independiente por violencia.',
  },
  {
    description: 'Reagrupado quiere mantener residencia tras divorcio',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      hasFamilyInSpain: true,
      familyRelation: 'spouse',
      isEmpadronado: true,
    },
    reason: 'Independizar residencia tras ruptura.',
  },
];

const contenciosoCases = (): CaseShape[] => [
  {
    description: 'Denegación de nacionalidad, quiere contencioso',
    overrides: {
      currentStatus: ImmigrationStatus.REGULAR,
      isEmpadronado: true,
      comments: 'Nacionalidad denegada',
    },
    reason: 'Recurso contencioso ante denegación.',
  },
  {
    description: 'Denegación de residencia inicial, quiere recurrir',
    overrides: {
      currentStatus: ImmigrationStatus.IRREGULAR,
      isEmpadronado: true,
      comments: 'Denegaron permiso inicial',
    },
    reason: 'Acción contenciosa en vía judicial.',
  },
  {
    description: 'Visado de estudios denegado desde consulado',
    overrides: {
      locationStatus: 'origin',
      currentStatus: ImmigrationStatus.OTHER,
      comments: 'Visado denegado, quiere recurrir',
    },
    reason: 'Contencioso contra denegación de visado.',
  },
];

const asiloCases = (): CaseShape[] => [
  {
    description: 'Solicitante con riesgo político y pruebas',
    overrides: {
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      comments: 'Persecución política acreditada',
    },
    reason: 'Protección internacional por riesgo político.',
  },
  {
    description: 'Riesgo LGTBI en país de origen',
    overrides: {
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      comments: 'Riesgo real por orientación sexual',
    },
    reason: 'Protección por persecución.',
  },
  {
    description: 'Periodista perseguido por publicaciones',
    overrides: {
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      comments: 'Amenazas por actividad periodística',
    },
    reason: 'Riesgo por libertad de expresión.',
  },
];

const turistaInfoCases = (): CaseShape[] => [
  {
    description: 'Turista 60 días en España pregunta opciones',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      comments: 'Quiere saber qué puede tramitar',
    },
    reason: 'Orientación como turista en España.',
    strictMode: false,
  },
  {
    description: 'Turista 80 días busca cambiar estatus sin salir',
    overrides: {
      currentStatus: ImmigrationStatus.TOURIST,
      comments: 'No quiere salir de España',
    },
    reason: 'Cambio de estatus desde turismo.',
    strictMode: false,
  },
  {
    description: 'Turista pregunta por extensiones y límites',
    overrides: { currentStatus: ImmigrationStatus.TOURIST, comments: 'Extensiones turismo' },
    reason: 'Info general como turista.',
    strictMode: false,
  },
];

const turistaEntradaCases = (): CaseShape[] => [
  {
    description: 'Consulta requisitos para entrar como turista',
    overrides: {
      locationStatus: 'origin',
      comments: 'Quiere saber requisitos de entrada',
    },
    reason: 'Entrada como turista desde origen.',
    strictMode: false,
  },
  {
    description: 'Pregunta duración máxima y seguro',
    overrides: {
      locationStatus: 'origin',
      comments: 'Duración permitida y seguro',
    },
    reason: 'Información previa al viaje.',
    strictMode: false,
  },
  {
    description: 'Con carta de invitación para visita corta',
    overrides: {
      locationStatus: 'origin',
      comments: 'Consulta visado y carta de invitación',
    },
    reason: 'Requisitos de visado turismo.',
    strictMode: false,
  },
];

const genericCases = (templateKey: string): CaseShape[] => [
  {
    description: `Caso genérico 1 para ${templateKey}`,
    overrides: { comments: `Cobertura general para ${templateKey}` },
    reason: `Cobertura genérica (${templateKey}).`,
    strictMode: false,
  },
  {
    description: `Caso genérico 2 para ${templateKey}`,
    overrides: { comments: `Segundo caso para ${templateKey}` },
    reason: `Cobertura genérica (${templateKey}).`,
    strictMode: false,
  },
  {
    description: `Caso genérico 3 para ${templateKey}`,
    overrides: { comments: `Tercer caso para ${templateKey}` },
    reason: `Cobertura genérica (${templateKey}).`,
    strictMode: false,
  },
];

const pickShapes = (templateKey: string): CaseShape[] => {
  const key = templateKey.toUpperCase();
  if (key.includes('ESTUDIO')) return studyCases(templateKey);
  if (key.includes('RENOVACIÓN DE ESTUDIOS')) return studyRenewCases();
  if (key.includes('DESPUÉS DE ESTUDIOS')) return studyCases(templateKey);
  if (key.includes('MODIFICAR DE ESTUDIOS A CUENTA AJENA')) return studyCases(templateKey);
  if (key.includes('MODIFICAR DE ESTUDIOS A CUENTA PROPIA')) return studyCases(templateKey);
  if (key.includes('MODIFICACIÓN DE FAMILIARES DE ESTUDIANTE')) return studyCases(templateKey);
  if (key.includes('ERROR EN LA RESOLUCIÓN DE ESTUDIANTES')) return studyCases(templateKey);
  if (key.includes('ARRAIGO SOCIAL')) return arraigoSocialCases();
  if (key.includes('ARRAIGO SOCIOLABORAL')) return arraigoSociolaboralCases();
  if (key.includes('ARRAIGO SOCIOFORMATIVO')) return arraigoSocioformativoCases();
  if (key.includes('ARRAIGO FAMILIAR')) return arragoFamiliarCases();
  if (key.includes('ARRAIGO DE SEGUNDA OPORTUNIDAD')) return arraigoSocioformativoCases();
  if (key.includes('NACIONALIDAD POR MATRIMONIO')) return nacionalidadMatrimonioCases();
  if (key.includes('NACIONALIDAD POR APELLIDOS')) return nacionalidadCases();
  if (key.includes('NACIONALIDAD')) return nacionalidadCases();
  if (key.includes('NÓMADA DIGITAL')) return nomadaCases();
  if (key.includes('INVERSORES')) return inversorCases();
  if (key.includes('ALTAMENTE CUALIFICADO')) return hqCases();
  if (key.includes('EMPRENDER')) return emprenderCases();
  if (key.includes('FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPAÑOLA')) return familiariespanolCases();
  if (key.includes('FAMILIAR UE')) return familiarUECases();
  if (key.includes('PAREJA DE HECHO')) return parejaHechoCases();
  if (key.includes('TRABAJAR CON RESIDENCIA DE FAMILIAR')) return trabajoFamiliarUETCases();
  if (key === 'PUEDO TRABAJAR CON LA RESIDENCIA EN TRÁMITE') return trabajoFamiliarUETCases();
  if (key.includes('RESIDENCIA INDEPENDIENTE')) return residenciaIndependienteCases();
  if (key.includes('ASILO')) return asiloCases();
  if (key.includes('RECURSO CONTENCIOSO')) return contenciosoCases();
  if (key.includes('AUTORIZACIONES COMO TURISTA')) return turistaInfoCases();
  if (key.includes('ENTRAR COMO TURISTA')) return turistaEntradaCases();
  if (key.includes('CUE 2025')) return turistaEntradaCases();
  if (key.includes('LEY DE MEMORIA DEMOCRÁTICA')) return nacionalidadCases();
  if (key.includes('BÚSQUEDA DE ACTAS')) return turistaEntradaCases();
  if (key.includes('RESIDIR MIENTRAS ESPERAMOS LMD')) return nacionalidadCases();
  if (key.includes('HOMOLOGACIÓN')) return hqCases();
  if (key.includes('GESTOR DE CONFIANZA')) return genericCases(templateKey);
  if (key.includes('CUENTA BREVEMENTE')) return genericCases(templateKey);
  if (key.includes('CLIENES')) return genericCases(templateKey);
  if (key.includes('REMITIR A JULIA')) return genericCases(templateKey);
  if (key.includes('EMIGRAR SIN PASAPORTE EUROPEO')) return turistaEntradaCases();
  if (key.includes('FORMAS DE REGULARIZARSE')) return arraigoSocialCases();
  if (key.includes('REAGRUPACIÓN FAMILIAR')) return familiariespanolCases();
  if (key.includes('HIJO DE ESPAÑOL DE ORIGEN')) return arragoFamiliarCases();
  if (key.includes('ESTAR A CARGO')) return familiariespanolCases();
  return genericCases(templateKey);
};

const uniqueTemplateKeys = Array.from(new Set(TEMPLATE_KEYS));

export const templateCoverageCases: GoldenTestCase[] = uniqueTemplateKeys
  .filter(key => !SKIP_TEMPLATES.has(key))
  .flatMap(templateKey => ensureAtLeastThree(templateKey, pickShapes(templateKey)));

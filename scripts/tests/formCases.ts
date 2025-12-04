import {
  EducationLevel,
  ImmigrationStatus,
  TimeInSpain,
} from "../../types";
import { makeProfile } from "./fixtures";
import { AiTestCase } from "./types";

// Casos orientados al flujo real del formulario y plantillas clave.
// Objetivo: al menos 2 variantes por template principal cubierto.
export const formCases: AiTestCase[] = [
  // ===== ARRAIGOS =====
  {
    id: "arraigo-social-1",
    name: "Irregular 3.5 años empadronado, trabajo informal",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "hostelería sin contrato",
      comments:
        "[objetivo:regularizar] Llevo más de 3 años en España, siempre empadronado. Trabajo sin contrato y quiero regularizarme.",
    }),
    expectation: { expectedFlow: "ARRAIGOS", mustInclude: ["ARRAIGO SOCIAL"] },
  },
  {
    id: "arraigo-social-2",
    name: "Irregular 3 años, con oferta firmada",
    tags: ["form", "arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "oferta de contrato en restaurante",
      comments:
        "[objetivo:regularizar] Tengo oferta de contrato y 3 años empadronado.",
    }),
    expectation: { expectedFlow: "ARRAIGOS", mustInclude: ["ARRAIGO SOCIAL"] },
  },
  {
    id: "arraigo-sociolaboral-1",
    name: "Irregular 2.5 años con denuncia laboral",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "construcción, denuncia laboral presentada",
      comments:
        "[objetivo:regularizar] Llevo 2 años y medio, trabajé sin contrato y ya tengo denuncia en inspección.",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOLABORAL"],
    },
  },
  {
    id: "arraigo-sociolaboral-2",
    name: "Irregular 2 años, sentencia a favor",
    tags: ["form", "arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "limpieza, sentencia laboral favorable",
      comments:
        "[objetivo:regularizar] Tengo sentencia laboral a favor por despido sin papeles.",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOLABORAL"],
    },
  },
  {
    id: "arraigo-socioformativo-1",
    name: "Irregular 2+ años con preinscripción 600h",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      comments:
        "[objetivo:regularizar] Llevo más de 2 años en España y tengo preinscripción en un curso de 600h para formarme.",
      jobSituation: "trabajos puntuales y curso de 600h",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOFORMATIVO"],
    },
  },
  {
    id: "arraigo-socioformativo-2",
    name: "Irregular 2.2 años, FP superior confirmado",
    tags: ["form", "arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      comments:
        "[objetivo:regularizar] Tengo admisión a un FP superior de 2000h y llevo más de 2 años aquí.",
      jobSituation: "trabajos esporádicos, listo para estudiar",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOFORMATIVO"],
    },
  },

  // ===== FAMILIA/UE =====
  {
    id: "arraigo-familiar-hijo-1",
    name: "Padre/madre de hijo español",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "parent_of_spanish",
      familyDetails: "Hijo español de 2 años, convivimos en Madrid.",
      comments:
        "[objetivo:regularizar] Estoy irregular, convivo con mi hijo español y necesito residencia para cuidarlo.",
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["ARRAIGO FAMILIAR", "HIJO DE ESPAÑOL DE ORIGEN"],
    },
  },
  {
    id: "arraigo-familiar-hijo-2",
    name: "Madre irregular, hijo español recién nacido",
    tags: ["form", "familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "parent_of_spanish",
      familyDetails: "Bebé español de 4 meses, dependencia económica total.",
      comments:
        "[objetivo:regularizar] Llegué hace 6 meses, mi bebé nació en España, necesito residencia.",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["ARRAIGO FAMILIAR", "HIJO DE ESPAÑOL DE ORIGEN"],
    },
  },
  {
    id: "familiar-ue-pareja-1",
    name: "Pareja no registrada de español/UE",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "unregistered_partner",
      familyDetails: "Convivo desde hace 2 años con mi pareja española, empadronados juntos.",
      comments:
        "[objetivo:regularizar] Queremos tramitar la tarjeta de familiar de ciudadano de la UE.",
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["FAMILIAR UE 2025", "PAREJA DE HECHO"],
    },
  },
  {
    id: "familiar-ue-pareja-2",
    name: "Cónyuge español, recién casados",
    tags: ["form", "familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "spouse",
      familyDetails: "Casados hace 3 meses, convivencia acreditada.",
      comments:
        "[objetivo:regularizar] Estamos casados y convivimos, quiero la tarjeta de familiar UE.",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["FAMILIAR UE 2025"],
    },
  },
  {
    id: "reagrupacion-familiar-1",
    name: "Residente reagrupar cónyuge e hijos",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      hasFamilyInSpain: false,
      comments:
        "[objetivo:familiares] Tengo residencia y contrato indefinido, quiero reagrupar a mi cónyuge e hijos en origen.",
      primaryGoal: "familiares",
      jobSituation: "contrato indefinido",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["REAGRUPACIÓN FAMILIAR"],
    },
  },
  {
    id: "reagrupacion-familiar-2",
    name: "Residente reagrupar padres mayores",
    tags: ["form", "familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      hasFamilyInSpain: false,
      comments:
        "[objetivo:familiares] Llevo 5 años con residencia y quiero reagrupar a mis padres de 70 años.",
      jobSituation: "contrato indefinido",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["REAGRUPACIÓN FAMILIAR"],
    },
  },
  {
    id: "nacionalidad-matrimonio-1",
    name: "Residente casado con española (1+ año)",
    tags: ["form", "nacionalidad", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "spouse",
      comments:
        "[objetivo:nacionalidad] Casado con española hace más de un año, convivimos y quiero tramitar la nacionalidad.",
      primaryGoal: "nacionalidad",
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["NACIONALIDAD POR MATRIMONIO", "NACIONALIDAD 2024"],
    },
  },
  {
    id: "nacionalidad-residencia-2",
    name: "Latinoamericana 2 años residente legal",
    tags: ["form", "nacionalidad"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      hasFamilyInSpain: false,
      comments:
        "[objetivo:nacionalidad] Soy de país iberoamericano, llevo 2 años de residencia legal y quiero nacionalidad.",
      primaryGoal: "nacionalidad",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["NACIONALIDAD 2024"],
    },
  },

  // ===== ESTUDIOS =====
  {
    id: "estudiar-desde-origen-1",
    name: "Visado de estudios máster desde origen",
    tags: ["form", "estudios", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Tengo admisión a un máster y seguro médico, quiero visado de estudiante.",
      primaryGoal: "entrada",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ESTUDIAR EN ESPAÑA"],
    },
  },
  {
    id: "estudiar-desde-origen-2",
    name: "Preinscripción FP desde origen",
    tags: ["form", "estudios"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Preinscripción a un FP de grado superior en España, necesito el visado.",
      primaryGoal: "entrada",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ESTUDIAR EN ESPAÑA"],
    },
  },
  {
    id: "modificar-estudios-a-ajena-1",
    name: "Estudiante con oferta de trabajo",
    tags: ["form", "estudios", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      jobSituation: "oferta de contrato full-time",
      comments:
        "[objetivo:regularizar] Estudio un grado y tengo oferta de contrato. Quiero modificar a cuenta ajena.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICAR DE ESTUDIOS A CUENTA AJENA"],
    },
  },
  {
    id: "modificar-estudios-a-ajena-2",
    name: "Graduada máster con contrato firmado",
    tags: ["form", "estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      jobSituation: "contrato firmado como ingeniera",
      comments:
        "[objetivo:regularizar] Terminé máster y tengo contrato firmado, quiero cambiar a cuenta ajena.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICAR DE ESTUDIOS A CUENTA AJENA"],
    },
  },
  {
    id: "renovacion-estudiante-1",
    name: "Renovación tarjeta estudiante grado",
    tags: ["form", "estudios", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      jobSituation: "estudiante con trabajo parcial",
      comments:
        "[objetivo:regularizar] Mi tarjeta de estudiante vence pronto y sigo matriculado, necesito renovar.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["RENOVACIÓN DE ESTUDIOS"],
    },
  },
  {
    id: "renovacion-estudiante-2",
    name: "Renovación FP con prácticas",
    tags: ["form", "estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      comments:
        "[objetivo:regularizar] Estoy en FP y tengo prácticas, necesito prórroga de estudios.",
      jobSituation: "prácticas remuneradas 20h",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["RENOVACIÓN DE ESTUDIOS"],
    },
  },

  // ===== TRABAJO DESDE ORIGEN =====
  {
    id: "hq-worker-1",
    name: "Profesional altamente cualificado 70k",
    tags: ["form", "trabajo", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      jobSituation: "oferta de multinacional 70.000€ director de tecnología",
      comments:
        "[objetivo:entrada] Oferta cualificada en España y quiero ir con mi familia.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO"],
    },
  },
  {
    id: "hq-worker-2",
    name: "Directiva financiera 90k con familia",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "directora financiera, salario 90k, oferta en Madrid",
      comments:
        "[objetivo:entrada] Oferta como directiva en multinacional, quiero llevar a mi cónyuge e hijos.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO"],
    },
  },
  {
    id: "investor-1",
    name: "Compra vivienda 650k",
    tags: ["form", "trabajo", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "inversión inmobiliaria 650000€",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Quiero invertir 650.000€ en una vivienda en Madrid y obtener residencia como inversor.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA INVERSORES"],
    },
  },
  {
    id: "investor-2",
    name: "Bono público 1M€",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "compra de bonos públicos 1.000.000€",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Invertiré 1 millón de euros en bonos del Estado español y quiero la residencia de inversor.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA INVERSORES"],
    },
  },
  {
    id: "nomada-digital-1",
    name: "Trabajo remoto con contrato extranjero",
    tags: ["form", "trabajo", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "empleada remota con contrato extranjero y salario 3200€",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Trabajo en remoto para empresa de EEUU y quiero vivir en España como nómada digital.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["NÓMADA DIGITAL"],
    },
  },
  {
    id: "nomada-digital-2",
    name: "Freelance facturación 4k remoto",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "freelance IT facturación 4000€ mensuales",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Trabajo freelance remoto con clientes en Europa, quiero ir como nómada digital.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["NÓMADA DIGITAL"],
    },
  },
  {
    id: "emprender-1",
    name: "Plan de negocio cafetería",
    tags: ["form", "trabajo", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "plan de negocio de cafetería en Valencia",
      comments:
        "[objetivo:entrada] Tengo plan de negocio y capital para abrir una cafetería en Valencia.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMPRENDER EN ESPAÑA"],
    },
  },
  {
    id: "emprender-2",
    name: "Startup tecnológica con inversión semilla",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "startup IA con inversión semilla 150k",
      comments:
        "[objetivo:entrada] Tengo inversión semilla y plan de negocio para lanzar una startup en Barcelona.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMPRENDER EN ESPAÑA"],
    },
  },

  // ===== PROTECCIÓN =====
  {
    id: "asilo-1",
    name: "Solicitante de asilo político",
    tags: ["form", "proteccion", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      locationStatus: "spain",
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      comments:
        "Salí de mi país por persecución política y quiero orientación sobre asilo.",
      jobSituation: "sin empleo",
      primaryGoal: "proteccion",
    }),
    expectation: { expectedFlow: "ASYLUM", mustInclude: ["ASILO"] },
  },
  {
    id: "asilo-2",
    name: "Asilo por persecución LGTBI",
    tags: ["form", "proteccion"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      locationStatus: "spain",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
      comments:
        "Persecución LGTBI en mi país, temo por mi seguridad y busco asilo en España.",
      jobSituation: "sin empleo",
      primaryGoal: "proteccion",
    }),
    expectation: { expectedFlow: "ASYLUM", mustInclude: ["ASILO"] },
  },
];

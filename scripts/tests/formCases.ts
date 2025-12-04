import { ImmigrationStatus, TimeInSpain } from "../../types";
import { makeProfile } from "./fixtures";
import { AiTestCase } from "./types";

// Suite ampliada para cubrir más plantillas y variaciones.
export const formCases: AiTestCase[] = [
  // ===== ARRAIGOS =====
  {
    id: "arraigo-social-1",
    name: "Irregular 3.5 anos empadronado, trabajo informal",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "hosteleria sin contrato",
      comments:
        "[objetivo:regularizar] Llevo mas de 3 anos en Espana, siempre empadronado. Trabajo sin contrato y quiero regularizarme.",
    }),
    expectation: { expectedFlow: "ARRAIGOS", mustInclude: ["ARRAIGO SOCIAL"] },
  },
  {
    id: "arraigo-social-2",
    name: "Irregular 3 anos, con oferta firmada",
    tags: ["form", "arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "oferta de contrato en restaurante",
      comments:
        "[objetivo:regularizar] Tengo oferta de contrato y 3 anos empadronado.",
    }),
    expectation: { expectedFlow: "ARRAIGOS", mustInclude: ["ARRAIGO SOCIAL"] },
  },
  {
    id: "arraigo-sociolaboral-1",
    name: "Irregular 2.5 anos con denuncia laboral",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      jobSituation: "construccion, denuncia laboral presentada",
      comments:
        "[objetivo:regularizar] Llevo 2 anos y medio, trabaje sin contrato y ya tengo denuncia en inspeccion.",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOLABORAL"],
    },
  },
  {
    id: "arraigo-sociolaboral-2",
    name: "Irregular 2 anos, sentencia a favor",
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
    name: "Irregular 2+ anos con preinscripcion 600h",
    tags: ["form", "arraigos", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      comments:
        "[objetivo:regularizar] Llevo mas de 2 anos en Espana y tengo preinscripcion en un curso de 600h para formarme.",
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
    name: "Irregular 2.2 anos, FP superior confirmado",
    tags: ["form", "arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      isEmpadronado: true,
      comments:
        "[objetivo:regularizar] Tengo admision a un FP superior de 2000h y llevo mas de 2 anos aqui.",
      jobSituation: "trabajos esporadicos, listo para estudiar",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO SOCIOFORMATIVO"],
    },
  },

  // ===== FAMILIA / UE =====
  {
    id: "arraigo-familiar-hijo-1",
    name: "Padre/madre de hijo espanol",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "parent_of_spanish",
      familyDetails: "Hijo espanol de 2 anos, convivimos en Madrid.",
      comments:
        "[objetivo:regularizar] Estoy irregular, convivo con mi hijo espanol y necesito residencia para cuidarlo.",
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["ARRAIGO FAMILIAR", "HIJO DE ESPANOL DE ORIGEN"],
    },
  },
  {
    id: "arraigo-familiar-hijo-2",
    name: "Madre irregular, hijo espanol recien nacido",
    tags: ["form", "familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "parent_of_spanish",
      familyDetails: "Bebe espanol de 4 meses, dependencia economica total.",
      comments:
        "[objetivo:regularizar] Llegue hace 6 meses, mi bebe nacio en Espana, necesito residencia.",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["ARRAIGO FAMILIAR", "HIJO DE ESPANOL DE ORIGEN"],
    },
  },
  {
    id: "familiar-ue-pareja-1",
    name: "Pareja no registrada de espanol/UE",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "unregistered_partner",
      familyDetails: "Convivo desde hace 2 anos con mi pareja espanola, empadronados juntos.",
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
    name: "Conyuge espanol, recien casados",
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
    name: "Residente reagrupar conyuge e hijos",
    tags: ["form", "familia", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      hasFamilyInSpain: false,
      comments:
        "[objetivo:familiares] Tengo residencia y contrato indefinido, quiero reagrupar a mi conyuge e hijos en origen.",
      primaryGoal: "familiares",
      jobSituation: "contrato indefinido",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["REAGRUPACION FAMILIAR"],
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
        "[objetivo:familiares] Llevo 5 anos con residencia y quiero reagrupar a mis padres de 70 anos.",
      jobSituation: "contrato indefinido",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["REAGRUPACION FAMILIAR"],
    },
  },
  {
    id: "nacionalidad-matrimonio-1",
    name: "Residente casado con espanola (1+ ano)",
    tags: ["form", "nacionalidad", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "spouse",
      comments:
        "[objetivo:nacionalidad] Casado con espanola hace mas de un ano, convivimos y quiero tramitar la nacionalidad.",
      primaryGoal: "nacionalidad",
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["NACIONALIDAD POR MATRIMONIO", "NACIONALIDAD 2024"],
    },
  },
  {
    id: "nacionalidad-residencia-2",
    name: "Latinoamericana 2 anos residente legal",
    tags: ["form", "nacionalidad"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      hasFamilyInSpain: false,
      comments:
        "[objetivo:nacionalidad] Soy de pais iberoamericano, llevo 2 anos de residencia y quiero nacionalidad.",
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
    name: "Visado de estudios master desde origen",
    tags: ["form", "estudios", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Tengo admision a un master y seguro medico, quiero visado de estudiante.",
      primaryGoal: "entrada",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ESTUDIAR EN ESPANA"],
    },
  },
  {
    id: "estudiar-desde-origen-2",
    name: "Preinscripcion FP desde origen",
    tags: ["form", "estudios"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Preinscripcion a un FP de grado superior en Espana, necesito el visado.",
      primaryGoal: "entrada",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ESTUDIAR EN ESPANA"],
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
    name: "Graduada master con contrato firmado",
    tags: ["form", "estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      jobSituation: "contrato firmado como ingeniera",
      comments:
        "[objetivo:regularizar] Termine master y tengo contrato firmado, quiero cambiar a cuenta ajena.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICAR DE ESTUDIOS A CUENTA AJENA"],
    },
  },
  {
    id: "renovacion-estudiante-1",
    name: "Renovacion tarjeta estudiante grado",
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
      mustInclude: ["RENOVACION DE ESTUDIOS"],
    },
  },
  {
    id: "renovacion-estudiante-2",
    name: "Renovacion FP con practicas",
    tags: ["form", "estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      comments:
        "[objetivo:regularizar] Estoy en FP y tengo practicas, necesito prorroga de estudios.",
      jobSituation: "practicas remuneradas 20h",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["RENOVACION DE ESTUDIOS"],
    },
  },

  // ===== TRABAJO DESDE ORIGEN / MOVILIDAD =====
  {
    id: "hq-worker-1",
    name: "Profesional altamente cualificado 70k",
    tags: ["form", "trabajo", "core"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      isEmpadronado: false,
      jobSituation: "oferta de multinacional 70.000 EUR director de tecnologia",
      comments:
        "[objetivo:entrada] Oferta cualificada en Espana y quiero ir con mi familia.",
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
        "[objetivo:entrada] Oferta como directiva en multinacional, quiero llevar a mi conyuge e hijos.",
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
      jobSituation: "inversion inmobiliaria 650000 EUR",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Quiero invertir 650.000 EUR en una vivienda en Madrid y obtener residencia como inversor.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA INVERSORES"],
    },
  },
  {
    id: "investor-2",
    name: "Bono publico 1M EUR",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "compra de bonos publicos 1000000 EUR",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Invertire 1 millon de euros en bonos del Estado y quiero la residencia de inversor.",
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
      jobSituation: "empleada remota con contrato extranjero y salario 3200 EUR",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Trabajo en remoto para empresa de EEUU y quiero vivir en Espana como nomada digital.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["NOMADA DIGITAL"],
    },
  },
  {
    id: "nomada-digital-2",
    name: "Freelance facturacion 4k remoto",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "freelance IT facturacion 4000 EUR mensuales",
      isEmpadronado: false,
      comments:
        "[objetivo:entrada] Trabajo freelance remoto con clientes en Europa, quiero ir como nomada digital.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["NOMADA DIGITAL"],
    },
  },
  {
    id: "emprender-1",
    name: "Plan de negocio cafeteria",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "plan de negocio de cafeteria en Valencia",
      comments:
        "[objetivo:entrada] Tengo plan de negocio y capital para abrir una cafeteria en Valencia.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMPRENDER EN ESPANA"],
    },
  },
  {
    id: "emprender-2",
    name: "Startup tecnologica con inversion semilla",
    tags: ["form", "trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "startup IA con inversion semilla 150k",
      comments:
        "[objetivo:entrada] Tengo inversion semilla y plan de negocio para lanzar una startup en Barcelona.",
      primaryGoal: "regularizar",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMPRENDER EN ESPANA"],
    },
  },

  // ===== PROTECCION =====
  {
    id: "asilo-1",
    name: "Solicitante de asilo politico",
    tags: ["form", "proteccion", "core"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      locationStatus: "spain",
      timeInSpain: TimeInSpain.LESS_THAN_SIX_MONTHS,
      comments:
        "Sali de mi pais por persecucion politica y quiero orientacion sobre asilo.",
      jobSituation: "sin empleo",
      primaryGoal: "proteccion",
    }),
    expectation: { expectedFlow: "ASYLUM", mustInclude: ["ASILO"] },
  },
  {
    id: "asilo-2",
    name: "Asilo por persecucion LGTBI",
    tags: ["form", "proteccion"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.ASYLUM_SEEKER,
      locationStatus: "spain",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
      comments:
        "Persecucion LGTBI en mi pais, temo por mi seguridad y busco asilo en Espana.",
      jobSituation: "sin empleo",
      primaryGoal: "proteccion",
    }),
    expectation: { expectedFlow: "ASYLUM", mustInclude: ["ASILO"] },
  },

  // ===== ARRAIGO SEGUNDA OPORTUNIDAD =====
  {
    id: "arraigo-segunda-1",
    name: "Perdio residencia, 3 anos en Espana",
    tags: ["arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      comments: "[objetivo:regularizar] Tuve residencia y la perdi hace un ano, sigo empadronado.",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO DE SEGUNDA OPORTUNIDAD"],
    },
  },
  {
    id: "arraigo-segunda-2",
    name: "Perdio tarjeta comunitaria, 4 anos en Espana",
    tags: ["arraigos"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      comments: "[objetivo:regularizar] Tuve tarjeta comunitaria y la perdi por no renovar, llevo 4 anos.",
    }),
    expectation: {
      expectedFlow: "ARRAIGOS",
      mustInclude: ["ARRAIGO DE SEGUNDA OPORTUNIDAD"],
    },
  },

  // ===== FAMILIARES DE CIUDADANOS ESPANOLES =====
  {
    id: "familiares-espanol-asc-1",
    name: "Madre a cargo de hijo espanol adulto",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "other",
      familyDetails: "Vivo con mi hijo espanol, dependo economicamente de el.",
      comments: "[objetivo:regularizar] Necesito residencia como ascendiente a cargo de hijo espanol.",
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA"],
    },
  },
  {
    id: "trabajar-tramite-1",
    name: "Puede trabajar con residencia en tramite (familiar UE)",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "spouse",
      comments: "Tengo resguardo de tarjeta de familiar UE en tramite, puedo trabajar?",
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["PUEDO TRABAJAR CON LA RESIDENCIA EN TRAMITE"],
    },
  },
  {
    id: "trabajar-tramite-2",
    name: "Quiere trabajar mientras tarjeta comunitaria en tramite",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "unregistered_partner",
      comments: "Tarjeta comunitaria en tramite, preguntan si puede trabajar.",
      timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["TRABAJAR CON RESIDENCIA DE FAMILIAR DE CIUDADANO DE LA UE EN TRAMITE"],
    },
  },

  // ===== POST ESTUDIOS / FAMILIA DE ESTUDIANTE / ERRORES =====
  {
    id: "despues-estudios-1",
    name: "Busca estancia despues de estudios",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      comments: "[objetivo:regularizar] Termine el master y quiero quedarme buscando empleo.",
      jobSituation: "buscando empleo",
    }),
    expectation: { expectedFlow: "STUDENT", mustInclude: ["DESPUES DE ESTUDIOS"] },
  },
  {
    id: "despues-estudios-2",
    name: "Post FP quiere despues de estudios",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      comments: "[objetivo:regularizar] Termine un FP y quiero permiso despues de estudios.",
      jobSituation: "buscando empleo",
    }),
    expectation: { expectedFlow: "STUDENT", mustInclude: ["DESPUES DE ESTUDIOS"] },
  },
  {
    id: "mod-familia-estudiante-1",
    name: "Conyuge de estudiante quiere permiso",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      hasFamilyInSpain: true,
      familyRelation: "spouse",
      comments: "Soy conyuge de estudiante y quiero saber como modificar a familiares de estudiante.",
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICACION DE FAMILIARES DE ESTUDIANTE"],
    },
  },
  {
    id: "error-resolucion-estudiante-1",
    name: "Error en resolucion de estudiante",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      comments: "Me denegaron la renovacion de estudiante por error en resolucion.",
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["ERROR EN LA RESOLUCION DE ESTUDIANTES"],
    },
  },
  {
    id: "mod-cuenta-propia-1",
    name: "Estudiante quiere cuenta propia",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      comments: "[objetivo:regularizar] Quiero emprender tras mis estudios con un negocio propio.",
      jobSituation: "plan de negocio propio",
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICAR DE ESTUDIOS A CUENTA PROPIA"],
    },
  },
  {
    id: "mod-cuenta-propia-2",
    name: "Estudiante autonomo con clientes",
    tags: ["estudios"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.STUDENT,
      comments: "[objetivo:regularizar] Tengo clientes y quiero pasar a autonomo al terminar el master.",
      jobSituation: "freelance con clientes",
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
    }),
    expectation: {
      expectedFlow: "STUDENT",
      mustInclude: ["MODIFICAR DE ESTUDIOS A CUENTA PROPIA"],
    },
  },

  // ===== OTROS FAMILIARES =====
  {
    id: "estar-a-cargo-1",
    name: "Ascendiente a cargo fuera de Espana",
    tags: ["familia"],
    profile: makeProfile({
      locationStatus: "origin",
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "other",
      comments: "[objetivo:familiares] Soy madre de ciudadano espanol, dependo de el, estoy fuera de Espana.",
      currentStatus: ImmigrationStatus.OTHER,
      isEmpadronado: false,
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ESTAR A CARGO"],
    },
  },

  // ===== TURISMO / ENTRADA =====
  {
    id: "entrar-como-turista-1",
    name: "Consulta requisitos entrada turista",
    tags: ["turismo"],
    profile: makeProfile({
      locationStatus: "origin",
      comments: "Quiero entrar como turista a Espana, requisitos y seguro.",
      currentStatus: ImmigrationStatus.OTHER,
      isEmpadronado: false,
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["ENTRAR COMO TURISTA"],
    },
  },
  {
    id: "autorizaciones-turista-1",
    name: "Turista en Espana pregunta opciones",
    tags: ["turismo"],
    profile: makeProfile({
      locationStatus: "spain",
      currentStatus: ImmigrationStatus.TOURIST,
      comments: "Estoy en Espana como turista, que autorizaciones tengo?",
      jobSituation: "turista",
    }),
    expectation: {
      expectedFlow: "TOURIST_IN_SPAIN",
      mustInclude: ["AUTORIZACIONES COMO TURISTA"],
    },
  },
  {
    id: "emigrar-sin-pasaporte-1",
    name: "Quiere emigrar sin pasaporte europeo",
    tags: ["trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      comments: "[objetivo:entrada] No tengo pasaporte europeo y quiero emigrar a Espana.",
      jobSituation: "sin oferta",
      isEmpadronado: false,
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMIGRAR SIN PASAPORTE EUROPEO"],
    },
  },

  // ===== ACTAS / NACIONALIDAD ESPECIAL =====
  {
    id: "busqueda-actas-1",
    name: "Busca actas para nacionalidad",
    tags: ["actas"],
    profile: makeProfile({
      locationStatus: "origin",
      comments: "Necesito actas y partidas de nacimiento de mis abuelos en Espana.",
      currentStatus: ImmigrationStatus.OTHER,
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["BUSQUEDA DE ACTAS"],
    },
  },
  {
    id: "nacionalidad-lmd-1",
    name: "Nieto de espanol por LMD",
    tags: ["nacionalidad"],
    profile: makeProfile({
      locationStatus: "origin",
      comments: "[objetivo:nacionalidad] Soy nieto de espanol, quiero aplicar por LMD.",
      currentStatus: ImmigrationStatus.OTHER,
      hasFamilyInSpain: false,
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["LEY DE MEMORIA DEMOCRATICA (LMD)"],
    },
  },
  {
    id: "nacionalidad-apellidos-1",
    name: "Nacionalidad por apellidos sefardi",
    tags: ["nacionalidad"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      comments: "[objetivo:nacionalidad] Mis apellidos son sefardies, quiero nacionalidad por apellidos.",
      timeInSpain: TimeInSpain.TWO_TO_THREE_YEARS,
      hasFamilyInSpain: false,
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["NACIONALIDAD POR APELLIDOS"],
    },
  },

  // ===== IDENTIDAD / OTROS =====
  {
    id: "cue-2025-1",
    name: "Ciudadano espanol pregunta por CUE",
    tags: ["documentacion"],
    profile: makeProfile({
      nationality: "Espana",
      currentStatus: ImmigrationStatus.RESIDENT,
      locationStatus: "spain",
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      isEmpadronado: true,
      comments: "Soy espanol y necesito informacion sobre CUE 2025.",
      jobSituation: "empleado",
    }),
    expectation: {
      expectedFlow: "SPANISH",
      mustInclude: ["CUE 2025"],
    },
  },
  {
    id: "homologacion-1",
    name: "Homologacion de titulo universitario",
    tags: ["homologacion"],
    profile: makeProfile({
      locationStatus: "spain",
      currentStatus: ImmigrationStatus.RESIDENT,
      comments: "Quiero homologar mi titulo universitario extranjero.",
      jobSituation: "ingeniero",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["HOMOLOGACION"],
    },
  },
  {
    id: "recurso-contencioso-1",
    name: "Denegacion de residencia, quiere recurso",
    tags: ["recurso"],
    profile: makeProfile({
      locationStatus: "spain",
      currentStatus: ImmigrationStatus.RESIDENT,
      comments: "Me denegaron la residencia, quiero presentar recurso contencioso.",
      jobSituation: "empleado",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["RECURSO CONTENCIOSO"],
    },
  },
  {
    id: "nomada-digital-turista-1",
    name: "Turista en Espana con trabajo remoto",
    tags: ["trabajo", "turismo"],
    profile: makeProfile({
      locationStatus: "spain",
      currentStatus: ImmigrationStatus.TOURIST,
      jobSituation: "trabajo remoto para empresa USA, 3500 EUR",
      comments: "[objetivo:regularizar] Estoy como turista y trabajo remoto, quiero nomada digital.",
    }),
    expectation: {
      expectedFlow: "TOURIST_IN_SPAIN",
      mustInclude: ["NOMADA DIGITAL"],
    },
  },
  {
    id: "investor-3",
    name: "Compra acciones 1.2M",
    tags: ["trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "inversion 1.2M en acciones espanolas",
      comments: "[objetivo:entrada] Inversion 1.2M en acciones, quiero residencia de inversor.",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA INVERSORES"],
    },
  },
  {
    id: "hq-worker-3",
    name: "Investigador senior 80k",
    tags: ["trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "oferta investigador senior 80000 EUR en universidad",
      comments: "[objetivo:entrada] Oferta altamente cualificada en universidad espanola.",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO"],
    },
  },
  {
    id: "nomada-digital-3",
    name: "Freelance diseno 2800 EUR",
    tags: ["trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "freelance diseno con facturacion 2800 EUR al mes",
      comments: "[objetivo:entrada] Trabajo remoto freelance y quiero nomada digital.",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["NOMADA DIGITAL"],
    },
  },
  {
    id: "emprender-3",
    name: "Startup biotech con rondas",
    tags: ["trabajo"],
    profile: makeProfile({
      locationStatus: "origin",
      currentStatus: ImmigrationStatus.OTHER,
      jobSituation: "startup biotech con inversion 200k",
      comments: "[objetivo:entrada] Quiero emprender en Espana con apoyo ENISA.",
    }),
    expectation: {
      expectedFlow: "OUTSIDE_SPAIN",
      mustInclude: ["EMPRENDER EN ESPANA"],
    },
  },
  {
    id: "familiar-ue-pareja-3",
    name: "Union estable 4 anos con espanol",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "unregistered_partner",
      familyDetails: "Union estable 4 anos, convivimos y estamos empadronados.",
      comments: "[objetivo:regularizar] Quiero tramitar tarjeta de familiar UE por union estable.",
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["FAMILIAR UE 2025"],
    },
  },
  {
    id: "reagrupacion-familiar-3",
    name: "Reagrupar ascendientes a cargo",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.MORE_THAN_THREE_YEARS,
      comments: "[objetivo:familiares] Quiero reagrupar a mis padres mayores a mi cargo.",
      jobSituation: "contrato indefinido",
    }),
    expectation: {
      expectedFlow: "RESIDENT",
      mustInclude: ["REAGRUPACION FAMILIAR"],
    },
  },
  {
    id: "nacionalidad-matrimonio-2",
    name: "Casada con espanol y con hijo",
    tags: ["nacionalidad"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.RESIDENT,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "spouse",
      comments: "[objetivo:nacionalidad] Casada con espanol y tenemos hijo espanol, quiero nacionalidad.",
      primaryGoal: "nacionalidad",
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["NACIONALIDAD POR MATRIMONIO"],
    },
  },
  {
    id: "arraigo-familiar-hijo-3",
    name: "Padre de menor espanol, 1 ano en Espana",
    tags: ["familia"],
    profile: makeProfile({
      currentStatus: ImmigrationStatus.IRREGULAR,
      timeInSpain: TimeInSpain.ONE_TO_TWO_YEARS,
      hasFamilyInSpain: true,
      familyNationality: "spanish_eu",
      familyRelation: "parent_of_spanish",
      comments: "[objetivo:regularizar] Tengo un hijo espanol de 1 ano, convivimos en Espana.",
    }),
    expectation: {
      expectedFlow: "FAMILY_OF_EU",
      mustInclude: ["ARRAIGO FAMILIAR"],
    },
  },
];

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { UserProfile, AIAnalysisResult, NextStepAction } from "../types";
import { TEMPLATE_SUMMARY_MAP, TEMPLATE_KEYS } from "./templates";
import { preClassify } from "./preClassify";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY or API_KEY must be set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const formatTimeRange = (time?: string): string => {
  const raw = (time || "").toLowerCase();
  if (!raw) return "No especificado";

  const numeric = parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, ""));
  const mapByNumeric = (value: number) => {
    if (value >= 3) return "Más de 3 años";
    if (value >= 2) return "Entre 2 y 3 años";
    if (value >= 1) return "Entre 1 y 2 años";
    if (value >= 0.5) return "Entre 6 y 12 meses";
    return "Menos de 6 meses";
  };

  if (raw.includes("more_than_three") || raw.includes("mas de 3") || raw.includes("más de 3")) {
    return "Más de 3 años";
  }
  if (raw.includes("two_to_three") || raw.includes("2 a 3") || raw.includes("2-3")) {
    return "Entre 2 y 3 años";
  }
  if (raw.includes("one_to_two") || raw.includes("1 a 2") || raw.includes("1-2")) {
    return "Entre 1 y 2 años";
  }
  if (raw.includes("six_to_twelve") || raw.includes("6") || raw.includes("twelve")) {
    return "Entre 6 y 12 meses";
  }
  if (raw.includes("less_than") || raw.includes("<") || raw.includes("menos de")) {
    return "Menos de 6 meses";
  }
  if (!Number.isNaN(numeric)) {
    return mapByNumeric(numeric);
  }
  return "No especificado";
};

const replaceDecimalYears = (text: string | undefined): string | undefined => {
  if (!text) return text;
  return text.replace(/(\d+[.,]\d+)\s*a(?:ñ|n)os?/gi, (_, num) => {
    const n = parseFloat(String(num).replace(",", "."));
    return formatTimeRange(String(Number.isNaN(n) ? num : n));
  });
};

const coerceNextStep = (action?: string): NextStepAction => {
  const normalized = (action || "").toUpperCase();
  if (normalized === NextStepAction.GATHER_DOCUMENTS) return NextStepAction.GATHER_DOCUMENTS;
  if (normalized === NextStepAction.MANUAL_REVIEW) return NextStepAction.MANUAL_REVIEW;
  return NextStepAction.SCHEDULE_CONSULTATION;
};

// 1. LISTA NEGRA: Templates administrativos que la IA TIENE PROHIBIDO elegir.
// Si el usuario quiere esto, la IA derivarÃ¡ a 'REVISION_MANUAL'.
const EXCLUDED_ADMIN_TEMPLATES = [
  "AGENDAR CITA", 
  "CITA AGENDADA",
  "PEDIDO PAGO", 
  "PRIMER PAGO NACIONALIDAD (UN EXPEDIENTE)", 
  "PRIMER PAGO NACIONALIDAD (VARIOS EXPEDIENTES)",
  "CLIENES", 
  "GESTOR DE CONFIANZA", 
  "REMITIR A JULIA", 
  "CUENTA BREVEMENTE"
];

const MANUAL_REVIEW_KEY = "REVISION_MANUAL";

// 2. REGLAS LEGALES ACTUALIZADAS
const TEMPLATE_RULES: Record<string, string> = {
  // --- SALIDA DE EMERGENCIA ---
  [MANUAL_REVIEW_KEY]:
    "REQUIERE: El usuario quiere AGENDAR CITA, realizar PAGOS, es un cliente recurrente, o su caso es tan complejo que requiere decision humana directa. Usalo tambien si NINGUN otro template encaja.",

  // --- ARRAIGOS (2 ANOS) ---
  "ARRAIGO SOCIAL":
    "REQUIERE: >=2 anos permanencia + Oferta empleo/Medios propios + Sin penales.",
  "ARRAIGO SOCIOFORMATIVO":
    "REQUIERE: >=2 anos permanencia + Compromiso formacion (600h/FP) + Sin penales.",
  "ARRAIGO SOCIOLABORAL":
    "PRIORIDAD ALTA si: >=2 años permanencia + Relación laboral (irregular o no). NO sugerir Actas ni Arraigo Social si cumple esto.",
  "ARRAIGO FAMILIAR":
    "REQUIERE: Hijo de espanol de origen O Padre/Madre de menor espanol. (Diferente a Familiar UE).",
  "ARRAIGO DE SEGUNDA OPORTUNIDAD":
    "REQUIERE: Haber tenido residencia previa y haberla perdido.",

  // --- ESTUDIOS ---
  "ESTUDIAR EN ESPANA":
    "REQUIERE: Estar FUERA o DENTRO como turista (<60 dias). Medios + Seguro + Matricula.",
  "DESPUES DE ESTUDIOS": "REQUIERE: Estancia estudios vigente. Para modificar a trabajo.",
  "MODIFICAR DE ESTUDIOS": "REQUIERE: Estancia estudios vigente.",
  "RENOVACION DE ESTUDIOS": "REQUIERE: Haber aprobado curso anterior.",

  // --- FAMILIARES ---
  "FAMILIAR UE 2025":
    "REQUIERE: Conyuge/pareja de ciudadano ESPANOL o UE. Si conviven en Espana, es la via principal.",
  "FAMILIARES DE CIUDADANOS CON NACIONALIDAD ESPANOLA":
    "REQUIERE: Familiar directo de espanol (ascendientes/descendientes a cargo). Para conyuge/pareja usa antes 'FAMILIAR UE 2025'.",
  "PAREJA DE HECHO":
    "REQUIERE: Convivencia (ej: 12 meses Madrid) + Empadronamiento conjunto + Solteria.",
  "REAGRUPACION FAMILIAR":
    "REQUIERE: Solicitante residente NO comunitario trae familia.",

  // --- NACIONALIDAD ---
  "NACIONALIDAD 2024":
    "REQUIERE: Residencia legal (10 anos general, 2 Iberoamerica).",
  "NACIONALIDAD POR MATRIMONIO":
    "REQUIERE: 1 ano residencia legal casado con espanol.",
  "LEY DE MEMORIA DEMOCRATICA (LMD)": "REQUIERE: Nieto/Bisnieto de espanol.",

  // --- VISADOS / MOVILIDAD ---
  "RESIDENCIA PARA INVERSORES":
    "REQUIERE: Inversion >=500k en inmuebles o >=1M en bonos/acciones. Si cumple, recomiendalo.",
  "NOMADA DIGITAL":
    "REQUIERE: Trabajo remoto empresa extranjera + Titulo/3 anos exp + >2600 EUR.",
  "RESIDENCIA PARA PROFESIONAL ALTAMENTE CUALIFICADO":
    "REQUIERE: Oferta gran empresa + >50k.",
  "EMPRENDER EN ESPANA": "REQUIERE: Plan innovador ENISA / emprendimiento real.",

  // --- OTROS ---
  "ASILO": "REQUIERE: Persecucion real. No usar por defecto.",
  "HOMOLOGACION": "Solo para tramites de titulos.",
  "FORMAS DE REGULARIZARSE": "Uso informativo general cuando no hay via clara.",
};

const buildAnalysisSchema = (allowedTemplateKeys: string[]): any => ({
  type: SchemaType.OBJECT,
  properties: {
    legalAnalysis: {
      type: SchemaType.OBJECT,
      properties: {
        timeCheck: { type: SchemaType.STRING, description: "CÃ¡lculo de aÃ±os y validaciÃ³n estricta." },
        criminalRecordCheck: { type: SchemaType.BOOLEAN, description: "TRUE si bloquea el trÃ¡mite." },
        intentCheck: { type: SchemaType.STRING, description: "Detecta si quiere: 'TRAMITE_LEGAL', 'PAGO', 'CITA', o 'CONSULTA_ADMINISTRATIVA'." }
      },
      required: ["timeCheck", "criminalRecordCheck", "intentCheck"]
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          probability: { type: SchemaType.STRING, enum: ["Alta", "Media", "Baja", "Nula"] },
          templateKey: { type: SchemaType.STRING, enum: allowedTemplateKeys },
          requirements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          estimatedTime: { type: SchemaType.STRING },
        },
        required: ["title", "description", "probability", "templateKey"]
      },
    },
    summary: { type: SchemaType.STRING, description: "Resumen completo para la abogada." },
    criticalAdvice: { type: SchemaType.STRING },
    missingInfoWarning: { type: SchemaType.STRING },
    nextStepAction: { type: SchemaType.STRING, enum: ["SCHEDULE_CONSULTATION", "GATHER_DOCUMENTS", "MANUAL_REVIEW"] },
    actionReasoning: { type: SchemaType.STRING },
  },
  required: ["legalAnalysis", "recommendations", "summary", "criticalAdvice", "nextStepAction", "actionReasoning"],
});

export const analyzeImmigrationProfile = async (
  profile: UserProfile,
): Promise<AIAnalysisResult> => {
  const pre = preClassify(profile);
  const timeDisplay = formatTimeRange(profile.timeInSpain);
  
  // 1. FILTRO DE SEGURIDAD: quitamos administrativos y añadimos fallback manual
  const rawCandidates = Array.from(new Set([
    ...(pre.candidateTemplates || []),
    "FORMAS DE REGULARIZARSE",
    MANUAL_REVIEW_KEY,
  ]));

  const allowedTemplates = rawCandidates.filter(key => !EXCLUDED_ADMIN_TEMPLATES.includes(key));

  // 2. CONTEXTO PARA LA IA
  const rulesContext = allowedTemplates.map(key => {
    const ruleKey = Object.keys(TEMPLATE_RULES).find(k => key.includes(k)) || MANUAL_REVIEW_KEY;
    return `- "${key}": ${TEMPLATE_RULES[ruleKey]}`;
  }).join("\n");

  const prompt = `
    ACTUA COMO UN JUEZ DE EXTRANJERIA (FILTRO DE ENTRADA).

    PERFIL:
    - Nacionalidad: ${profile.nationality}
    - Tiempo en España: ${timeDisplay} (${profile.entryDate || "sin fecha"})
    - Estatus: ${profile.currentStatus}
    - Penales: ${profile.hasCriminalRecord ? "SI" : "No"}
    - Familia: ${profile.hasFamilyInSpain ? "SI" : "No"} (${profile.familyNationality}, ${profile.familyRelation})
    - COMENTARIOS: "${profile.comments} ${profile.familyDetails}"

    OPCIONES VALIDAS (Templates Legales):
    ${rulesContext}

    INSTRUCCIONES CRITICAS (LISTA NEGRA):
    1. SI EL USUARIO QUIERE PAGAR O AGENDAR CITA:
       - NO enviar plantilla automatica.
       - ACCION: Selecciona "${MANUAL_REVIEW_KEY}".
       - En summary: "SOLICITUD ADMINISTRATIVA: Usuario desea pagar/agendar. Requiere gestion manual".
    2. VALIDACION LEGAL:
       - Si pide Arraigo pero lleva < 2 anos -> "${MANUAL_REVIEW_KEY}" o "FORMAS DE REGULARIZARSE" (No recomiendes Arraigo).
       - Si tiene antecedentes -> "${MANUAL_REVIEW_KEY}" (Requiere revision de abogado).
    3. CASOS COMPLEJOS:
       - Si dudas o la informacion es contradictoria, usa "${MANUAL_REVIEW_KEY}".
    4. FORMATO DE TIEMPO EN ESPAÑA:
       - NUNCA uses decimales (ej: "2.15 años"). Usa rangos: "Menos de 6 meses", "Entre 1 y 2 años", "Entre 2 y 3 años", "Más de 3 años".
    
    INSTRUCCIONES CRITICAS (JERARQUIA DE DECISION):
    1. REGLA DE NACIONALIDAD:
       - Ser de Argentina/Latinoamerica NO implica "BUSQUEDA DE ACTAS" ni "LMD" salvo que el usuario pida explícitamente "ciudadanía", "abuelos" o "pasaporte".
       - Si busca regularizarse por trabajo/arraigo, IGNORA la nacionalidad para elegir el template.

    2. REGLA DE TIEMPO (CRUCIAL):
       - Tiempo < 2 años: Arraigo Formación (si quiere estudiar) o Formas de Regularizarse.
       - Tiempo 2 a 3 años (ej: 2.17): SOLO Arraigo Sociolaboral (si trabajó) o Socioformativo. JAMAS sugieras Arraigo Social (requiere 3).
       - Tiempo > 3 años: Arraigo Social es posible.

    3. PRIORIDAD LABORAL:
       - Si lleva > 2 años Y menciona trabajo/jefe/despido/negro/irregular -> EL TRAMITE ES "ARRAIGO SOCIOLABORAL". Priorízalo sobre cualquier otro.

    TU TAREA:
    Analiza el perfil. Si es un tramite legal claro y cumple requisitos, elige el template.
    Si es Cita, Pago o no cumple requisitos duros, elige "${MANUAL_REVIEW_KEY}".
  `;

  const sanitizeRecommendations = (result: AIAnalysisResult) => {
    const allowed = allowedTemplates.filter(k => k !== MANUAL_REVIEW_KEY);
    const primary = allowed[0] || allowedTemplates[0] || MANUAL_REVIEW_KEY;

    const intent = (result as any)?.legalAnalysis?.intentCheck || "";
    const hasAdminIntent = typeof intent === "string" && (intent.toUpperCase().includes("PAGO") || intent.toUpperCase().includes("CITA"));
    const hasPenal = profile.hasCriminalRecord === true || (result as any)?.legalAnalysis?.criminalRecordCheck === true;

    if (hasAdminIntent || hasPenal || primary === MANUAL_REVIEW_KEY) {
      return result;
    }

    const normalizedAllowed = new Set(allowed.map(k => k.toUpperCase()));
    const recs = (result.recommendations || []).map((rec, idx) => {
      const normalized = (rec.templateKey || "").toUpperCase();
      const mapped = normalizedAllowed.has(normalized) ? rec.templateKey : primary;
      return { ...rec, templateKey: idx === 0 ? primary : mapped };
    });

    const ensured = recs.length > 0 ? recs : [{
      title: primary,
      description: "Recomendacion prioritaria segun el perfil.",
      probability: "Alta",
      templateKey: primary,
      requirements: [],
      estimatedTime: "N/A",
    } as any];

    const rawNext = coerceNextStep(result.nextStepAction as any);
    const nextStep =
      rawNext === NextStepAction.MANUAL_REVIEW
        ? NextStepAction.GATHER_DOCUMENTS
        : rawNext;

    return { ...result, recommendations: ensured, nextStepAction: nextStep };
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: buildAnalysisSchema(allowedTemplates),
        temperature: 0.0,
      },
    });

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text() || '{}');

    // Post-procesamiento: si hay intencion administrativa clara, forzar manual
    const intentCheck = (parsed as any)?.legalAnalysis?.intentCheck || "";
    if (typeof intentCheck === "string" && (intentCheck.includes("PAGO") || intentCheck.includes("CITA"))) {
      if (parsed.recommendations && parsed.recommendations[0]) {
        parsed.recommendations[0].templateKey = MANUAL_REVIEW_KEY;
      }
      parsed.nextStepAction = NextStepAction.MANUAL_REVIEW;
      return parsed;
    }

    const normalized = sanitizeRecommendations(parsed);
    if (normalized.legalAnalysis) {
      const fixedTime = replaceDecimalYears(`Tiempo en España: ${timeDisplay}`) || `Tiempo en España: ${timeDisplay}`;
      normalized.legalAnalysis.timeCheck = fixedTime;
    }
    normalized.summary = replaceDecimalYears(normalized.summary) || normalized.summary;
    normalized.criticalAdvice = replaceDecimalYears(normalized.criticalAdvice) || normalized.criticalAdvice;
    return normalized;

  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};

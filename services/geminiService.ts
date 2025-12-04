// geminiService.ts

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { UserProfile } from "../types";
import { TEMPLATE_KEYS } from "./templates";
import { preClassify } from "./preClassify";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY or API_KEY must be set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

// 1. NUEVO SCHEMA: Estricto y Binario
const buildAnalysisSchema = (allowedTemplateKeys: string[]): any => ({
  type: SchemaType.OBJECT,
  properties: {
    // El veredicto es la sentencia final. Sin grises.
    verdict: {
      type: SchemaType.STRING,
      enum: ["VIABLE", "NO_VIABLE", "REVISION_MANUAL"],
      description: "Decisión final basada en reglas estrictas de extranjería.",
    },
    // Si es NO_VIABLE, aquí va la razón técnica (ej: 'Falta tiempo de estancia').
    rejectionReason: {
      type: SchemaType.STRING,
      description: "Si el veredicto es NO_VIABLE, explica la regla legal incumplida. Si es VIABLE, déjalo vacío.",
    },
    summary: {
      type: SchemaType.STRING,
      description: "Resumen técnico de la situación (máximo 2 líneas).",
    },
    // Solo se llena si es VIABLE
    assignedTemplate: {
      type: SchemaType.STRING,
      enum: [...allowedTemplateKeys, "NINGUNA"],
      description: "La plantilla única que aplica si el caso es VIABLE.",
    },
    missingInfoWarning: {
      type: SchemaType.STRING,
      description: "Si el veredicto es REVISION_MANUAL, indica qué dato falta.",
    },
  },
  required: [
    "verdict",
    "summary",
    "assignedTemplate",
  ],
});

// Helpers (se mantienen igual para limpiar strings)
const buildAllowedTemplates = (candidates: string[]) => {
  const allowedSet = new Set(TEMPLATE_KEYS.map((k) => k.toUpperCase()));
  const filtered = new Set<string>();
  candidates.forEach((k) => {
    if (allowedSet.has(k.toUpperCase())) filtered.add(k);
  });
  if (!filtered.size) TEMPLATE_KEYS.forEach((k) => filtered.add(k));
  return Array.from(filtered);
};

export const analyzeImmigrationProfile = async (
  profile: UserProfile,
): Promise<any> => { // Nota: He cambiado el tipo de retorno a 'any' o crea una interface nueva para este resultado estricto
  
  const pre = preClassify(profile);
  const allowedTemplates = buildAllowedTemplates(pre.candidateTemplates || []);
  
  // Mapeo de reglas duras para el contexto
  const subsetSummary = allowedTemplates
    .filter((key) => key !== "SIN_PLANTILLA")
    .map((key) => `- ${key}`)
    .join("\n");

  // 2. EL NUEVO PROMPT DE "DESCARTE"
  const prompt = `
ROL: Eres un JUEZ DE ADMISIÓN de trámites de extranjería (Validador Lógico).
TU TAREA: Determinar si el perfil CUMPLE (VIABLE) o NO CUMPLE (NO_VIABLE) con los requisitos legales estrictos.

OBJETIVO: Aplicar lógica de "DESCARTE". Busca activamente razones para denegar. Si pasa todos los filtros, entonces es VIABLE.

INPUTS DEL CIUDADANO:
${JSON.stringify(profile, null, 2)}

OPCIONES DE TRÁMITE POSIBLES (Solo si es VIABLE):
${allowedTemplates.join(", ")}

---
REGLAS DE DESCARTE (SI SE CUMPLE UNA, EL VEREDICTO ES "NO_VIABLE"):

1. REGLA DE UBICACIÓN (ORIGEN):
   - Si locationStatus == "origin" Y el usuario pide "Arraigo" -> NO_VIABLE (Razón: Los arraigos requieren estar en España).
   - Si locationStatus == "origin" Y no tiene ingresos altos, ni oferta cualificada, ni familiar UE -> REVISION_MANUAL (Posible falta de vías).

2. REGLA DEL TIEMPO (IRREGULARIDAD):
   - Si currentStatus == "irregular" Y timeInSpain < 2 años:
     * ¿Tiene hijo español? -> VIABLE (Arraigo Familiar).
     * ¿Tiene pareja registrada española/UE? -> VIABLE (Familiar UE).
     * ¿Pide Asilo? -> VIABLE (Asilo).
     * SI NO CUMPLE LO ANTERIOR -> NO_VIABLE (Razón: No cumple tiempo mínimo para Arraigos Sociales/Laborales/Formación).
   
   - Si currentStatus == "irregular" Y timeInSpain >= 2 años y < 3 años:
     * Solo es VIABLE para "ARRAIGO PARA LA FORMACION" o "ARRAIGO SOCIOLABORAL" (si tiene oferta).
     * Si pide "Arraigo Social" -> NO_VIABLE (Requiere 3 años).

3. REGLA DE ANTECEDENTES:
   - Si hasCriminalRecord == true -> REVISION_MANUAL (Bloqueante para la mayoría, pero requiere análisis humano).

4. REGLA DE FAMILIA:
   - Si dice tener familia UE pero NO aporta detalles ni prueba de vínculo en 'familyDetails' -> REVISION_MANUAL.

---
INSTRUCCIONES PARA EL VEREDICTO FINAL:

- **VIABLE**: El usuario cumple los requisitos de tiempo, ubicación y vínculo para UNA de las plantillas de la lista. Asigna esa plantilla en 'assignedTemplate'.
- **NO_VIABLE**: El usuario incumple una regla dura (tiempo insuficiente, ubicación incorrecta). Asigna "NINGUNA" a 'assignedTemplate' y explica la razón en 'rejectionReason'.
- **REVISION_MANUAL**: El caso es ambiguo, contradictorio o faltan datos críticos.

IMPORTANTE: No inventes. Es binario. Se puede o no se puede.

SALIDA ESPERADA (JSON):
Responde solo con el objeto JSON definido en el schema.
`;

  try {
    const analysisSchema = buildAnalysisSchema(allowedTemplates);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Modelo rápido y lógico
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.0, // TEMPERATURA 0 PARA MÁXIMA DETERMINACIÓN (CERO CREATIVIDAD)
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text);

    // Adaptador para que tu frontend/n8n no se rompa si esperan el formato antiguo
    // Transformamos el veredicto estricto a la estructura de 'recommendations' que n8n ya sabe leer
    return {
      summary: parsed.summary,
      verdict: parsed.verdict, // Campo nuevo útil para n8n
      recommendations: parsed.assignedTemplate && parsed.assignedTemplate !== "NINGUNA" 
        ? [{
            title: parsed.assignedTemplate,
            description: parsed.rejectionReason || "Cumple con los requisitos establecidos.",
            probability: "Alta", // Hardcodeado para compatibilidad
            templateKey: parsed.assignedTemplate,
            requirements: [], // Ya no son necesarios si es una sentencia
            documents: [],
            estimatedTime: "N/A"
          }] 
        : [], // Si es NO_VIABLE, array vacío
      criticalAdvice: parsed.rejectionReason || parsed.missingInfoWarning || "",
      nextStepAction: parsed.verdict === "VIABLE" ? "GATHER_DOCUMENTS" : "SCHEDULE_CONSULTATION",
      actionReasoning: parsed.summary
    };

  } catch (error) {
    console.error("Error analysing profile:", error);
    throw new Error("Error en el análisis de viabilidad.");
  }
};
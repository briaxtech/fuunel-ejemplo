import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, AIAnalysisResult } from "../types";
import { TEMPLATE_SUMMARY_MAP, TEMPLATE_KEYS } from "./templates";
import { preClassify } from "./preClassify";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
});

const buildAnalysisSchema = (allowedTemplateKeys: string[]): Schema => ({
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen breve y empatico de la situacion legal actual del usuario en Espana, mencionando sus puntos clave (tiempo, estatus, etc).",
    },
    recommendations: {
      type: Type.ARRAY,
      description: "Lista de posibles tramites de extranjeria recomendados.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Nombre oficial del tramite (ej: Arraigo Social)." },
          description: { type: Type.STRING, description: "Explicacion de por que aplica este tramite." },
          probability: {
            type: Type.STRING,
            enum: ["Alta", "Media", "Baja"],
            description: "Probabilidad de exito estimada basada en los datos."
          },
          templateKey: {
            type: Type.STRING,
            enum: allowedTemplateKeys,
            description: "El 'template_key' EXACTO del archivo CSV que corresponde a este tramite. Si NINGUNA plantilla encaja perfectamente, usa 'SIN_PLANTILLA'. NO inventes nuevos nombres."
          },
          requirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de 3-5 requisitos legales clave (ej: 3 anos de permanencia)."
          },
          documents: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista exacta de documentos fisicos necesarios (ej: Certificado de Antecedentes Penales apostillado, Pasaporte completo)."
          },
          estimatedTime: { type: Type.STRING, description: "Tiempo estimado de resolucion (ej: 3-6 meses)." }
        },
        required: ["title", "description", "probability", "templateKey", "requirements", "documents", "estimatedTime"]
      }
    },
    criticalAdvice: {
      type: Type.STRING,
      description: "Consejo crucial o advertencia legal importante (ej: Mantener el empadronamiento actualizado, no tener antecedentes penales).",
    },
    missingInfoWarning: {
      type: Type.STRING,
      description: "Si falta informacion critica para dar un consejo preciso, mencionarlo aqui.",
    },
    nextStepAction: {
      type: Type.STRING,
      enum: ["SCHEDULE_CONSULTATION", "GATHER_DOCUMENTS"],
      description: "Decision sobre el siguiente paso. 'SCHEDULE_CONSULTATION' si hay al menos una via con probabilidad Alta/Media y el usuario cumple requisitos basicos. 'GATHER_DOCUMENTS' si la probabilidad es Baja o faltan requisitos esenciales (ej: tiempo de estancia insuficiente) y es mejor esperar antes de contratar abogado."
    },
    actionReasoning: {
      type: Type.STRING,
      description: "Breve explicacion (1 frase) de por que se sugiere agendar cita o esperar/recolectar documentos."
    }
  },
  required: ["summary", "recommendations", "criticalAdvice", "nextStepAction", "actionReasoning"]
});

const buildAllowedTemplates = (candidates: string[]) => {
  const allowedSet = new Set(TEMPLATE_KEYS.map(k => k.toUpperCase()));
  const filtered = new Set<string>();
  candidates.forEach(k => {
    if (allowedSet.has(k.toUpperCase())) filtered.add(k);
  });
  if (!filtered.size) {
    TEMPLATE_KEYS.forEach(k => filtered.add(k));
  }
  filtered.add("SIN_PLANTILLA");
  return Array.from(filtered);
};

export const analyzeImmigrationProfile = async (profile: UserProfile): Promise<AIAnalysisResult> => {
  const pre = preClassify(profile);
  const allowedTemplates = buildAllowedTemplates(pre.candidateTemplates || []);
  const subsetSummary = allowedTemplates
    .filter(key => key !== "SIN_PLANTILLA")
    .map(key => `- ${key}: ${TEMPLATE_SUMMARY_MAP[key] || ''}`)
    .join('\n');

  const prompt = `
    Actua como un abogado experto en extranjeria e inmigracion en Espana (Extranjeria).
    Tu objetivo es analizar el perfil del cliente y seleccionar la plantilla de respuesta (templateKey) MAS ADECUADA del catalogo proporcionado.

    IMPORTANTE:
    1. Tu prioridad ABSOLUTA es elegir el 'templateKey' correcto.
    2. Solo puedes usar estos templateKey permitidos para este caso: ${allowedTemplates.join(', ')}.
    3. Si NO estas 100% seguro o ninguna plantilla encaja bien, usa "SIN_PLANTILLA".
    4. ES PREFERIBLE "SIN_PLANTILLA" A ENVIAR INFORMACION INCORRECTA.

    REGLAS ESTRICTAS DE REQUISITOS (usa el catalogo como verdad):
    - ARRAIGO SOCIAL: requiere 2 años de permanencia y empadronamiento (NO 3). No digas "faltan X meses" a menos que el perfil lo indique en los datos.
    - Si el perfil no cumple el tiempo mínimo, di claramente que no cumple ese requisito en lugar de inventar plazos.
    - No modifiques los requisitos descritos en el catalogo; los requisitos que menciones deben coincidir con las descripciones proporcionadas.

    CONTEXTO DE PRECLASIFICACION:
    - Categoria de flujo: ${pre.flowCategory}
    - Plantillas candidatas permitidas:
    ${subsetSummary}

    Perfil del Usuario a Analizar:
    - Nacionalidad: ${profile.nationality}
    - Edad: ${profile.age}
    - Nivel de Estudios: ${profile.educationLevel}
    - Fecha de entrada aproximada: ${profile.entryDate}
    - Provincia de residencia: ${profile.province}
    - Estatus Actual: ${profile.currentStatus}
    - Tiempo en Espana: ${profile.timeInSpain}
    - Ubicacion Actual: ${profile.locationStatus === 'origin' ? "Pais de Origen" : "Espana"}
    - Empadronado: ${profile.isEmpadronado ? "Si" : "No"}
    - Situacion Laboral: ${profile.jobSituation}
    - Antecedentes Penales: ${profile.hasCriminalRecord ? "Si" : "No"}
    - Familia en Espana: ${profile.hasFamilyInSpain ? "Si" : "No"}
      ${profile.hasFamilyInSpain ? `(Nacionalidad: ${profile.familyNationality}, Vinculo: ${profile.familyRelation})` : ""}
    - Objetivo Principal: ${profile.primaryGoal}
    - Comentarios adicionales: ${profile.comments}

    Instrucciones de Analisis:
    1. Analiza los comentarios adicionales y el perfil para entender la intencion del usuario.
    2. Filtra las plantillas que NO aplican (solo dentro de la lista permitida).
    3. Selecciona la plantilla que MEJOR responde a la consulta especifica.
    4. NO inventes plazos ni meses restantes: si el tiempo en Espana no indica 3+ años, limita a mencionar el requisito general (ej. “requiere 3 años continuados”) sin decir que faltan X meses, salvo que el perfil lo indique explicitamente.
    5. Genera un resumen del estado del cliente (summary) que demuestre que has entendido su situacion. Si falta informacion critica (ej. tiempo exacto de estancia o pruebas de trabajo), indicalo en missingInfoWarning.

    CRITERIO DE ACCION (nextStepAction):
    - Si detectas una via clara con probabilidad ALTA o MEDIA: Sugiere agendar cita (SCHEDULE_CONSULTATION).
    - Si el usuario NO cumple requisitos basicos: Sugiere preparar documentos/esperar (GATHER_DOCUMENTS).
  `;

  try {
    const analysisSchema = buildAnalysisSchema(allowedTemplates);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Eres un asistente legal experto en leyes de inmigracion de Espana. Se preciso, riguroso y prioriza la correccion sobre la especulacion."
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Error analysing profile:", error);
    throw new Error("Hubo un error al analizar el perfil. Por favor intenta de nuevo.");
  }
};

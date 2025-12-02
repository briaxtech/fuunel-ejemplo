import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, AIAnalysisResult } from "../types";
import { TEMPLATE_KEYS, TEMPLATE_SUMMARY } from "./templates";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
});

const ALLOWED_TEMPLATE_KEYS = [...(TEMPLATE_KEYS.length ? TEMPLATE_KEYS : []), "SIN_PLANTILLA"];

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen breve y empático de la situación legal actual del usuario en España, mencionando sus puntos clave (tiempo, estatus, etc).",
    },
    recommendations: {
      type: Type.ARRAY,
      description: "Lista de posibles trámites de extranjería recomendados.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Nombre oficial del trámite (ej: Arraigo Social)." },
          description: { type: Type.STRING, description: "Explicación de por qué aplica este trámite." },
          probability: {
            type: Type.STRING,
            enum: ["Alta", "Media", "Baja"],
            description: "Probabilidad de éxito estimada basada en los datos."
          },
          templateKey: {
            type: Type.STRING,
            enum: ALLOWED_TEMPLATE_KEYS,
            description: "El 'template_key' EXACTO del archivo CSV que corresponde a este trámite. Si NINGUNA plantilla encaja perfectamente, usa 'SIN_PLANTILLA'. ES CRÍTICO NO EQUIVOCARSE AQUÍ."
          },
          requirements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de 3-5 requisitos legales clave (ej: 3 años de permanencia)."
          },
          documents: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista exacta de documentos físicos necesarios (ej: Certificado de Antecedentes Penales apostillado, Pasaporte completo)."
          },
          estimatedTime: { type: Type.STRING, description: "Tiempo estimado de resolución (ej: 3-6 meses)." }
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
      description: "Si falta información crítica para dar un consejo preciso, menciónalo aquí.",
    },
    nextStepAction: {
      type: Type.STRING,
      enum: ["SCHEDULE_CONSULTATION", "GATHER_DOCUMENTS"],
      description: "Decisión sobre el siguiente paso. 'SCHEDULE_CONSULTATION' si hay al menos una vía con probabilidad Alta/Media y el usuario cumple requisitos básicos. 'GATHER_DOCUMENTS' si la probabilidad es Baja o faltan requisitos esenciales (ej: tiempo de estancia insuficiente) y es mejor esperar antes de contratar abogado."
    },
    actionReasoning: {
      type: Type.STRING,
      description: "Breve explicación (1 frase) de por qué se sugiere agendar cita o esperar/recolectar documentos."
    }
  },
  required: ["summary", "recommendations", "criticalAdvice", "nextStepAction", "actionReasoning"]
};

export const analyzeImmigrationProfile = async (profile: UserProfile): Promise<AIAnalysisResult> => {
  const prompt = `
    Actúa como un abogado experto en extranjería e inmigración en España (Extranjería).
    Tu objetivo es analizar el perfil del cliente y seleccionar la plantilla de respuesta (templateKey) MÁS ADECUADA del catálogo proporcionado.

    IMPORTANTE:
    1. Tu prioridad ABSOLUTA es elegir el 'templateKey' correcto.
    2. Si el cliente cumple los requisitos de una plantilla, ÚSALA.
    3. Si NO estás 100% seguro o ninguna plantilla encaja bien, usa "SIN_PLANTILLA".
    4. ES PREFERIBLE "SIN_PLANTILLA" A ENVIAR INFORMACIÓN INCORRECTA.

    EJEMPLO DE LÓGICA:
    - Cliente: "Llevo 2 años de residencia legal y quiero la nacionalidad".
    - Acción: Verificar requisitos de nacionalidad iberoamericana (2 años).
    - Selección: "NACIONALIDAD 2024".

    CATÁLOGO DE PLANTILLAS (fuente de verdad):
    ${TEMPLATE_SUMMARY}

    Perfil del Usuario a Analizar:
    - Nacionalidad: ${profile.nationality}
    - Edad: ${profile.age}
    - Nivel de Estudios: ${profile.educationLevel}
    - Fecha de entrada aproximada: ${profile.entryDate}
    - Provincia de residencia: ${profile.province}
    - Estatus Actual: ${profile.currentStatus}
    - Tiempo en España: ${profile.timeInSpain}
    - Ubicación Actual: ${profile.locationStatus === 'origin' ? "País de Origen" : "España"}
    - Empadronado: ${profile.isEmpadronado ? "Sí" : "No"}
    - Situación Laboral: ${profile.jobSituation}
    - Antecedentes Penales: ${profile.hasCriminalRecord ? "Sí" : "No"}
    - Familia en España: ${profile.hasFamilyInSpain ? "Sí" : "No"} 
      ${profile.hasFamilyInSpain ? `(Nacionalidad: ${profile.familyNationality}, Vínculo: ${profile.familyRelation})` : ""}
    - Objetivo Principal: ${profile.primaryGoal}
    - Comentarios adicionales: ${profile.comments}

    Instrucciones de Análisis:
    1. Analiza los comentarios adicionales y el perfil para entender la intención del usuario.
    2. Filtra las plantillas que NO aplican.
    3. Selecciona la plantilla que MEJOR responde a la consulta específica.
    4. Genera un resumen del estado del cliente (summary) que demuestre que has entendido su situación.

    CRITERIO DE ACCIÓN (nextStepAction):
    - Si detectas una vía clara con probabilidad ALTA o MEDIA: Sugiere agendar cita (SCHEDULE_CONSULTATION).
    - Si el usuario NO cumple requisitos básicos: Sugiere preparar documentos/esperar (GATHER_DOCUMENTS).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Eres un asistente legal experto en leyes de inmigración de España. Sé preciso, riguroso y prioriza la corrección sobre la especulación."
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

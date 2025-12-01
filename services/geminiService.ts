import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, AIAnalysisResult } from "../types";
import { TEMPLATE_KEYS, TEMPLATE_SUMMARY } from "./templates";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
});

const ALLOWED_TEMPLATE_KEYS = TEMPLATE_KEYS.length ? TEMPLATE_KEYS : ["SIN_PLANTILLA"];

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Un resumen breve y empático de la situación legal actual del usuario en España.",
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
            description: "template_key exacto de templates.csv que mejor aplica según el instructivo de la plantilla."
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
    Tu objetivo es funcionar como un 'Motor de Reglas' estricto para filtrar posibles clientes para un despacho de abogados.

    CATÁLOGO DE PLANTILLAS (fuente de verdad - templates.csv):
    ${TEMPLATE_SUMMARY}

    Reglas de uso de plantillas:
    - Solo puedes recomendar trámites que existan en la lista anterior.
    - Cada recomendación debe indicar el campo templateKey exactamente igual al template_key elegido.
    - Usa las descripciones de la plantilla como criterio de elegibilidad. No inventes otros trámites ni varíes sus nombres.
    - Si ninguna opción encaja perfectamente, elige la que mejor aplique y explica el encaje en la descripción.
    
    Perfil del Usuario:
    - Nacionalidad: ${profile.nationality}
    - Edad: ${profile.age}
    - Nivel de Estudios: ${profile.educationLevel}
    - Fecha de entrada aproximada: ${profile.entryDate}
    - Provincia de residencia: ${profile.province}
    - Estatus Actual: ${profile.currentStatus}
    - Tiempo en España: ${profile.timeInSpain}
    - Empadronado: ${profile.isEmpadronado ? "Sí" : "No"}
    - Oferta de trabajo: ${profile.jobOffer ? "Sí" : "No"}
    - Antecedentes Penales: ${profile.hasCriminalRecord ? "Sí" : "No"}
    - Familia en España: ${profile.hasFamilyInSpain ? "Sí" : "No"} (${profile.familyDetails || "Sin detalles"})
    - Comentarios adicionales: ${profile.comments}

    Basado en la Ley de Extranjería vigente en España (incluyendo la reforma del reglamento si aplica) y las instrucciones SEM:
    
    1. Identifica los trámites viables (Arraigo Social, Arraigo para la Formación, Arraigo Laboral, Familiar de Comunitario, Asilo, Estancia por Estudios, etc.).
    2. Si tiene 'Formación Profesional' o estudios superiores, prioriza evaluar el 'Arraigo para la Formación'.
    3. Si es de un país iberoamericano, ten en cuenta convenios especiales si aplican (aunque es más para nacionalidad, a veces influye).
    4. Proporciona la lista exacta de DOCUMENTOS necesarios para el trámite principal.

    INSTRUCCIONES CLAVE SOBRE LOCALIZACIÓN:
    El usuario reside en la provincia de ${profile.province}. 
    Menciona si esta oficina es conocida por demoras o criterios específicos si tienes esa información en tu base de conocimientos.

    CRITERIO DE ACCIÓN (nextStepAction):
    - Si detectas una vía clara con probabilidad ALTA o MEDIA: Sugiere agendar cita (SCHEDULE_CONSULTATION).
    - Si el usuario NO cumple requisitos básicos (ej: lleva 1 mes en España irregular, tiene antecedentes penales graves, o no tiene ninguna vía legal actual): Sugiere preparar documentos/esperar (GATHER_DOCUMENTS) para no hacerle perder dinero en una consulta ahora.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "Eres un asistente legal experto en leyes de inmigración de España. Sé preciso, riguroso y estructurado."
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

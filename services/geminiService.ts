// geminiService.ts

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { UserProfile, AIAnalysisResult } from "../types";
import { TEMPLATE_SUMMARY_MAP, TEMPLATE_KEYS } from "./templates";
import { preClassify } from "./preClassify";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY or API_KEY must be set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const buildAnalysisSchema = (allowedTemplateKeys: string[]): any => ({
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description:
        "Resumen breve y empatico de la situacion legal actual del usuario en Espana.",
    },
    recommendations: {
      type: SchemaType.ARRAY,
      description: "Lista de tramites recomendados.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: "Nombre oficial del tramite." },
          description: {
            type: SchemaType.STRING,
            description: "Explicacion de por que aplica este tramite.",
          },
          probability: {
            type: SchemaType.STRING,
            enum: ["Alta", "Media", "Baja"],
            description: "Probabilidad estimada.",
          },
          templateKey: {
            type: SchemaType.STRING,
            enum: allowedTemplateKeys,
            description:
              "El template_key EXACTO del catalogo. No inventes nuevos valores.",
          },
          requirements: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Requisitos legales clave.",
          },
          documents: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Documentos fisicos necesarios.",
          },
          estimatedTime: {
            type: SchemaType.STRING,
            description: "Tiempo estimado de resolucion.",
          },
        },
        required: [
          "title",
          "description",
          "probability",
          "templateKey",
          "requirements",
          "documents",
          "estimatedTime",
        ],
      },
    },
    criticalAdvice: {
      type: SchemaType.STRING,
      description: "Consejo o advertencia legal importante.",
    },
    missingInfoWarning: {
      type: SchemaType.STRING,
      description:
        "Menciona si falta informacion critica para dar un consejo preciso.",
    },
    nextStepAction: {
      type: SchemaType.STRING,
      enum: ["SCHEDULE_CONSULTATION", "GATHER_DOCUMENTS"],
      description:
        "Decision sobre el siguiente paso. Consulta si hay via clara, recolectar si faltan requisitos.",
    },
    actionReasoning: {
      type: SchemaType.STRING,
      description:
        "Breve explicacion de por que se sugiere agendar o recolectar.",
    },
  },
  required: [
    "summary",
    "recommendations",
    "criticalAdvice",
    "nextStepAction",
    "actionReasoning",
  ],
});

const buildAllowedTemplates = (candidates: string[]) => {
  const allowedSet = new Set(TEMPLATE_KEYS.map((k) => k.toUpperCase()));
  const filtered = new Set<string>();

  candidates.forEach((k) => {
    if (allowedSet.has(k.toUpperCase())) filtered.add(k);
  });

  if (!filtered.size) {
    TEMPLATE_KEYS.forEach((k) => filtered.add(k));
  }

  // No agregamos "SIN_PLANTILLA" por defecto para forzar una seleccion concreta
  return Array.from(filtered);
};

const normalizeKey = (key?: string) => key?.trim().toUpperCase() || "";

const pickPrimaryTemplate = (allowedTemplates: string[]) => {
  const firstValid = allowedTemplates.find(
    (t) => normalizeKey(t) !== "SIN_PLANTILLA",
  );
  return firstValid || allowedTemplates[0];
};

const ensureValidRecommendations = (
  result: AIAnalysisResult,
  allowedTemplates: string[],
): AIAnalysisResult => {
  const primaryTemplate = pickPrimaryTemplate(allowedTemplates);
  const allowedNormalized = new Set(allowedTemplates.map(normalizeKey));

  const fixTemplateKey = (key?: string) => {
    const normalized = normalizeKey(key);
    if (allowedNormalized.has(normalized) && normalized !== "SIN_PLANTILLA") {
      // Devuelve la clave original preservando el casing
      return (
        allowedTemplates.find((t) => normalizeKey(t) === normalized) ||
        primaryTemplate
      );
    }
    return primaryTemplate;
  };

  const buildFallbackRecommendation = (templateKey: string) => ({
    title: templateKey,
    description: "Recomendacion prioritaria segun el perfil.",
    probability: "Alta" as const,
    templateKey,
    requirements: [],
    documents: [],
    estimatedTime: "N/A",
  });

  const recommendations = (result.recommendations || []).map((rec, idx) => ({
    ...rec,
    templateKey: idx === 0 ? primaryTemplate : fixTemplateKey(rec.templateKey),
  }));

  const ensuredRecommendations = recommendations.length
    ? recommendations
    : [buildFallbackRecommendation(primaryTemplate)];

  ensuredRecommendations[0].templateKey = primaryTemplate;

  return {
    ...result,
    recommendations: ensuredRecommendations,
  };
};

export const analyzeImmigrationProfile = async (
  profile: UserProfile,
): Promise<AIAnalysisResult> => {
  const pre = preClassify(profile);
  const allowedTemplates = buildAllowedTemplates(pre.candidateTemplates || []);

  const subsetSummary = allowedTemplates
    .filter((key) => key !== "SIN_PLANTILLA")
    .map((key) => `- ${key}: ${TEMPLATE_SUMMARY_MAP[key] || ""}`)
    .join("\n");

  const prompt = `
Actua como un ABOGADO SENIOR experto en Extranjeria e Inmigracion en Espana.

Tu tarea es:
1) Analizar el perfil del usuario con rigor legal.
2) Seleccionar la plantilla MAS ESPECIFICA y correcta dentro de la lista permitida.
3) Generar recomendaciones claras y accionables, ajustadas a la normativa vigente.
4) Usar al maximo la informacion de TEXTO LIBRE (familyDetails y comments).

REGLAS LEGALES INFLEXIBLES (RESUMEN):
- Si el usuario esta FUERA de Espana (locationStatus = "origin"):
  -> NO sugieras arraigos. En ese caso se trabaja con visados / opciones preparatorias.
- Si esta IRREGULAR en Espana:
  -> NO sugieras visados de consulado; prioriza vias de regularizacion (arraigo social, arraigo familiar, socioformativo, etc.).
- Si NO hay matrimonio ni pareja registrada con espanol/UE:
  -> NO sugieras directamente "familiar UE"; valora opciones informativas o preparatorias.
- Si tiene HIJO espanol:
  -> prioriza "Arraigo familiar" u otras figuras especificas de familiares de espanoles, segun plantillas.
- Si tiene conyuge o pareja registrada espanol/UE y conviven en Espana:
  -> prioriza regimen de familiar de ciudadano de la UE (tarjeta de familiar).
- ARRAIGO SOCIAL / SOCIOFORMATIVO:
  -> exige al menos 2 ANOS de permanencia continuada en Espana (no 3), segun el nuevo reglamento y las plantillas del catalogo.
- Si no puedes determinar con claridad una via concreta:
  -> elige una plantilla INFORMATIVA adecuada y explica la falta de datos en "missingInfoWarning".

TEMPLATES PERMITIDOS PARA ESTE CASO:
(usa SOLO uno de estos en cada recommendation.templateKey)
${allowedTemplates.join(", ")}

CONTEXTO DE PRECLASIFICACION:
- Categoria de flujo: ${pre.flowCategory}
- Plantillas candidatas:
${subsetSummary}

DATOS ESTRUCTURADOS DEL PERFIL:
- Nombre: ${profile.firstName} ${profile.lastName}
- Nacionalidad: ${profile.nationality}
- Edad: ${profile.age ?? "No indicado"}
- Nivel de estudios: ${profile.educationLevel}
- Provincia de residencia: ${profile.province || "No indicado"}
- Ubicacion actual: ${profile.locationStatus === "origin" ? "Pais de origen" : "Espana"}
- Estatus actual: ${profile.currentStatus}
- Tiempo declarado en Espana (formulario): ${profile.timeInSpain}
- Fecha de entrada aproximada: ${profile.entryDate || "No indicado"}
- Empadronado: ${profile.isEmpadronado === true
      ? "Si"
      : profile.isEmpadronado === false
        ? "No"
        : "No indicado"
    }
- Situacion laboral: ${profile.jobSituation || "No indicado"}
- Antecedentes penales: ${profile.hasCriminalRecord === true
      ? "Si"
      : profile.hasCriminalRecord === false
        ? "No"
        : "No indicado"
    }
- Familia en Espana: ${profile.hasFamilyInSpain === true
      ? `Si (Nacionalidad: ${profile.familyNationality || "No indicada"}, Vinculo: ${profile.familyRelation || "No indicado"
      })`
      : profile.hasFamilyInSpain === false
        ? "No"
        : "No indicado"
    }
- Objetivo principal (si viene en el perfil): ${profile.primaryGoal || "No indicado"}

INFORMACION DE TEXTO LIBRE (MIRARLA SIEMPRE):
1) Detalles familiares / convivencia / dependencia (familyDetails):
${profile.familyDetails || "No proporcionado"}

2) Comentarios y contexto adicional (comments):
${profile.comments || "No proporcionado"}

INSTRUCCIONES ESPECIALES SOBRE TEXTO LIBRE:
- En "comments" pueden aparecer etiquetas como:
  [objetivo:regularizar] [objetivo:entrada] [objetivo:familiares] [objetivo:nacionalidad]
  Usalas como pista para entender el objetivo real del usuario.
- Usa familyDetails para:
  * Entender con quien vive realmente el usuario.
  * Ver si depende economicamente de un familiar, o si alguien depende de el/ella.
  * Confirmar convivencia efectiva con espanoles/UE, lo cual afecta a familiar UE y ciertas figuras de arraigo.
- Si los datos estructurados y el texto libre se contradicen, explica brevemente la contradiccion en "missingInfoWarning".

REGLAS DE SELECCION DE PLANTILLA:
1. Si el caso es CLARO y ESPECIFICO -> elige la plantilla exacta que mejor encaje.
2. NO uses "SIN_PLANTILLA" salvo que sea la unica opcion permitida.
3. Prioriza plantillas ESPECIFICAS sobre GENERICAS (por ejemplo, "Arraigo familiar" antes que "Formas de regularizarse").
4. Si la informacion es insuficiente o confusa:
   -> elige una plantilla INFORMATIVA adecuada y usa "missingInfoWarning" para explicarlo.
5. NO elijas nunca una plantilla solo porque sea la primera de la lista.

SALIDA:
Devuelve UNICAMENTE un JSON que cumpla EXACTAMENTE el schema dado
(summary, recommendations, criticalAdvice, missingInfoWarning, nextStepAction, actionReasoning).
No agregues campos extra fuera del schema.
  `;

  try {
    const analysisSchema = buildAnalysisSchema(allowedTemplates);

    // Usar el SDK oficial @google/generative-ai con API key
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
      systemInstruction:
        "Eres un asistente legal experto en leyes de inmigracion de España. Se preciso, respeta las reglas indicadas y evita respuestas genericas.",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) throw new Error("No response from AI");

    const parsed = JSON.parse(text) as AIAnalysisResult;
    return ensureValidRecommendations(parsed, allowedTemplates);
  } catch (error) {
    console.error("Error analysing profile:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.error("Profile data:", JSON.stringify(profile, null, 2));
    console.error("Allowed templates:", allowedTemplates);
    throw new Error(
      "Hubo un error al analizar el perfil. Por favor intenta de nuevo.",
    );
  }
};
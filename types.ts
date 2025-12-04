// types.ts

// ==================== ENUMS BÁSICOS ====================
// Si ya los tienes definidos, puedes mantener tus valores
// y sólo asegurarte de que los tipos coinciden con los
// que usa el formulario y la IA.

// Nivel de estudios
export enum EducationLevel {
  PRIMARIA = "Primaria",
  SECUNDARIA = "Secundaria",
  FP = "Formación profesional / Ciclo",
  UNIVERSITARIA = "Universidad / Estudios superiores",
  OTROS = "Otros",
}

// Situación administrativa
export enum ImmigrationStatus {
  IRREGULAR = "irregular",
  RESIDENT = "resident",
  STUDENT = "student",
  TOURIST = "tourist",
  REGULAR = "regular",
  ASYLUM_SEEKER = "asylum_seeker",
  OTHER = "other",
}

// Tiempo en España (coincide con los usados en el formulario) :contentReference[oaicite:0]{index=0}
export enum TimeInSpain {
  LESS_THAN_SIX_MONTHS = "LESS_THAN_SIX_MONTHS",
  SIX_TO_TWELVE_MONTHS = "SIX_TO_TWELVE_MONTHS",
  ONE_TO_TWO_YEARS = "ONE_TO_TWO_YEARS",
  TWO_TO_THREE_YEARS = "TWO_TO_THREE_YEARS",
  MORE_THAN_THREE_YEARS = "MORE_THAN_THREE_YEARS",
}

// Datos de contacto
export interface ContactInfo {
  email: string;
  phone: string;
}

// ==================== USER PROFILE ====================
// Este tipo DEBE coincidir con lo que envía el formulario
// ImmigrationForm.tsx :contentReference[oaicite:1]{index=1}

export interface UserProfile {
  // Datos personales
  firstName: string;
  lastName: string;
  nationality: string;
  age?: number;

  educationLevel: EducationLevel;

  // Situación en España
  currentStatus: ImmigrationStatus;
  timeInSpain: TimeInSpain;
  entryDate?: string; // ISO (input type="date")
  province: string;

  // Localización actual
  // "origin" = país de origen (fuera de España)
  // "spain"  = ya está en España
  locationStatus: "origin" | "spain";

  // Empadronamiento
  isEmpadronado: boolean | null;

  // Trabajo / medios de vida
  jobSituation: string;

  // Antecedentes
  hasCriminalRecord: boolean | null;

  // Familia en España
  hasFamilyInSpain: boolean | null;
  familyNationality?: "spanish_eu" | "non_eu";
  familyRelation?:
    | "spouse"
    | "registered_partner"
    | "unregistered_partner"
    | "child_of_spanish_eu"
    | "parent_of_spanish"
    | "other";

  // Texto libre sobre familia / convivencia / dependencia
  familyDetails?: string;

  // Comentarios libres generales
  // Aquí el formulario escribe:
  // [objetivo:regularizar] [objetivo:entrada] ... + texto libre
  comments?: string;

  // Opcional: por si en otra parte del sistema ya existía
  primaryGoal?: "regularizar" | "entrada" | "familiares" | "nacionalidad" | string;
}

// ==================== RESULTADO DE LA IA ====================

export interface Recommendation {
  title: string;
  description: string;
  probability: "Alta" | "Media" | "Baja";
  templateKey: string;
  requirements: string[];
  documents: string[];
  estimatedTime: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: Recommendation[];
  criticalAdvice: string;
  missingInfoWarning?: string;
  nextStepAction: "SCHEDULE_CONSULTATION" | "GATHER_DOCUMENTS";
  actionReasoning: string;
}

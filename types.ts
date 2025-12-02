export enum ImmigrationStatus {
  TOURIST = 'Turista (Estancia de 90 días)',
  STUDENT = 'Estudiante',
  REGULAR = 'Situación Regular',
  IRREGULAR = 'Situación Irregular (Sin papeles)',
  EXPIRED_RESIDENCY = 'Residencia Caducada',
  ASYLUM_SEEKER = 'Solicitante de Asilo',
  OTHER = 'Otro'
}

export enum TimeInSpain {
  LESS_THAN_1_YEAR = 'Menos de 1 año',
  ONE_TO_TWO_YEARS = 'Entre 1 y 2 años',
  TWO_TO_THREE_YEARS = 'Entre 2 y 3 años',
  MORE_THAN_THREE_YEARS = 'Más de 3 años'
}

export enum EmploymentStatus {
  UNEMPLOYED = 'Desempleado',
  WORKING_IRREGULAR = 'Trabajando sin contrato',
  WORKING_LEGAL = 'Trabajando con contrato',
  STUDENT = 'Estudiando',
  SELF_EMPLOYED = 'Autónomo'
}

export enum EducationLevel {
  NONE = 'Sin estudios formales',
  BASIC = 'Educación Primaria / Secundaria',
  VOCATIONAL = 'Formación Profesional',
  UNIVERSITY = 'Universitario / Grado',
  MASTER_PHD = 'Máster / Doctorado'
}

export enum NextStepAction {
  SCHEDULE_CONSULTATION = 'SCHEDULE_CONSULTATION', // User is ready for a lawyer
  GATHER_DOCUMENTS = 'GATHER_DOCUMENTS'            // User needs to prepare first
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  nationality: string;
  age: number;
  educationLevel: EducationLevel;
  entryDate: string; // ISO date string
  currentStatus: ImmigrationStatus;
  timeInSpain: TimeInSpain;
  province: string;
  hasCriminalRecord: boolean | null;
  hasFamilyInSpain: boolean | null;
  familyDetails?: string;
  isEmpadronado: boolean | null;
  jobSituation: string;
  comments: string;
  locationStatus?: 'origin' | 'spain';
  familyNationality?: 'spanish_eu' | 'non_eu';
  familyRelation?: 'spouse' | 'registered_partner' | 'unregistered_partner' | 'child' | 'parent';
  primaryGoal?: 'reside_work' | 'study' | 'family' | 'nationality';
}

export interface Recommendation {
  title: string;
  description: string;
  probability: 'Alta' | 'Media' | 'Baja';
  templateKey: string;
  requirements: string[];
  documents: string[]; // List of specific documents needed
  estimatedTime: string;
}

export interface AIAnalysisResult {
  summary: string;
  recommendations: Recommendation[];
  criticalAdvice: string;
  missingInfoWarning?: string;
  nextStepAction: NextStepAction; // New field to determine flow
  actionReasoning: string; // Why this next step was chosen
}

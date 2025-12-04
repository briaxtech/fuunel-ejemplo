import {
  EducationLevel,
  ImmigrationStatus,
  TimeInSpain,
  UserProfile,
} from "../../types";

const baseProfile: UserProfile = {
  firstName: "Test",
  lastName: "User",
  nationality: "Argentina",
  age: 30,
  educationLevel: EducationLevel.SECUNDARIA,
  currentStatus: ImmigrationStatus.IRREGULAR,
  timeInSpain: TimeInSpain.SIX_TO_TWELVE_MONTHS,
  entryDate: "2024-03-01",
  province: "Madrid",
  locationStatus: "spain",
  isEmpadronado: true,
  jobSituation: "trabajo informal",
  hasCriminalRecord: false,
  hasFamilyInSpain: false,
  familyNationality: undefined,
  familyRelation: undefined,
  familyDetails: "",
  comments: "",
  primaryGoal: "regularizar",
};

export const makeProfile = (overrides: Partial<UserProfile>): UserProfile => ({
  ...baseProfile,
  ...overrides,
});

export const normalizeTemplateKey = (value?: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

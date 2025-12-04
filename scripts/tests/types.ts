import { UserProfile } from "../../types";

export type TestStatus = "passed" | "failed" | "skipped";

export interface TestExpectation {
  /**
   * Lista de template_keys que se consideran válidos para el primer
   * recommendation.templateKey que devuelva Gemini.
   */
  mustInclude?: string[];
  /**
   * Flujo esperado de preClassify (ARRAIGOS, STUDENT, FAMILY_OF_EU, etc).
   */
  expectedFlow?: string;
}

export interface AiTestCase {
  id: string;
  name: string;
  profile: UserProfile;
  tags?: string[];
  expectation?: TestExpectation;
  notes?: string;
}

export interface TestResult {
  id: string;
  name: string;
  status: TestStatus;
  durationMs: number;
  flowCategory?: string;
  candidateTemplates?: string[];
  recommendationTemplates?: string[];
  message?: string;
  error?: string;
  notes?: string;
}

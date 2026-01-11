/**
 * Branded type for student ID (GDPR-safe identifier).
 * Uses the student's class number, never their name.
 */
export type StudentNumber = number & { readonly __brand: "StudentNumber" };

/**
 * Polish behavior grades mapped to English equivalents.
 * wzorowe -> exemplary, bardzo dobre -> veryGood, dobre -> good,
 * poprawne -> acceptable, nieodpowiednie -> inappropriate, naganne -> reprehensible
 */
export type BehaviorGrade =
  | "exemplary"
  | "veryGood"
  | "good"
  | "acceptable"
  | "inappropriate"
  | "reprehensible";

/**
 * A single grade entry for a subject.
 * Value is string to handle modifiers (4+, 5-), exemptions (zwolniony), etc.
 */
export interface Grade {
  subject: string;
  value: string | null;
}

/**
 * Student attendance statistics.
 */
export interface AttendanceStats {
  present: number;
  absent: number;
  excused: number;
  late: number;
}

/**
 * Internal student representation with full data including name.
 * @internal This type contains GDPR-sensitive data (name field).
 * Use only for internal parsing - never expose in output.
 */
export interface RawStudent {
  number: StudentNumber;
  /**
   * @internal GDPR-sensitive field. Never include in generated output.
   */
  name: string;
  grades: Grade[];
  behavior?: BehaviorGrade;
  attendance?: AttendanceStats;
}

/**
 * Output-safe student representation without GDPR-sensitive name field.
 * Use this type for all generated output (HTML, reports, etc).
 */
export type Student = Omit<RawStudent, "name">;

/**
 * Class metadata from the Librus export.
 */
export interface ClassMetadata {
  className: string;
  period: string;
  teacher?: string;
}

/**
 * Root container for all parsed class data.
 * Contains metadata and the full student list (with names for internal use).
 */
export interface ClassData {
  metadata: ClassMetadata;
  students: RawStudent[];
}

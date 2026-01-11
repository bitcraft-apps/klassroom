/**
 * Branded type for student ID (GDPR-safe identifier).
 * Uses the student's class number, never their name.
 */
export type StudentNumber = number & { readonly __brand: "StudentNumber" };

/**
 * Creates a type-safe StudentNumber from a plain number.
 * @param n - The student's class number (1-based index in class roster)
 * @returns A branded StudentNumber
 * @throws Error if n is not a positive integer
 */
export function studentNumber(n: number): StudentNumber {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid student number: ${n}. Must be a positive integer.`);
  }
  return n as StudentNumber;
}

/**
 * Branded type for classification period identifier.
 * Typically contains school year and semester (e.g., "2024/2025 - Semestr 1").
 */
export type ClassPeriod = string & { readonly __brand: "ClassPeriod" };

/**
 * Creates a type-safe ClassPeriod from a plain string.
 * @param period - The classification period string from Librus export
 * @returns A branded ClassPeriod
 * @throws Error if period is empty
 */
export function classPeriod(period: string): ClassPeriod {
  if (!period || period.trim() === "") {
    throw new Error("Invalid class period: must be a non-empty string.");
  }
  return period as ClassPeriod;
}

/**
 * All valid behavior grade values.
 * Ordered from best to worst behavior.
 */
export const BEHAVIOR_GRADES = [
  "exemplary",
  "veryGood",
  "good",
  "acceptable",
  "inappropriate",
  "reprehensible",
] as const;

/**
 * Polish behavior grades mapped to English equivalents.
 * wzorowe -> exemplary, bardzo dobre -> veryGood, dobre -> good,
 * poprawne -> acceptable, nieodpowiednie -> inappropriate, naganne -> reprehensible
 */
export type BehaviorGrade = (typeof BEHAVIOR_GRADES)[number];

/**
 * Maps Polish behavior grade strings to their English equivalents.
 * Used during XLSX parsing to normalize behavior grades.
 */
export const POLISH_TO_BEHAVIOR: Readonly<Record<string, BehaviorGrade>> = {
  wzorowe: "exemplary",
  "bardzo dobre": "veryGood",
  dobre: "good",
  poprawne: "acceptable",
  nieodpowiednie: "inappropriate",
  naganne: "reprehensible",
};

/**
 * A single grade entry for a subject.
 */
export interface Grade {
  subject: string;
  /**
   * The grade value as a string to handle modifiers (4+, 5-), exemptions (zwolniony), etc.
   * Null indicates no grade was assigned (empty cell in source data).
   */
  value: string | null;
}

/**
 * Student attendance statistics.
 * All counts are absolute numbers of hours/lessons.
 */
export interface AttendanceStats {
  /** Number of lessons attended */
  present: number;
  /** Number of unexcused absences */
  absent: number;
  /** Number of excused absences */
  excused: number;
  /** Number of times arrived late */
  late: number;
  /**
   * Attendance percentage (0-100). Optional because some exports
   * only include raw counts without a pre-calculated percentage.
   */
  percentage?: number;
}

/**
 * Internal student representation with full data including name.
 * Used during XLSX parsing to correlate data across sheets (students are
 * referenced by name in Librus exports). Must be stripped to {@link Student}
 * before returning from any public API.
 *
 * @internal Package-internal type. NOT exported from barrel - import directly
 * from './types/index.js' only within @klassroom/core parsing modules.
 */
export interface RawStudent {
  number: StudentNumber;
  /**
   * Student's full name from source data. Used only for correlating records
   * across XLSX sheets during parsing. MUST be stripped before public output.
   * @internal
   */
  name: string;
  grades: Grade[];
  /** Overall grade average from "Średnia uczniów" sheet */
  average?: number;
  behavior?: BehaviorGrade;
  attendance?: AttendanceStats;
}

/**
 * Strips PII (name) from a RawStudent to produce a GDPR-safe Student.
 * @param raw - The internal student representation with name
 * @returns A Student without the name field
 *
 * @internal Not exported from barrel - use within @klassroom/core only.
 */
export function stripStudentPII(raw: RawStudent): Student {
  const { name: _, ...student } = raw;
  return student;
}

/**
 * GDPR-safe student representation. Identifies students by class number only.
 * This is the public type - use for all APIs, analytics, and generated output.
 */
export interface Student {
  number: StudentNumber;
  grades: Grade[];
  /** Overall grade average from "Średnia uczniów" sheet */
  average?: number;
  behavior?: BehaviorGrade;
  attendance?: AttendanceStats;
}

/**
 * Class metadata from the Librus export.
 */
export interface ClassMetadata {
  /** Class name/identifier (e.g., "3A", "2B") */
  className: string;
  /** Classification period (school year and semester) */
  period: ClassPeriod;
  /** Class teacher name (if available) */
  teacher?: string;
}

/**
 * Root container for parsed class data.
 * This is the public API return type - contains only GDPR-safe student data.
 */
export interface ClassData {
  metadata: ClassMetadata;
  students: Student[];
}

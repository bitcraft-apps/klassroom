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
 * Parses a Polish behavior grade string to its English equivalent.
 * Handles case-insensitive matching and whitespace normalization.
 *
 * @param polish - The Polish behavior grade string (e.g., "Wzorowe", "bardzo dobre")
 * @returns The corresponding BehaviorGrade, or undefined if not recognized
 *
 * @example
 * parseBehaviorGrade("wzorowe")       // "exemplary"
 * parseBehaviorGrade("Bardzo Dobre")  // "veryGood"
 * parseBehaviorGrade("invalid")       // undefined
 */
export function parseBehaviorGrade(polish: string): BehaviorGrade | undefined {
  const normalized = polish.trim().toLowerCase();
  return POLISH_TO_BEHAVIOR[normalized];
}

/**
 * Returns the ranking index of a behavior grade (0 = best, 5 = worst).
 * Useful for sorting or comparing behavior grades numerically.
 *
 * @param grade - The behavior grade to get the index for
 * @returns Index from 0 (exemplary) to 5 (reprehensible)
 */
export function behaviorToIndex(grade: BehaviorGrade): number {
  return BEHAVIOR_GRADES.indexOf(grade);
}

/**
 * Compares two behavior grades.
 * Returns negative if `a` is better than `b`, positive if worse, 0 if equal.
 *
 * @param a - First behavior grade
 * @param b - Second behavior grade
 * @returns Negative number if a is better, positive if worse, 0 if equal
 *
 * @example
 * compareBehavior("exemplary", "good")  // -2 (exemplary is better)
 * compareBehavior("good", "exemplary")  // 2 (good is worse)
 * compareBehavior("good", "good")       // 0 (equal)
 */
export function compareBehavior(a: BehaviorGrade, b: BehaviorGrade): number {
  return behaviorToIndex(a) - behaviorToIndex(b);
}

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
 * Calculates attendance percentage from raw counts.
 * Formula: (present / (present + absent + excused)) * 100
 *
 * Note: "late" is not included in the calculation as students who are
 * late are still counted as present for that lesson.
 *
 * @param stats - The attendance statistics
 * @returns Percentage (0-100), or null if no attendance data (all counts are 0)
 *
 * @example
 * calculateAttendancePercentage({ present: 90, absent: 5, excused: 5, late: 3 })  // 90
 * calculateAttendancePercentage({ present: 0, absent: 0, excused: 0, late: 0 })   // null
 */
export function calculateAttendancePercentage(
  stats: Pick<AttendanceStats, "present" | "absent" | "excused">
): number | null {
  const total = stats.present + stats.absent + stats.excused;
  if (total === 0) {
    return null; // No attendance data
  }
  return (stats.present / total) * 100;
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
 * Uses explicit allowlist to prevent accidental PII leakage if new fields
 * are added to RawStudent in the future.
 *
 * @param raw - The internal student representation with name
 * @returns A Student without the name field
 *
 * @internal Not exported from barrel - use within @klassroom/core only.
 */
export function stripStudentPII(raw: RawStudent): Student {
  return {
    number: raw.number,
    grades: raw.grades,
    average: raw.average,
    behavior: raw.behavior,
    attendance: raw.attendance,
  };
}

/**
 * GDPR-safe student representation. Identifies students by class number only.
 * This is the public API type exported from the @klassroom/core barrel; use it
 * for all APIs, analytics, and generated output (unlike RawStudent, which is
 * an internal parsing type and not barrel-exported).
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

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Valid numeric grade values in the Polish grading scale (1-6).
 */
export type NumericGrade = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Count of grades by numeric value (1-6 Polish grading scale).
 */
export type GradeCounts = Record<NumericGrade, number>;

/**
 * Distribution of students by average grade ranges.
 * Categorizes students into statistical tiers based on weighted average.
 */
export interface AverageRangeCounts {
  /** Students with satisfactory average (3.5 - 3.99) */
  satisfactory: number;
  /** Students with good average (4.0 - 4.74) */
  good: number;
  /** Students with honors average (4.75+) - eligible for distinction certificate */
  honors: number;
}

/**
 * Count of students by behavior grade.
 */
export interface BehaviorCounts {
  exemplary: number;
  veryGood: number;
  good: number;
  acceptable: number;
  inappropriate: number;
  reprehensible: number;
}

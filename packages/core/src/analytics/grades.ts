import type { Student, GradeCounts, NumericGrade } from "../types/index.js";

/**
 * Creates an empty GradeCounts object with all values initialized to 0.
 */
export function emptyGradeCounts(): GradeCounts {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
}

/**
 * Parses a grade value string to a numeric grade (1-6).
 * Handles modifiers like "4+", "5-" by extracting the base number.
 * Returns undefined for non-numeric grades (e.g., "zwolniony", null, empty).
 *
 * @param value - The grade value string
 * @returns Numeric grade 1-6, or undefined if not parseable
 */
export function parseNumericGrade(value: string | null): NumericGrade | undefined {
  if (value === null || value === "") {
    return undefined;
  }
  // Extract leading digit(s) - handles "4+", "5-", "4", etc.
  const match = value.match(/^(\d)/);
  if (!match) {
    return undefined;
  }
  const grade = parseInt(match[1], 10);
  if (grade >= 1 && grade <= 6) {
    return grade as NumericGrade;
  }
  return undefined;
}

/**
 * Counts all grades by their numeric value (1-6) across all students and subjects.
 * Non-numeric grades (e.g., "zwolniony", null) are excluded.
 *
 * @param students - Array of students with grades
 * @returns Object with counts for each grade 1-6
 *
 * @example
 * const counts = countGradesByType(students);
 * console.log(counts[5]); // Number of "5" grades
 */
export function countGradesByType(students: Student[]): GradeCounts {
  const counts = emptyGradeCounts();

  for (const student of students) {
    for (const grade of student.grades) {
      const numericGrade = parseNumericGrade(grade.value);
      if (numericGrade !== undefined) {
        counts[numericGrade]++;
      }
    }
  }

  return counts;
}

/**
 * Counts grades by numeric value (1-6) for each subject.
 * Non-numeric grades are excluded from counts.
 *
 * @param students - Array of students with grades
 * @returns Map where key is subject name, value is grade counts for that subject
 *
 * @example
 * const bySubject = countGradesBySubject(students);
 * const mathCounts = bySubject.get("Matematyka");
 */
export function countGradesBySubject(
  students: Student[]
): Map<string, GradeCounts> {
  const result = new Map<string, GradeCounts>();

  for (const student of students) {
    for (const grade of student.grades) {
      const numericGrade = parseNumericGrade(grade.value);
      if (numericGrade === undefined) {
        continue;
      }

      if (!result.has(grade.subject)) {
        result.set(grade.subject, emptyGradeCounts());
      }

      const subjectCounts = result.get(grade.subject)!;
      subjectCounts[numericGrade]++;
    }
  }

  return result;
}

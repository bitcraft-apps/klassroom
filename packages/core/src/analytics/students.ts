import type { Student, AverageRangeCounts } from "../types/index.js";
import { parseNumericGrade } from "./grades.js";

/** Minimum average for honors distinction (4.75+) */
export const HONORS_THRESHOLD = 4.75;

/** Lower bound for satisfactory average category */
const SATISFACTORY_THRESHOLD = 3.5;

/** Minimum average for "good" category */
const GOOD_THRESHOLD = 4.0;

/**
 * Calculates the average of all student averages in a class.
 * Students without an `average` field are excluded from the calculation.
 *
 * @param students - Array of students
 * @returns Class average (0 if no students have averages)
 *
 * @example
 * const classAvg = calculateClassAverage(students);
 */
export function calculateClassAverage(students: Student[]): number {
  const validAverages = students
    .map((s) => s.average)
    .filter((avg): avg is number => avg !== undefined);

  if (validAverages.length === 0) {
    return 0;
  }

  const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
  return sum / validAverages.length;
}

/**
 * Calculates min, max, and average of student averages.
 * Students without an `average` field are excluded.
 *
 * @param students - Array of students
 * @returns Object with min, max, and avg (all 0 if no valid data)
 *
 * @example
 * const { min, max, avg } = calculateMinMaxAverage(students);
 */
export function calculateMinMaxAverage(students: Student[]): {
  min: number;
  max: number;
  avg: number;
} {
  const validAverages = students
    .map((s) => s.average)
    .filter((avg): avg is number => avg !== undefined);

  if (validAverages.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const min = Math.min(...validAverages);
  const max = Math.max(...validAverages);
  const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
  const avg = sum / validAverages.length;

  return { min, max, avg };
}

/**
 * Calculates average grade for each subject across all students.
 * Only includes numeric grades (1-6). Non-numeric grades are excluded.
 *
 * @param students - Array of students
 * @returns Map where key is subject name, value is average grade for that subject
 *
 * @example
 * const subjectAvgs = calculateSubjectAverages(students);
 * const mathAvg = subjectAvgs.get("Matematyka");
 */
export function calculateSubjectAverages(
  students: Student[]
): Map<string, number> {
  const subjectSums = new Map<string, { sum: number; count: number }>();

  for (const student of students) {
    for (const grade of student.grades) {
      const numericGrade = parseNumericGrade(grade.value);
      if (numericGrade === undefined) {
        continue;
      }

      if (!subjectSums.has(grade.subject)) {
        subjectSums.set(grade.subject, { sum: 0, count: 0 });
      }

      const entry = subjectSums.get(grade.subject)!;
      entry.sum += numericGrade;
      entry.count++;
    }
  }

  const result = new Map<string, number>();
  for (const [subject, { sum, count }] of subjectSums) {
    result.set(subject, count > 0 ? sum / count : 0);
  }

  return result;
}

/**
 * Returns students with average at or above the given threshold.
 * Students without an `average` field are excluded.
 *
 * @param students - Array of students
 * @param threshold - Minimum average to qualify (default: HONORS_THRESHOLD = 4.75)
 * @returns Array of students meeting the threshold
 *
 * @example
 * const topStudents = getTopStudents(students);  // 4.75+ by default
 * const veryGood = getTopStudents(students, 4.0);  // 4.0+
 */
export function getTopStudents(
  students: Student[],
  threshold: number = HONORS_THRESHOLD
): Student[] {
  return students.filter(
    (student) => student.average !== undefined && student.average >= threshold
  );
}

/**
 * Counts students by their average grade range.
 * - satisfactory: 3.5 - 3.99
 * - good: 4.0 - 4.74
 * - honors: 4.75+ (eligible for distinction certificate)
 *
 * Students without an `average` field or with average below 3.5 are excluded.
 *
 * @param students - Array of students
 * @returns Count of students in each average range
 *
 * @example
 * const ranges = countStudentsByAverageRange(students);
 * console.log(ranges.honors); // Number of honor students
 */
export function countStudentsByAverageRange(
  students: Student[]
): AverageRangeCounts {
  const counts: AverageRangeCounts = {
    satisfactory: 0,
    good: 0,
    honors: 0,
  };

  for (const student of students) {
    if (student.average === undefined) {
      continue;
    }

    if (student.average >= HONORS_THRESHOLD) {
      counts.honors++;
    } else if (student.average >= GOOD_THRESHOLD) {
      counts.good++;
    } else if (student.average >= SATISFACTORY_THRESHOLD) {
      counts.satisfactory++;
    }
    // Students below SATISFACTORY_THRESHOLD are not counted
  }

  return counts;
}

import type { Student, BehaviorCounts } from "../types/index.js";

/**
 * Counts students by their behavior grade.
 * Students without a `behavior` field are excluded.
 *
 * @param students - Array of students
 * @returns Count of students for each behavior grade
 *
 * @example
 * const behaviorDist = countBehaviorGrades(students);
 * console.log(behaviorDist.exemplary); // Students with exemplary behavior
 */
export function countBehaviorGrades(students: Student[]): BehaviorCounts {
  const counts: BehaviorCounts = {
    exemplary: 0,
    veryGood: 0,
    good: 0,
    acceptable: 0,
    inappropriate: 0,
    reprehensible: 0,
  };

  for (const student of students) {
    if (student.behavior !== undefined) {
      counts[student.behavior]++;
    }
  }

  return counts;
}

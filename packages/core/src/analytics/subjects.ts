import type { Student } from "../types/index.js";

/**
 * Values that indicate a student is NOT enrolled in a subject.
 * "zwolniony" means "exempted" - student is excused from the subject.
 */
const NOT_ENROLLED_VALUES = new Set(["zwolniony", ""]);

/**
 * Checks if a grade value indicates the student is enrolled in the subject.
 * Enrolled = has a grade AND it's not null/empty/"zwolniony".
 * Note: "nieklasyfikowany" and "brak oceny" count as enrolled (student takes subject but ungraded).
 */
function isEnrolled(value: string | null): boolean {
  if (value === null) return false;
  return !NOT_ENROLLED_VALUES.has(value.toLowerCase().trim());
}

/**
 * Counts how many students are enrolled in each subject.
 * A student is enrolled if they have a grade that is not null/empty/"zwolniony".
 *
 * @param students - Array of students
 * @returns Map from subject name to enrolled student count
 *
 * @example
 * const counts = countStudentsBySubject(students);
 * console.log(counts.get("Matematyka")); // 25
 * console.log(counts.get("Edukacja zdrowotna")); // 12
 */
export function countStudentsBySubject(
  students: Student[]
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const student of students) {
    for (const grade of student.grades) {
      if (isEnrolled(grade.value)) {
        const current = counts.get(grade.subject) ?? 0;
        counts.set(grade.subject, current + 1);
      }
    }
  }

  return counts;
}

/**
 * Returns subjects where fewer students are enrolled than the total class size.
 * These are typically optional subjects like "Edukacja zdrowotna".
 *
 * @param students - Array of students
 * @returns Array of subject names with partial enrollment, sorted alphabetically
 *
 * @example
 * const optional = getOptionalSubjects(students);
 * // ["Edukacja zdrowotna", "Religia"]
 */
export function getOptionalSubjects(students: Student[]): string[] {
  if (students.length === 0) return [];

  const counts = countStudentsBySubject(students);
  const classSize = students.length;

  const optional: string[] = [];
  for (const [subject, count] of counts) {
    if (count < classSize) {
      optional.push(subject);
    }
  }

  return optional.sort();
}

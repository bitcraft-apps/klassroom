import type { Student, ClassAttendanceStats } from "../types/index.js";
import { calculateAttendancePercentage } from "../types/index.js";

/**
 * Calculates class-wide attendance statistics from student data.
 * Students without an `attendance` field are excluded from percentage average
 * but contribute 0 to totals.
 *
 * @param students - Array of students
 * @returns Aggregated attendance statistics for the class
 *
 * @example
 * const stats = calculateClassAttendance(students);
 * console.log(stats.averagePercentage); // Class average attendance %
 */
export function calculateClassAttendance(students: Student[]): ClassAttendanceStats {
  const stats: ClassAttendanceStats = {
    averagePercentage: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalExcused: 0,
    totalLate: 0,
    studentsBelow90: 0,
    studentsBelow80: 0,
  };

  let percentageSum = 0;
  let studentsWithAttendance = 0;

  for (const student of students) {
    if (student.attendance !== undefined) {
      stats.totalPresent += student.attendance.present;
      stats.totalAbsent += student.attendance.absent;
      stats.totalExcused += student.attendance.excused;
      stats.totalLate += student.attendance.late;

      const percentage = calculateAttendancePercentage(student.attendance);
      if (percentage !== null) {
        percentageSum += percentage;
        studentsWithAttendance++;

        if (percentage < 90) {
          stats.studentsBelow90++;
        }
        if (percentage < 80) {
          stats.studentsBelow80++;
        }
      }
    }
  }

  if (studentsWithAttendance > 0) {
    stats.averagePercentage = percentageSum / studentsWithAttendance;
  }

  return stats;
}

/**
 * Returns students whose attendance percentage is below a threshold.
 * Students without attendance data or with no lessons are excluded.
 *
 * @param students - Array of students
 * @param threshold - Minimum acceptable attendance percentage (default: 90)
 * @returns Students with attendance below the threshold
 *
 * @example
 * const lowAttendance = getStudentsWithLowAttendance(students, 85);
 */
export function getStudentsWithLowAttendance(
  students: Student[],
  threshold: number = 90
): Student[] {
  const result: Student[] = [];

  for (const student of students) {
    if (student.attendance !== undefined) {
      const percentage = calculateAttendancePercentage(student.attendance);
      if (percentage !== null && percentage < threshold) {
        result.push(student);
      }
    }
  }

  return result;
}

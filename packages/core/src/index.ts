export const VERSION = "0.0.0";

// Types (public API - all GDPR-safe)
export type {
  StudentNumber,
  ClassPeriod,
  BehaviorGrade,
  Grade,
  AttendanceStats,
  Student,
  ClassMetadata,
  ClassData,
  // Analytics types
  GradeCounts,
  AverageRangeCounts,
  BehaviorCounts,
} from "./types/index.js";

// Factory functions for branded types
export { studentNumber, classPeriod } from "./types/index.js";

// Helper functions
export {
  parseBehaviorGrade,
  behaviorToIndex,
  compareBehavior,
  calculateAttendancePercentage,
} from "./types/index.js";

// Constants
export { BEHAVIOR_GRADES, POLISH_TO_BEHAVIOR } from "./types/index.js";

// Parser
export { parseLibrusXlsx, detectFormat } from "./parser/index.js";
export type { DetectedFormat } from "./parser/index.js";

// Analytics
export {
  // Grade statistics
  countGradesByType,
  countGradesBySubject,
  // Student statistics
  calculateClassAverage,
  calculateMinMaxAverage,
  calculateSubjectAverages,
  getTopStudents,
  countStudentsByAverageRange,
  // Behavior statistics
  countBehaviorGrades,
} from "./analytics/index.js";

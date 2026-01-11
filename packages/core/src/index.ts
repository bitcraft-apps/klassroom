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
} from "./types/index.js";

// Factory functions for branded types
export { studentNumber, classPeriod } from "./types/index.js";

// Constants
export { BEHAVIOR_GRADES, POLISH_TO_BEHAVIOR } from "./types/index.js";

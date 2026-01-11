export const VERSION = "0.0.0";

// Types
export type {
  StudentNumber,
  ClassPeriod,
  BehaviorGrade,
  Grade,
  AttendanceStats,
  RawStudent,
  Student,
  ClassMetadata,
  ClassData,
} from "./types/index.js";

// Factory functions for branded types
export { studentNumber, classPeriod } from "./types/index.js";

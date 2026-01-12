import packageJson from '../package.json' with { type: 'json' };
export const VERSION: string = packageJson.version;

// Types (public API - all GDPR-safe)
export type {
  StudentNumber,
  ClassPeriod,
  BehaviorGrade,
  Grade,
  ClassAttendance,
  FailureStatistics,
  AggregateGradeDistribution,
  Student,
  ClassMetadata,
  ClassData,
  // Analytics types
  NumericGrade,
  GradeCounts,
  AverageRangeCounts,
  BehaviorCounts,
} from './types/index.js';

// Factory functions for branded types
export { studentNumber, classPeriod } from './types/index.js';

// Helper functions
export { parseBehaviorGrade, behaviorToIndex, compareBehavior } from './types/index.js';

// Constants
export { BEHAVIOR_GRADES, POLISH_TO_BEHAVIOR } from './types/index.js';

// Parser
export { parseVulcanXlsx, detectFormat } from './parser/index.js';
export type { DetectedFormat } from './parser/index.js';

// Analytics
export {
  // Grade statistics
  countGradesByType,
  countGradesBySubject,
  parseNumericGrade,
  emptyGradeCounts,
  // Student statistics
  calculateClassAverage,
  calculateMinMaxAverage,
  calculateSubjectAverages,
  getTopStudents,
  countStudentsByAverageRange,
  HONORS_THRESHOLD,
  // Behavior statistics
  countBehaviorGrades,
} from './analytics/index.js';

// Charts
export {
  createSubjectAveragesChart,
  createStudentAveragesChart,
  createGradeDistributionChart,
  createBehaviorChart,
  createAggregateGradesPieChart,
} from './charts/index.js';

export type {
  ChartConfig,
  ChartDataset,
  ChartOptions,
  ScaleOptions,
  BarChartConfig,
  DoughnutChartConfig,
  PieChartConfig,
  ChartStudentData,
} from './charts/index.js';

// Generator
export { generatePresentation } from './generator/index.js';
export type { GeneratePresentationOptions } from './generator/index.js';

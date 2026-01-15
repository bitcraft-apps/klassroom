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

// Parser (browser-compatible only - use @klassroom/core/node for file-based parsing)
export { parseVulcanXlsxFromBuffer, detectFormat } from './parser/buffer.js';
export type { DetectedFormat } from './parser/buffer.js';

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

// AI
export { generateConclusions } from './ai/index.js';
export type { AnalyticsResult } from './ai/index.js';

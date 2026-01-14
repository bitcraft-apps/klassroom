/**
 * Browser entry point for @klassroom/core.
 * Import from '@klassroom/core/browser' to use browser-compatible chart rendering.
 *
 * This module excludes Node.js-specific dependencies (chartjs-node-canvas, xlsx).
 */

// Browser-compatible chart renderer
export {
  renderChartToDataUrl,
  PLACEHOLDER_IMAGE,
} from './generator/render-charts-browser.js';

// Chart configuration types (no Node.js dependencies)
export type {
  ChartConfig,
  ChartDataset,
  ChartOptions,
  ScaleOptions,
  BarChartConfig,
  DoughnutChartConfig,
  PieChartConfig,
} from './charts/types.js';

// Chart creation functions (no Node.js dependencies)
export { createSubjectAveragesChart } from './charts/subjects.js';
export { createStudentAveragesChart } from './charts/students.js';
export type { ChartStudentData } from './charts/students.js';
export { createGradeDistributionChart } from './charts/grades.js';
export { createBehaviorChart } from './charts/behavior.js';
export { createAggregateGradesPieChart } from './charts/aggregate-grades.js';

// Domain types needed for chart creation
export type {
  BehaviorGrade,
  AggregateGradeDistribution,
  NumericGrade,
  GradeCounts,
  AverageRangeCounts,
  BehaviorCounts,
} from './types/index.js';

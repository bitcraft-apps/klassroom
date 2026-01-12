// Chart configuration types
export type {
  ChartConfig,
  ChartDataset,
  ChartOptions,
  ScaleOptions,
  BarChartConfig,
  DoughnutChartConfig,
  PieChartConfig,
} from './types.js';

// Subject averages chart
export { createSubjectAveragesChart } from './subjects.js';

// Student averages chart (GDPR-safe: uses numbers only)
export { createStudentAveragesChart } from './students.js';
export type { ChartStudentData } from './students.js';

// Grade distribution chart
export { createGradeDistributionChart } from './grades.js';

// Behavior chart
export { createBehaviorChart } from './behavior.js';

// Aggregate grade distribution pie chart
export { createAggregateGradesPieChart } from './aggregate-grades.js';

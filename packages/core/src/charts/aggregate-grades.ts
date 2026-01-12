import type { AggregateGradeDistribution } from '../types/index.js';
import type { PieChartConfig } from './types.js';

/**
 * Colors for grade distribution pie chart.
 * Green for high grades (5-6), yellow/amber for medium (3-4), orange/red for low (1-2), gray for unclassified.
 */
const GRADE_COLORS = [
  '#10B981', // 6 (celujący) - emerald
  '#22C55E', // 5 (bardzo dobry) - green
  '#EAB308', // 4 (dobry) - yellow
  '#F59E0B', // 3 (dostateczny) - amber
  '#F97316', // 2 (dopuszczający) - orange
  '#EF4444', // 1 (niedostateczny) - red
  '#6B7280', // nieklasyfikowany - gray
];

/**
 * Polish grade labels for pie chart.
 */
const GRADE_LABELS = [
  'Celujący (6)',
  'Bardzo dobry (5)',
  'Dobry (4)',
  'Dostateczny (3)',
  'Dopuszczający (2)',
  'Niedostateczny (1)',
  'Nieklasyfikowany',
];

/**
 * Creates a pie chart configuration for aggregate grade distribution.
 * Shows count of final grades across all subjects and students.
 *
 * @param distribution - Aggregate grade distribution counts
 * @returns Chart.js configuration for a pie chart, or null if no data
 *
 * @example
 * const distribution = parseAggregateGradeDistribution(sheet);
 * const config = createAggregateGradesPieChart(distribution);
 * if (config) {
 *   new Chart(ctx, config);
 * }
 */
export function createAggregateGradesPieChart(
  distribution: AggregateGradeDistribution,
): PieChartConfig | null {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  const data = [
    distribution.excellent,
    distribution.veryGood,
    distribution.good,
    distribution.satisfactory,
    distribution.acceptable,
    distribution.failing,
    distribution.unclassified,
  ];

  return {
    type: 'pie',
    data: {
      labels: GRADE_LABELS,
      datasets: [
        {
          data,
          backgroundColor: GRADE_COLORS,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
      },
    },
  };
}

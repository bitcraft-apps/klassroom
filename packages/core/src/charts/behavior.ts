import type { BehaviorCounts } from "../types/index.js";
import type { DoughnutChartConfig } from "./types.js";

/** Colors for behavior grades (best to worst) */
const BEHAVIOR_COLORS = [
  "#10B981", // exemplary - emerald
  "#22C55E", // veryGood - green
  "#84CC16", // good - lime
  "#EAB308", // acceptable - yellow
  "#F97316", // inappropriate - orange
  "#EF4444", // reprehensible - red
];

/** Behavior grade labels (Polish) */
const BEHAVIOR_LABELS = [
  "Wzorowe",
  "Bardzo dobre",
  "Dobre",
  "Poprawne",
  "Nieodpowiednie",
  "Naganne",
];

/**
 * Creates a doughnut chart configuration for behavior grade distribution.
 * Shows count of students in each behavior grade category.
 *
 * @param behaviorCounts - Object with counts for each behavior grade
 * @returns Chart.js configuration for a doughnut chart, or null if no data
 *
 * @example
 * const counts = countBehaviorGrades(students);
 * const config = createBehaviorChart(counts);
 * if (config) {
 *   new Chart(ctx, config);
 * }
 */
export function createBehaviorChart(
  behaviorCounts: BehaviorCounts
): DoughnutChartConfig | null {
  const total = Object.values(behaviorCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (total === 0) {
    return null;
  }

  const data = [
    behaviorCounts.exemplary,
    behaviorCounts.veryGood,
    behaviorCounts.good,
    behaviorCounts.acceptable,
    behaviorCounts.inappropriate,
    behaviorCounts.reprehensible,
  ];

  return {
    type: "doughnut",
    data: {
      labels: BEHAVIOR_LABELS,
      datasets: [
        {
          data,
          backgroundColor: BEHAVIOR_COLORS,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: "right",
        },
      },
    },
  };
}

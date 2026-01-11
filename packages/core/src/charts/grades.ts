import type { GradeCounts } from "../types/index.js";
import type { BarChartConfig } from "./types.js";

/** Colors for grades 1-6 (red to green gradient) */
const GRADE_COLORS = [
  "#EF4444", // 1 - red
  "#F97316", // 2 - orange
  "#EAB308", // 3 - yellow
  "#84CC16", // 4 - lime
  "#22C55E", // 5 - green
  "#10B981", // 6 - emerald
];

/** Grade labels 1-6 */
const GRADE_LABELS = ["1", "2", "3", "4", "5", "6"];

/**
 * Creates a bar chart configuration for grade distribution.
 * Shows count of each grade (1-6) across all students and subjects.
 *
 * @param gradeCounts - Object with counts for each grade 1-6
 * @returns Chart.js configuration for a bar chart, or null if no grades
 *
 * @example
 * const counts = countGradesByType(students);
 * const config = createGradeDistributionChart(counts);
 * if (config) {
 *   new Chart(ctx, config);
 * }
 */
export function createGradeDistributionChart(
  gradeCounts: GradeCounts
): BarChartConfig | null {
  const total = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return null;
  }

  const data = [
    gradeCounts[1],
    gradeCounts[2],
    gradeCounts[3],
    gradeCounts[4],
    gradeCounts[5],
    gradeCounts[6],
  ];

  return {
    type: "bar",
    data: {
      labels: GRADE_LABELS,
      datasets: [
        {
          label: "Liczba",
          data,
          backgroundColor: GRADE_COLORS,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Ocena",
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Liczba",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };
}

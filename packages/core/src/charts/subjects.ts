import type { BarChartConfig } from "./types.js";

/** Default color for subject average bars */
const SUBJECT_BAR_COLOR = "#4F46E5";

/**
 * Creates a horizontal bar chart configuration for subject averages.
 * Subjects are sorted by average in descending order (highest first).
 *
 * @param subjectAverages - Map of subject names to their average grades
 * @returns Chart.js configuration for a horizontal bar chart, or null if no data
 *
 * @example
 * const subjectAvgs = calculateSubjectAverages(students);
 * const config = createSubjectAveragesChart(subjectAvgs);
 * if (config) {
 *   new Chart(ctx, config);
 * }
 */
export function createSubjectAveragesChart(
  subjectAverages: Map<string, number>
): BarChartConfig | null {
  if (subjectAverages.size === 0) {
    return null;
  }

  // Sort subjects by average descending
  const sorted = [...subjectAverages.entries()].sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([subject]) => subject);
  const data = sorted.map(([, avg]) => avg);

  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Average Grade",
          data,
          backgroundColor: SUBJECT_BAR_COLOR,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      scales: {
        x: {
          beginAtZero: true,
          min: 1,
          max: 6,
          title: {
            display: true,
            text: "Grade",
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

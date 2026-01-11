import type { Student, StudentNumber } from "../types/index.js";
import type { BarChartConfig } from "./types.js";

/** Default color for student average bars */
const STUDENT_BAR_COLOR = "#0891B2";

/**
 * GDPR-safe student data for chart generation.
 * Contains only the student number (no name or other PII).
 */
export interface ChartStudentData {
  number: StudentNumber;
  average: number;
}

/**
 * Creates a vertical bar chart configuration for student averages.
 * Students are sorted by number in ascending order (roster order).
 *
 * GDPR: Uses student numbers only as labels, never names.
 *
 * @param students - Array of students with averages
 * @returns Chart.js configuration for a vertical bar chart, or null if no data
 *
 * @example
 * const config = createStudentAveragesChart(students);
 * if (config) {
 *   new Chart(ctx, config);
 * }
 */
export function createStudentAveragesChart(
  students: Student[]
): BarChartConfig | null {
  // Filter to students with averages and map to chart-safe data
  const chartData: ChartStudentData[] = students
    .filter((s): s is Student & { average: number } => s.average !== undefined)
    .map((s) => ({ number: s.number, average: s.average }));

  if (chartData.length === 0) {
    return null;
  }

  // Sort by student number ascending (roster order)
  chartData.sort((a, b) => a.number - b.number);

  const labels = chartData.map((s) => String(s.number));
  const data = chartData.map((s) => s.average);

  return {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Average Grade",
          data,
          backgroundColor: STUDENT_BAR_COLOR,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Student Number",
          },
        },
        y: {
          beginAtZero: true,
          min: 1,
          max: 6,
          title: {
            display: true,
            text: "Average Grade",
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

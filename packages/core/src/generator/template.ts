import type {
  BehaviorCounts,
  ClassAttendance,
  FailureStatistics,
  AggregateGradeDistribution,
  GradeCounts,
  StudentNumber,
} from "../types/index.js";

/**
 * GDPR-safe row for top students slide.
 * Uses student number only, never name.
 */
export interface TopStudentRow {
  number: StudentNumber;
  average: number;
}

/**
 * Presentation data structure for rendering.
 * All data is GDPR-safe (no student names).
 */
export interface PresentationData {
  metadata: {
    className: string;
    period: string;
    teacher?: string;
  };
  generatedDate: string;
  overview: {
    studentCount: number;
    classAverage: string;
    minAverage: string;
    maxAverage: string;
  };
  charts: {
    subjectAverages: string | null;
    studentAverages: string | null;
  };
  gradeDistribution: GradeDistributionRow[] | null;
  behaviorCounts: BehaviorCounts | null;
  topStudents: TopStudentRow[] | null;
  classAttendance: ClassAttendance | null;
  failureStatistics: FailureStatistics | null;
  aggregateGradeDistribution: AggregateGradeDistribution | null;
  aggregateGradesPieChart: string | null;
}

export interface GradeDistributionRow {
  subject: string;
  grades: GradeCounts;
}

// ============================================================================
// Styles
// ============================================================================

const STYLES = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f3f4f6;
}
.slide {
  min-height: 100vh;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}
.slide:nth-child(even) {
  background: #f9fafb;
}
.slide h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}
.slide h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2rem;
  border-bottom: 3px solid #4f46e5;
  padding-bottom: 0.5rem;
  display: inline-block;
}
.title-slide {
  text-align: center;
}
.title-slide h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
}
.title-slide .metadata {
  font-size: 1.5rem;
  color: #4b5563;
}
.title-slide .metadata p {
  margin: 0.5rem 0;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.stat-card .value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #4f46e5;
}
.stat-card .label {
  font-size: 1rem;
  color: #6b7280;
  margin-top: 0.5rem;
}
.chart-container {
  margin: 2rem auto;
  max-width: 800px;
}
.chart-container img {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
th, td {
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}
th {
  background: #4f46e5;
  color: white;
  font-weight: 600;
}
tr:last-child td {
  border-bottom: none;
}
tr:hover {
  background: #f9fafb;
}
.no-data {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 3rem;
}
.slide-subtitle {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 1rem;
}
@media print {
  body {
    background: white;
  }
  .slide {
    min-height: auto;
    padding: 2rem;
    page-break-after: always;
    border-bottom: none;
    box-shadow: none;
  }
  .slide:last-child {
    page-break-after: avoid;
  }
  .stat-card {
    box-shadow: none;
    border: 1px solid #d1d5db;
  }
  .chart-container img {
    box-shadow: none;
  }
  table {
    box-shadow: none;
  }
}
`;

// ============================================================================
// Slide Renderers
// ============================================================================

function renderTitleSlide(data: PresentationData): string {
  const { metadata, generatedDate } = data;
  const teacherLine = metadata.teacher
    ? `<p><strong>Wychowawca:</strong> ${escapeHtml(metadata.teacher)}</p>`
    : "";

  return `
  <section class="slide title-slide">
    <h1>Zebranie z rodzicami</h1>
    <div class="metadata">
      <p><strong>Klasa:</strong> ${escapeHtml(metadata.className)}</p>
      <p><strong>Semestr:</strong> ${escapeHtml(metadata.period)}</p>
      ${teacherLine}
      <p><strong>Data:</strong> ${escapeHtml(generatedDate)}</p>
    </div>
  </section>`;
}

function renderOverviewSlide(data: PresentationData): string {
  const { overview } = data;

  return `
  <section class="slide">
    <h2>Podsumowanie klasy</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${overview.studentCount}</div>
        <div class="label">Liczba uczniów</div>
      </div>
      <div class="stat-card">
        <div class="value">${escapeHtml(overview.classAverage)}</div>
        <div class="label">Średnia klasy</div>
      </div>
      <div class="stat-card">
        <div class="value">${escapeHtml(overview.minAverage)}</div>
        <div class="label">Najniższa średnia</div>
      </div>
      <div class="stat-card">
        <div class="value">${escapeHtml(overview.maxAverage)}</div>
        <div class="label">Najwyższa średnia</div>
      </div>
    </div>
  </section>`;
}

function renderSubjectAveragesSlide(data: PresentationData): string {
  const chartUrl = safeDataUrl(data.charts.subjectAverages);
  const content = chartUrl
    ? `<div class="chart-container">
        <img src="${chartUrl}" alt="Wykres średnich ocen z przedmiotów">
      </div>`
    : `<p class="no-data">Brak danych</p>`;

  return `
  <section class="slide">
    <h2>Średnie ocen z przedmiotów</h2>
    ${content}
  </section>`;
}

function renderGradeDistributionSlide(data: PresentationData): string {
  if (!data.gradeDistribution || data.gradeDistribution.length === 0) {
    return `
  <section class="slide">
    <h2>Rozkład ocen</h2>
    <p class="no-data">Brak danych</p>
  </section>`;
  }

  const rows = data.gradeDistribution
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.subject)}</td>
          <td>${row.grades[1]}</td>
          <td>${row.grades[2]}</td>
          <td>${row.grades[3]}</td>
          <td>${row.grades[4]}</td>
          <td>${row.grades[5]}</td>
          <td>${row.grades[6]}</td>
        </tr>`
    )
    .join("");

  return `
  <section class="slide">
    <h2>Rozkład ocen</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">Przedmiot</th>
          <th scope="col">1</th>
          <th scope="col">2</th>
          <th scope="col">3</th>
          <th scope="col">4</th>
          <th scope="col">5</th>
          <th scope="col">6</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
  </section>`;
}

function renderStudentAveragesSlide(data: PresentationData): string {
  const chartUrl = safeDataUrl(data.charts.studentAverages);
  const content = chartUrl
    ? `<div class="chart-container">
        <img src="${chartUrl}" alt="Wykres średnich ocen uczniów">
      </div>`
    : `<p class="no-data">Brak danych</p>`;

  return `
  <section class="slide">
    <h2>Średnie ocen uczniów</h2>
    ${content}
  </section>`;
}

function renderTopStudentsSlide(data: PresentationData): string {
  if (!data.topStudents || data.topStudents.length === 0) {
    return "";
  }

  const rows = data.topStudents
    .map(
      ({ number, average }) => `
        <tr>
          <td>${number}</td>
          <td>${average.toFixed(2).replace(".", ",")}</td>
        </tr>`
    )
    .join("");

  // Polish grammar: 1 uczeń (singular), 2+ uczniów (genitive plural)
  const studentLabel = data.topStudents.length === 1 ? "uczeń" : "uczniów";

  return `
  <section class="slide">
    <h2>Najwyższe średnie</h2>
    <p class="slide-subtitle">Średnia 4,75 i wyżej (${data.topStudents.length} ${studentLabel})</p>
    <table>
      <thead>
        <tr>
          <th scope="col">Numer ucznia</th>
          <th scope="col">Średnia</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
  </section>`;
}

function renderAttendanceSlide(data: PresentationData): string {
  // Skip slide if no attendance and no failure statistics
  if (!data.classAttendance && !data.failureStatistics) {
    return "";
  }

  let attendanceCard = "";
  if (data.classAttendance) {
    const { percentage, date } = data.classAttendance;
    // Format percentage with Polish decimal separator (comma)
    const formattedPercentage = `${percentage.toFixed(1).replace(".", ",")}%`;
    // Show date if available
    const dateInfo = date ? ` (stan na ${date})` : "";
    attendanceCard = `
      <div class="stat-card">
        <div class="value">${formattedPercentage}</div>
        <div class="label">Średnia frekwencja klasy${dateInfo}</div>
      </div>`;
  }

  let failureStatsHtml = "";
  if (data.failureStatistics) {
    const { noFailingGrades, oneToTwoFailingGrades, threeOrMoreFailingGrades, unclassified } =
      data.failureStatistics;
    failureStatsHtml = `
    <h3 style="margin-top: 2rem; margin-bottom: 1rem; color: #374151;">Zagrożenia</h3>
    <table>
      <thead>
        <tr>
          <th scope="col">Kategoria</th>
          <th scope="col">Liczba uczniów</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Bez ocen niedostatecznych</td>
          <td>${noFailingGrades}</td>
        </tr>
        <tr>
          <td>Z 1-2 ocenami niedostatecznymi</td>
          <td>${oneToTwoFailingGrades}</td>
        </tr>
        <tr>
          <td>Z 3+ ocenami niedostatecznymi</td>
          <td>${threeOrMoreFailingGrades}</td>
        </tr>
        <tr>
          <td>Nieklasyfikowani</td>
          <td>${unclassified}</td>
        </tr>
      </tbody>
    </table>`;
  }

  return `
  <section class="slide">
    <h2>Frekwencja i zagrożenia</h2>
    <div class="stats-grid">${attendanceCard}
    </div>${failureStatsHtml}
  </section>`;
}

function renderAggregateGradesSlide(data: PresentationData): string {
  if (!data.aggregateGradeDistribution && !data.aggregateGradesPieChart) {
    return "";
  }

  const chartUrl = safeDataUrl(data.aggregateGradesPieChart);
  const chartContent = chartUrl
    ? `<div class="chart-container">
        <img src="${chartUrl}" alt="Wykres rozkładu ocen">
      </div>`
    : "";

  // If we only have chart, show just the chart
  if (!data.aggregateGradeDistribution) {
    return chartContent
      ? `
  <section class="slide">
    <h2>Rozkład wszystkich ocen</h2>
    ${chartContent}
  </section>`
      : "";
  }

  const {
    excellent,
    veryGood,
    good,
    satisfactory,
    acceptable,
    failing,
    unclassified,
  } = data.aggregateGradeDistribution;

  return `
  <section class="slide">
    <h2>Rozkład wszystkich ocen</h2>
    ${chartContent}
    <table>
      <thead>
        <tr>
          <th scope="col">Ocena</th>
          <th scope="col">Liczba</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Celujący (6)</td>
          <td>${excellent}</td>
        </tr>
        <tr>
          <td>Bardzo dobry (5)</td>
          <td>${veryGood}</td>
        </tr>
        <tr>
          <td>Dobry (4)</td>
          <td>${good}</td>
        </tr>
        <tr>
          <td>Dostateczny (3)</td>
          <td>${satisfactory}</td>
        </tr>
        <tr>
          <td>Dopuszczający (2)</td>
          <td>${acceptable}</td>
        </tr>
        <tr>
          <td>Niedostateczny (1)</td>
          <td>${failing}</td>
        </tr>
        <tr>
          <td>Nieklasyfikowany</td>
          <td>${unclassified}</td>
        </tr>
      </tbody>
    </table>
  </section>`;
}

function renderBehaviorSlide(data: PresentationData): string {
  if (!data.behaviorCounts) {
    return `
  <section class="slide">
    <h2>Zachowanie</h2>
    <p class="no-data">Brak danych</p>
  </section>`;
  }

  const { behaviorCounts } = data;

  return `
  <section class="slide">
    <h2>Zachowanie</h2>
    <table>
      <thead>
        <tr>
          <th scope="col">Ocena zachowania</th>
          <th scope="col">Liczba uczniów</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Wzorowe</td>
          <td>${behaviorCounts.exemplary}</td>
        </tr>
        <tr>
          <td>Bardzo dobre</td>
          <td>${behaviorCounts.veryGood}</td>
        </tr>
        <tr>
          <td>Dobre</td>
          <td>${behaviorCounts.good}</td>
        </tr>
        <tr>
          <td>Poprawne</td>
          <td>${behaviorCounts.acceptable}</td>
        </tr>
        <tr>
          <td>Nieodpowiednie</td>
          <td>${behaviorCounts.inappropriate}</td>
        </tr>
        <tr>
          <td>Naganne</td>
          <td>${behaviorCounts.reprehensible}</td>
        </tr>
      </tbody>
    </table>
  </section>`;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS.
 * @internal Exported for testing only
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validates and returns a safe data URL for images.
 * Returns null if the URL is not a valid PNG data URL.
 * @internal Exported for testing only
 */
export function safeDataUrl(url: string | null): string | null {
  if (!url) return null;
  // Only allow base64-encoded PNG data URLs
  if (url.startsWith("data:image/png;base64,")) {
    return url;
  }
  return null;
}

// ============================================================================
// Main Renderer
// ============================================================================

/**
 * Renders presentation data to a complete HTML string.
 * All text is in Polish. Output is self-contained with inline CSS.
 */
export function renderPresentation(data: PresentationData): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zebranie z rodzicami - ${escapeHtml(data.metadata.className)}</title>
  <style>${STYLES}</style>
</head>
<body>${renderTitleSlide(data)}${renderOverviewSlide(data)}${renderSubjectAveragesSlide(data)}${renderGradeDistributionSlide(data)}${renderStudentAveragesSlide(data)}${renderTopStudentsSlide(data)}${renderAttendanceSlide(data)}${renderAggregateGradesSlide(data)}${renderBehaviorSlide(data)}
</body>
</html>`;
}

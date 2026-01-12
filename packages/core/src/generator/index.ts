import type { ClassData } from '../types/index.js';
import {
  calculateClassAverage,
  calculateMinMaxAverage,
  calculateSubjectAverages,
  countGradesBySubject,
  countBehaviorGrades,
  getTopStudents,
  getOptionalSubjects,
  countStudentsBySubject,
} from '../analytics/index.js';
import {
  createSubjectAveragesChart,
  createStudentAveragesChart,
  createAggregateGradesPieChart,
  type ChartConfig,
} from '../charts/index.js';
import { renderChartToDataUrl, PLACEHOLDER_IMAGE } from './render-charts.js';
import {
  renderPresentation,
  type PresentationData,
  type GradeDistributionRow,
  type TopStudentRow,
} from './template.js';

/**
 * Generates a self-contained HTML presentation for a parent-teacher meeting.
 *
 * GDPR: Output uses student numbers only, never names.
 * All text is in Polish.
 *
 * @param data - Parsed class data from Vulcan XLSX export
 * @returns Promise resolving to complete HTML string
 *
 * @example
 * const data = parseVulcanXlsx("grades.xlsx");
 * const html = await generatePresentation(data);
 * fs.writeFileSync("presentation.html", html);
 */
export async function generatePresentation(data: ClassData): Promise<string> {
  const { metadata, students, classAttendance, failureStatistics, aggregateGradeDistribution } =
    data;

  // Calculate analytics
  const classAverage = calculateClassAverage(students);
  const minMax = calculateMinMaxAverage(students);
  const subjectAverages = calculateSubjectAverages(students);
  const gradesBySubject = countGradesBySubject(students);
  const behaviorCounts = countBehaviorGrades(students);
  const subjectCounts = countStudentsBySubject(students);
  const optionalSubjects = getOptionalSubjects(students);

  // Create chart configs
  const subjectChartConfig = createSubjectAveragesChart(subjectAverages);
  const studentChartConfig = createStudentAveragesChart(students);
  const aggregateGradesChartConfig = aggregateGradeDistribution
    ? createAggregateGradesPieChart(aggregateGradeDistribution)
    : null;

  // Render charts to base64 images in parallel
  const renderChart = async <T extends string>(
    config: ChartConfig<T> | null,
    label: string,
  ): Promise<string | null> => {
    if (!config) return null;
    try {
      return await renderChartToDataUrl(config);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`Failed to render ${label} chart:`, error);
      }
      return PLACEHOLDER_IMAGE;
    }
  };

  const [subjectChartImage, studentChartImage, aggregateGradesChartImage] = await Promise.all([
    renderChart(subjectChartConfig, 'subject averages'),
    renderChart(studentChartConfig, 'student averages'),
    renderChart(aggregateGradesChartConfig, 'aggregate grades'),
  ]);

  // Convert grade distribution to template-friendly format
  const gradeDistribution: GradeDistributionRow[] | null =
    gradesBySubject.size > 0
      ? [...gradesBySubject.entries()]
          .sort((a, b) => a[0].localeCompare(b[0], 'pl'))
          .map(([subject, grades]) => ({ subject, grades }))
      : null;

  // Check if any behavior data exists
  const hasBehaviorData = Object.values(behaviorCounts).some((c) => c > 0);

  // Get top students (4.75+ average) sorted by average desc, then number asc
  // Note: getTopStudents filters to students with defined averages, so average! is safe
  const topStudentsData = getTopStudents(students);
  const topStudents: TopStudentRow[] | null =
    topStudentsData.length > 0
      ? topStudentsData
          .map(({ number, average }) => ({ number, average: average! }))
          .sort((a, b) => b.average - a.average || a.number - b.number)
      : null;

  // Map optional subjects to the data structure
  const subjectEnrollment = optionalSubjects.map((subject) => ({
    subject,
    count: subjectCounts.get(subject) ?? 0,
  }));

  // Format date in Polish
  const generatedDate = new Date().toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Prepare presentation data
  const presentationData: PresentationData = {
    metadata: {
      className: metadata.className,
      period: metadata.period,
      teacher: metadata.teacher,
    },
    generatedDate,
    overview: {
      studentCount: students.length,
      classAverage: classAverage.toFixed(2),
      minAverage: minMax.min.toFixed(2),
      maxAverage: minMax.max.toFixed(2),
    },
    charts: {
      subjectAverages: subjectChartImage,
      studentAverages: studentChartImage,
    },
    gradeDistribution,
    behaviorCounts: hasBehaviorData ? behaviorCounts : null,
    topStudents,
    // Convert undefined (ClassData convention) to null (PresentationData convention)
    classAttendance: classAttendance ?? null,
    failureStatistics: failureStatistics ?? null,
    aggregateGradeDistribution: aggregateGradeDistribution ?? null,
    aggregateGradesPieChart: aggregateGradesChartImage,
    subjectEnrollment: subjectEnrollment.length > 0 ? subjectEnrollment : null,
  };

  return renderPresentation(presentationData);
}

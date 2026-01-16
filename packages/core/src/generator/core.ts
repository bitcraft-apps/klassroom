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
import {
  renderPresentation,
  type PresentationData,
  type GradeDistributionRow,
  type TopStudentRow,
} from './template.js';
import type { AnalyticsResult } from '../ai/index.js';

/**
 * Context for chart rendering - allows dependency injection of
 * Node.js or browser-compatible renderers.
 */
export interface ChartRenderingContext {
  /** Renders a chart config to a base64 data URL */
  render: <T extends string>(config: ChartConfig<T>) => Promise<string>;
  /** Placeholder image to use when rendering fails */
  placeholder: string;
}

/**
 * Options for presentation generation (shared between Node and browser).
 */
export interface GeneratePresentationCoreOptions {
  /** Custom meeting date string for title slide. If omitted, uses current date. */
  meetingDate?: string;
  /** Enable AI-generated conclusions. */
  aiConclusions?: boolean;
  /** Gemini API key for AI conclusions. */
  geminiApiKey?: string;
  /** Optional callback for chart rendering errors. If omitted, errors are silent. */
  onChartRenderError?: (chartName: string, error: unknown) => void;
}

/**
 * Core presentation generator - shared logic between Node and browser versions.
 *
 * GDPR: Output uses student numbers only, never names.
 * All text is in Polish.
 *
 * @param data - Parsed class data from Vulcan XLSX export
 * @param chartContext - Chart rendering context (Node or browser renderer)
 * @param options - Optional generation options
 * @returns Promise resolving to complete HTML string
 *
 * @internal This is an internal API. Use generatePresentation or generatePresentationBrowser instead.
 */
export async function generatePresentationCore(
  data: ClassData,
  chartContext: ChartRenderingContext,
  options?: GeneratePresentationCoreOptions,
): Promise<string> {
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
      return await chartContext.render(config);
    } catch (error) {
      options?.onChartRenderError?.(label, error);
      return chartContext.placeholder;
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

  // Get top students count for AI conclusions
  const topStudentsData = getTopStudents(students);

  // Generate AI conclusions if enabled (uses only aggregate data - GDPR safe)
  // Uses dynamic import to avoid bundling Node-only AI code in browser builds
  let aiConclusionsText: string | null = null;
  if (options?.aiConclusions) {
    const analyticsResult: AnalyticsResult = {
      className: metadata.className,
      studentCount: students.length,
      subjectCount: subjectAverages.size,
      classAverage,
      minStudentAverage: minMax.min,
      maxStudentAverage: minMax.max,
      honorsCount: topStudentsData.length,
      attendancePercentage: classAttendance?.percentage,
      gradeDistribution: aggregateGradeDistribution,
      behaviorDistribution: hasBehaviorData ? behaviorCounts : undefined,
      failureStatistics,
    };
    const { generateConclusions } = await import('../ai/index.js');
    aiConclusionsText = await generateConclusions(analyticsResult, options.geminiApiKey);
  }

  // Get top students (4.75+ average) sorted by average desc, then number asc
  // getTopStudents filters to students with defined averages, so cast is safe
  const topStudents: TopStudentRow[] | null =
    topStudentsData.length > 0
      ? topStudentsData
          .map(({ number, average }) => ({ number, average: average as number }))
          .sort((a, b) => b.average - a.average || a.number - b.number)
      : null;

  // Map optional subjects to the data structure
  const subjectEnrollment = optionalSubjects.map((subject) => ({
    subject,
    count: subjectCounts.get(subject) ?? 0,
  }));

  // Use custom meeting date if provided, otherwise format current date in Polish
  const generatedDate =
    options?.meetingDate ??
    new Date().toLocaleDateString('pl-PL', {
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
    aiConclusions: aiConclusionsText,
  };

  return renderPresentation(presentationData);
}

import type {
  BehaviorCounts,
  AggregateGradeDistribution,
  FailureStatistics,
} from '../types/index.js';

/**
 * GDPR-safe aggregate data for AI analysis.
 * Contains ONLY aggregate counts and statistics, never individual student data.
 */
export interface AnalyticsResult {
  /** Class identifier (e.g., "3A") */
  className: string;
  /** Number of students in class */
  studentCount: number;
  /** Number of subjects */
  subjectCount: number;
  /** Class grade average */
  classAverage: number;
  /** Lowest student average in class */
  minStudentAverage?: number;
  /** Highest student average in class */
  maxStudentAverage?: number;
  /** Count of honor students (average 4.75+) */
  honorsCount?: number;
  /** Class attendance percentage (optional) */
  attendancePercentage?: number;
  /** Grade distribution counts (optional) */
  gradeDistribution?: AggregateGradeDistribution;
  /** Behavior distribution counts (optional) */
  behaviorDistribution?: BehaviorCounts;
  /** Failure statistics - students with failing grades (optional) */
  failureStatistics?: FailureStatistics;
}

const MODEL = 'gemini-2.5-flash-lite';
const TIMEOUT_MS = 15_000;

/**
 * Builds the Polish prompt with aggregate class data.
 * Requests structured, methodical output with balanced positive/negative aspects.
 */
function buildPrompt(analytics: AnalyticsResult): string {
  const lines: string[] = [
    `Klasa: ${analytics.className}`,
    `Liczba uczniów: ${analytics.studentCount}`,
    `Liczba przedmiotów: ${analytics.subjectCount}`,
    `Średnia klasy: ${analytics.classAverage.toFixed(2)}`,
  ];

  if (analytics.minStudentAverage !== undefined && analytics.maxStudentAverage !== undefined) {
    lines.push(
      `Rozpiętość średnich uczniów: ${analytics.minStudentAverage.toFixed(2)} - ${analytics.maxStudentAverage.toFixed(2)}`,
    );
  }

  if (analytics.honorsCount !== undefined) {
    lines.push(`Uczniowie z wyróżnieniem (śr. 4,75+): ${analytics.honorsCount}`);
  }

  if (analytics.attendancePercentage !== undefined) {
    lines.push(`Frekwencja klasy: ${analytics.attendancePercentage.toFixed(1)}%`);
  }

  if (analytics.failureStatistics) {
    const fs = analytics.failureStatistics;
    lines.push(
      `Zagrożenia: bez ndst:${fs.noFailingGrades}, 1-2 ndst:${fs.oneToTwoFailingGrades}, 3+ ndst:${fs.threeOrMoreFailingGrades}, nkl:${fs.unclassified}`,
    );
  }

  if (analytics.gradeDistribution) {
    const gd = analytics.gradeDistribution;
    lines.push(
      `Rozkład ocen: 6:${gd.excellent}, 5:${gd.veryGood}, 4:${gd.good}, 3:${gd.satisfactory}, 2:${gd.acceptable}, 1:${gd.failing}`,
    );
  }

  if (analytics.behaviorDistribution) {
    const bd = analytics.behaviorDistribution;
    lines.push(
      `Zachowanie: wzorowe:${bd.exemplary}, b.dobre:${bd.veryGood}, dobre:${bd.good}, poprawne:${bd.acceptable}, nieodp:${bd.inappropriate}, naganne:${bd.reprehensible}`,
    );
  }

  return `Jesteś wychowawcą klasy przygotowującym podsumowanie semestru na zebranie z rodzicami.
Na podstawie danych statystycznych, przygotuj zwięzłe wnioski.

FORMAT (użyj punktorów •, MAKSYMALNIE 10-12 słów na punkt):

Mocne strony:
• [2-3 krótkie punkty]

Do poprawy:
• [1-2 krótkie punkty]

Zalecenia:
• [2 krótkie punkty]

STYL:
- Formalny, rzeczowy ton - bez emocji i superlatyw
- KRÓTKO: każdy punkt to JEDNO zwięzłe zdanie (max 10-12 słów)
- Średnia 4.5-5.0 to "dobry wynik", nie "wybitny" ani "znakomity"
- Średnia 4.0-4.5 to "zadowalający wynik"
- Unikaj słów: wspaniały, znakomity, imponujący, wybitny, doskonały
- Podawaj liczby bez komentarza wartościującego (np. "Średnia: 4.62" zamiast "Świetna średnia 4.62")
- Nie podawaj numerów uczniów ani imion

DANE:
${lines.join('\n')}`;
}

/**
 * Generates Polish AI-powered conclusions for the class presentation.
 *
 * Uses Google Gemini (free tier) for text generation.
 *
 * GDPR: Only receives aggregate data (AnalyticsResult), never individual student data.
 *
 * @param analytics - GDPR-safe aggregate class statistics
 * @param apiKey - Gemini API key (optional, uses GEMINI_API_KEY env var if not provided)
 * @returns Polish conclusions string, or null on any failure
 *
 * @example
 * const conclusions = await generateConclusions({
 *   className: "3A",
 *   studentCount: 25,
 *   subjectCount: 12,
 *   classAverage: 4.2,
 * });
 */
export async function generateConclusions(
  analytics: AnalyticsResult,
  apiKey?: string,
): Promise<string | null> {
  const key = apiKey ?? process.env.GEMINI_API_KEY;

  if (!key) {
    return null;
  }

  try {
    // Dynamic import to avoid bundling SDK when not used
    const { GoogleGenAI } = await import('@google/genai');

    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = buildPrompt(analytics);

    // Create timeout using Promise.race
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
    });

    const responsePromise = ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    if (!response) {
      return null;
    }

    const text = response.text;
    return text ? text.trim() : null;
  } catch (error) {
    // Log warning but don't throw - conclusions are optional
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`AI conclusions generation failed: ${message}`);
    return null;
  }
}

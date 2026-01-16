import type { ClassData } from '../types/index.js';
import { renderChartToDataUrl, PLACEHOLDER_IMAGE } from './render-charts.js';
import {
  generatePresentationCore,
  type GeneratePresentationCoreOptions,
} from './core.js';

export type GeneratePresentationOptions = GeneratePresentationCoreOptions;

/**
 * Generates a self-contained HTML presentation for a parent-teacher meeting.
 *
 * GDPR: Output uses student numbers only, never names.
 * All text is in Polish.
 *
 * @param data - Parsed class data from Vulcan XLSX export
 * @param options - Optional generation options
 * @returns Promise resolving to complete HTML string
 *
 * @example
 * const data = parseVulcanXlsx("grades.xlsx");
 * const html = await generatePresentation(data);
 * fs.writeFileSync("presentation.html", html);
 *
 * @example
 * // With custom meeting date
 * const html = await generatePresentation(data, { meetingDate: "15 stycznia 2026" });
 */
export async function generatePresentation(
  data: ClassData,
  options?: GeneratePresentationOptions,
): Promise<string> {
  return generatePresentationCore(
    data,
    { render: renderChartToDataUrl, placeholder: PLACEHOLDER_IMAGE },
    options,
  );
}

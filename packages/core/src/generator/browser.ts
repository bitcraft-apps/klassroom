import type { ClassData } from '../types/index.js';
import { renderChartToDataUrl, PLACEHOLDER_IMAGE } from './render-charts-browser.js';
import { generatePresentationCore, type GeneratePresentationCoreOptions } from './core.js';

export type BrowserGeneratePresentationOptions = GeneratePresentationCoreOptions;

/**
 * Generates a self-contained HTML presentation for a parent-teacher meeting.
 * Browser-compatible version - does not use Node.js APIs.
 *
 * GDPR: Output uses student numbers only, never names.
 * All text is in Polish.
 *
 * @param data - Parsed class data from Vulcan XLSX export
 * @param options - Optional generation options
 * @returns Promise resolving to complete HTML string
 * @throws Error if aiConclusions is enabled but geminiApiKey is not provided
 *
 * @example
 * const html = await generatePresentationBrowser(data);
 * document.body.innerHTML = html;
 *
 * @example
 * // With AI conclusions
 * const html = await generatePresentationBrowser(data, {
 *   aiConclusions: true,
 *   geminiApiKey: 'your-api-key'
 * });
 */
export async function generatePresentationBrowser(
  data: ClassData,
  options?: BrowserGeneratePresentationOptions,
): Promise<string> {
  // Validate API key requirement for browser (no process.env fallback)
  if (options?.aiConclusions && !options.geminiApiKey) {
    throw new Error('geminiApiKey is required when aiConclusions is enabled');
  }

  return generatePresentationCore(
    data,
    { render: renderChartToDataUrl, placeholder: PLACEHOLDER_IMAGE },
    options,
  );
}

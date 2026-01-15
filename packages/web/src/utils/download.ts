/**
 * Download utilities for browser-based file generation.
 * Creates blob, triggers download, revokes URL to prevent memory leaks.
 */

/**
 * Sanitizes a string for use as a filename.
 * Replaces unsafe characters with underscores.
 *
 * @param input - The string to sanitize
 * @returns Sanitized filename-safe string
 */
export function sanitizeFilename(input: string): string {
  return input.replace(/[<>:"/\\|?*\s]+/g, '_');
}

/**
 * Extracts period identifier from ClassPeriod string.
 * Converts "2024/2025 - Semestr 1" to "semestr1".
 *
 * @param period - Full period string from ClassMetadata
 * @returns Simplified period identifier
 */
export function extractPeriodId(period: string): string {
  // Match "Semestr X" pattern and convert to "semestrX"
  const match = period.match(/semestr\s*(\d+)/i);
  if (match) {
    return `semestr${match[1]}`;
  }
  // Fallback: sanitize entire period string
  return sanitizeFilename(period);
}

/**
 * Generates presentation filename from class data.
 * Format: {class}_{period}.html (e.g., "5b_semestr1.html")
 *
 * @param className - Class name (e.g., "5b", "3A")
 * @param period - Period string from ClassMetadata
 * @returns Generated filename
 */
export function generatePresentationFilename(
  className: string,
  period: string,
): string {
  const sanitizedClass = sanitizeFilename(className);
  const periodId = extractPeriodId(period);
  return `${sanitizedClass}_${periodId}.html`;
}

/**
 * Downloads content as a file.
 * Creates blob, triggers download via anchor click, revokes URL after delay.
 *
 * @param content - File content as string
 * @param filename - Download filename
 * @param mimeType - Content MIME type (defaults to text/html)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/html',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  // Revoke URL after delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

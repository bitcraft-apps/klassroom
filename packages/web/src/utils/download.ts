/**
 * Download utilities for browser-based file generation.
 * Creates blob, triggers download, revokes URL to prevent memory leaks.
 */

/** Delay before revoking object URL to ensure download starts */
const URL_REVOKE_DELAY_MS = 1000;

/**
 * Sanitizes a string for use as a filename.
 * Replaces unsafe characters with underscores, trims leading/trailing
 * underscores for cleaner output, and provides fallback for empty results.
 *
 * @param input - The string to sanitize
 * @returns Sanitized filename-safe string
 */
export function sanitizeFilename(input: string): string {
  const sanitized = input.replace(/[<>:"/\\|?*\s]+/g, '_');
  // Trim leading/trailing underscores for cleaner filenames
  const trimmed = sanitized.replace(/^_+|_+$/g, '');
  // Fallback if input was empty or all unsafe characters
  return trimmed || 'untitled';
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
 * Anchor is appended to DOM for Safari compatibility, then removed.
 *
 * @param content - File content as string
 * @param filename - Download filename
 * @param mimeType - Content MIME type (defaults to text/html with UTF-8 charset)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/html; charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke URL after delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), URL_REVOKE_DELAY_MS);
}

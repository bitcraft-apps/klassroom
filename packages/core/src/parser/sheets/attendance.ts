import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import type { AttendanceStats } from "../../types/index.js";

/**
 * Polish header names for attendance columns.
 * Used to detect column indices regardless of column order.
 * Note: Patterns are checked in order - more specific patterns first.
 */
const COLUMN_PATTERNS = {
  name: ["dane ucznia", "uczeń", "imię i nazwisko"],
  present: ["obecności", "obecne", "obecny"],
  // Unexcused absences - match "nieusprawiedliwione" first (more specific),
  // then "nieobecności" as fallback (generic absences assumed unexcused)
  absent: ["nieusprawiedliwione", "nieobecności"],
  // Excused absences - match "usprawiedliwione" after excluding unexcused columns
  // This will not match "nieusprawiedliwione" because that column is already excluded
  excused: ["usprawiedliwione"],
  late: ["spóźnienia", "spóźniony"],
} as const;

/**
 * Finds the column index for a given header pattern, excluding already-matched columns.
 * @param headers - Array of header strings (lowercased)
 * @param patterns - Array of possible header patterns to match
 * @param excludeIndices - Column indices to exclude from matching
 * @returns Column index or -1 if not found
 */
function findColumnIndex(
  headers: string[],
  patterns: readonly string[],
  excludeIndices: Set<number> = new Set()
): number {
  for (let i = 0; i < headers.length; i++) {
    if (excludeIndices.has(i)) continue;
    const header = headers[i];
    if (patterns.some((p) => header?.includes(p))) {
      return i;
    }
  }
  return -1;
}

/**
 * Parses the "Dodatkowe informacje 2" (attendance stats) sheet.
 *
 * Vulcan format (column order may vary, matched by Polish header names):
 * - Row 0: Headers containing student name and attendance columns
 * - Row 1+: Student data with attendance counts
 *
 * @param sheet - The worksheet to parse
 * @returns Map of student name to their attendance statistics
 * @throws Error if sheet structure is invalid (missing required columns)
 * @internal
 */
export function parseAttendanceSheet(sheet: WorkSheet): Map<string, AttendanceStats> {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 2");
  }

  // Parse headers (row 0) to find column indices
  const headerRow = data[0];
  if (!headerRow || !Array.isArray(headerRow)) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 2");
  }

  const headers = headerRow.map((h) => String(h ?? "").toLowerCase().trim());

  // Find columns, tracking matched indices to avoid double-matching.
  // Order matters: match more specific patterns first ("nieusprawiedliwione"
  // before "usprawiedliwione" to avoid false matches).
  const matched = new Set<number>();

  const nameCol = findColumnIndex(headers, COLUMN_PATTERNS.name, matched);
  if (nameCol >= 0) matched.add(nameCol);

  const presentCol = findColumnIndex(headers, COLUMN_PATTERNS.present, matched);
  if (presentCol >= 0) matched.add(presentCol);

  // Find absent (nieusprawiedliwione) BEFORE excused (usprawiedliwione) because
  // "nieobecności nieusprawiedliwione" contains "usprawiedliwione" as substring
  const absentCol = findColumnIndex(headers, COLUMN_PATTERNS.absent, matched);
  if (absentCol >= 0) matched.add(absentCol);

  const excusedCol = findColumnIndex(headers, COLUMN_PATTERNS.excused, matched);
  if (excusedCol >= 0) matched.add(excusedCol);

  const lateCol = findColumnIndex(headers, COLUMN_PATTERNS.late, matched);
  if (lateCol >= 0) matched.add(lateCol);

  // Name column is required; attendance columns are optional (default to 0)
  if (nameCol === -1) {
    throw new Error(
      "Invalid data structure in sheet: Dodatkowe informacje 2 - missing student name column"
    );
  }

  const results = new Map<string, AttendanceStats>();

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;

    // Extract student name
    const nameValue = row[nameCol];
    if (nameValue == null) continue;
    const name = String(nameValue).trim();
    if (!name) continue;

    // Parse attendance values (treat missing/invalid as 0)
    const present = presentCol >= 0 ? Number(row[presentCol]) || 0 : 0;
    const absent = absentCol >= 0 ? Number(row[absentCol]) || 0 : 0;
    const excused = excusedCol >= 0 ? Number(row[excusedCol]) || 0 : 0;
    const late = lateCol >= 0 ? Number(row[lateCol]) || 0 : 0;

    results.set(name, { present, absent, excused, late });
  }

  return results;
}

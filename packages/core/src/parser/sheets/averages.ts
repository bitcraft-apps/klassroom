import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parses the "Średnia uczniów" (student averages) sheet.
 *
 * Vulcan format:
 * - Row 0: Headers ["Numer w dzienniku", "Dane ucznia", "Średnia"]
 * - Row 1+: Student data [number, name, average]
 *
 * @param sheet - The worksheet to parse
 * @returns Map of student name to their average
 * @throws Error if sheet structure is invalid
 * @internal
 */
export function parseAveragesSheet(sheet: WorkSheet): Map<string, number> {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Średnia uczniów");
  }

  const results = new Map<string, number>();

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.length < 3) continue;

    // Column 1 is "Dane ucznia" (student name), Column 2 is "Średnia" (average)
    const nameValue = row[1];
    const avgValue = row[2];

    // Skip rows with missing name
    if (nameValue == null) continue;
    const name = String(nameValue).trim();
    if (!name) continue;

    // Parse average - might be string or number
    const avg = Number(avgValue);
    if (!isNaN(avg)) {
      results.set(name, avg);
    }
  }

  return results;
}

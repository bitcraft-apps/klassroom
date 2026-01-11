import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/**
 * Parsed row from averages sheet.
 * @internal
 */
export interface AveragesRow {
  name: string;
  average: number;
}

/**
 * Parses the "Średnia uczniów" (student averages) sheet.
 * Expected columns: Uczeń (student name), Średnia (average)
 *
 * @param sheet - The worksheet to parse
 * @returns Map of student name to their average
 * @throws Error if sheet structure is invalid
 * @internal
 */
export function parseAveragesSheet(sheet: WorkSheet): Map<string, number> {
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Średnia uczniów");
  }

  const results = new Map<string, number>();

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const nameValue = row[0];
    const avgValue = row[1];

    // Skip empty rows
    if (nameValue === undefined || nameValue === null || nameValue === "") continue;

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

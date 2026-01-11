import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import { studentNumber, type Grade, type StudentNumber } from "../../types/index.js";

/**
 * Parsed row from grades sheet containing student info and their grades.
 * @internal
 */
export interface GradesRow {
  number: StudentNumber;
  name: string;
  grades: Grade[];
}

/**
 * Parses the "Okres klasyfikacyjny" (grades matrix) sheet.
 * First row contains headers: Numer, Uczeń, Subject1, Subject2, ...
 * Subsequent rows contain: studentNumber, studentName, grade1, grade2, ...
 *
 * @param sheet - The worksheet to parse
 * @returns Array of parsed grade rows with student number, name, and grades
 * @throws Error if sheet structure is invalid
 * @internal
 */
export function parseGradesSheet(sheet: WorkSheet): GradesRow[] {
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Okres klasyfikacyjny");
  }

  const headerRow = data[0];
  if (!headerRow || headerRow.length < 3) {
    throw new Error("Invalid data structure in sheet: Okres klasyfikacyjny");
  }

  // Extract subject names from header (columns after Numer and Uczeń)
  const subjects = headerRow.slice(2).map((s) => String(s ?? "").trim());

  const results: GradesRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const numValue = row[0];
    const nameValue = row[1];

    // Skip rows with missing student number
    if (numValue == null) continue;
    const num = Number(numValue);
    if (!Number.isInteger(num) || num < 1) continue;

    // Skip rows with missing name
    if (nameValue == null) continue;
    const name = String(nameValue).trim();
    if (!name) continue;

    const grades: Grade[] = subjects.map((subject, idx) => {
      const cellValue = row[idx + 2];
      // Treat null/undefined/empty string as no grade
      const value = cellValue == null || cellValue === "" ? null : String(cellValue).trim();
      return { subject, value };
    });

    results.push({
      number: studentNumber(num),
      name,
      grades,
    });
  }

  return results;
}

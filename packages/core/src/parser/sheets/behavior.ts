import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import { parseBehaviorGrade, type BehaviorGrade } from "../../types/index.js";

/**
 * Parses the "Zachowanie" (behavior) sheet.
 * Expected columns: Uczeń (student name), Ocena (behavior grade)
 *
 * @param sheet - The worksheet to parse
 * @returns Map of student name to their behavior grade
 * @throws Error if sheet structure is invalid
 * @internal
 */
export function parseBehaviorSheet(sheet: WorkSheet): Map<string, BehaviorGrade> {
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Zachowanie");
  }

  const results = new Map<string, BehaviorGrade>();

  // Skip header row, process data rows
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const nameValue = row[0];
    const behaviorValue = row[1];

    // Skip empty rows
    if (nameValue === undefined || nameValue === null || nameValue === "") continue;

    const name = String(nameValue).trim();
    if (!name) continue;

    if (behaviorValue === undefined || behaviorValue === null || behaviorValue === "")
      continue;

    const polishGrade = String(behaviorValue).trim();
    const behavior = parseBehaviorGrade(polishGrade);

    if (behavior) {
      results.set(name, behavior);
    }
  }

  return results;
}

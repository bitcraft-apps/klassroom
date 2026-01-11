import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import { classPeriod, type ClassMetadata } from "../../types/index.js";

/**
 * Parses the "Dodatkowe informacje 1" (class metadata) sheet.
 * Expected key-value structure with rows like:
 * - "Klasa", "3A"
 * - "Okres klasyfikacyjny", "2024/2025 - Semestr 1"
 * - "Wychowawca", "Jan Kowalski" (optional)
 *
 * @param sheet - The worksheet to parse
 * @returns Parsed class metadata
 * @throws Error if required fields (className, period) are missing
 * @internal
 */
export function parseMetadataSheet(sheet: WorkSheet): ClassMetadata {
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  const fields = new Map<string, string>();

  for (const row of data) {
    if (!row || row.length < 2) continue;

    const key = String(row[0] ?? "").trim().toLowerCase();
    const value = String(row[1] ?? "").trim();

    if (key && value) {
      fields.set(key, value);
    }
  }

  const className = fields.get("klasa");
  if (!className) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 1");
  }

  const periodValue = fields.get("okres klasyfikacyjny");
  if (!periodValue) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 1");
  }

  const teacher = fields.get("wychowawca");

  return {
    className,
    period: classPeriod(periodValue),
    teacher: teacher || undefined,
  };
}

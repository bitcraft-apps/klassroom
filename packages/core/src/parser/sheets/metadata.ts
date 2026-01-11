import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import { classPeriod, type ClassMetadata } from "../../types/index.js";

/**
 * Parses the "Dodatkowe informacje 1" (class metadata) sheet.
 *
 * Handles Librus export format:
 * - Row 0: Title with period info (e.g., "Dodatkowe informacje dla 1 semestru w roku szkolnym 2025/2026")
 * - Row 1: Contains "Oddział" (class) and "Wychowawca" (teacher) in horizontal form layout
 *
 * @param sheet - The worksheet to parse
 * @returns Parsed class metadata
 * @throws Error if required fields (className, period) are missing
 * @internal
 */
export function parseMetadataSheet(sheet: WorkSheet): ClassMetadata {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 1");
  }

  // Row 0: Title contains period info
  // Format: "Dodatkowe informacje dla 1 semestru w roku szkolnym 2025/2026"
  const titleRow = data[0];
  const titleText = titleRow && titleRow[0] ? String(titleRow[0]) : "";

  // Extract period from title (e.g., "1 semestru w roku szkolnym 2025/2026")
  const periodMatch = titleText.match(/(\d)\s*semestru?\s+w\s+roku\s+szkolnym\s+(\d{4}\/\d{4})/i);
  let periodValue: string | undefined;
  if (periodMatch) {
    const semester = periodMatch[1];
    const schoolYear = periodMatch[2];
    periodValue = `${schoolYear} - Semestr ${semester}`;
  }

  // Row 1: Contains class and teacher info in horizontal layout
  // Format: ["Oddział", "5b", "Wychowawca", null, null, "Teacher Name", ...]
  const infoRow = data[1] as unknown[];
  let className: string | undefined;
  let teacher: string | undefined;

  if (infoRow && Array.isArray(infoRow)) {
    for (let i = 0; i < infoRow.length; i++) {
      const cell = infoRow[i];
      if (cell == null) continue;

      const cellStr = String(cell).trim().toLowerCase();

      // Look for "Oddział" (class) - value is in the next cell
      if (cellStr === "oddział" && i + 1 < infoRow.length) {
        const value = infoRow[i + 1];
        if (value != null) {
          className = String(value).trim();
        }
      }

      // Look for "Wychowawca" (teacher) - value may be a few cells later (after nulls)
      if (cellStr === "wychowawca") {
        // Search following cells for the teacher name
        for (let j = i + 1; j < infoRow.length && j <= i + 5; j++) {
          const value = infoRow[j];
          if (value != null && String(value).trim()) {
            teacher = String(value).trim();
            break;
          }
        }
      }
    }
  }

  if (!className) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 1");
  }

  if (!periodValue) {
    throw new Error("Invalid data structure in sheet: Dodatkowe informacje 1");
  }

  return {
    className,
    period: classPeriod(periodValue),
    teacher: teacher || undefined,
  };
}

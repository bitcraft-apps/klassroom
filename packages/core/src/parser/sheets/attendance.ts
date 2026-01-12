import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import type { ClassAttendance } from "../../types/index.js";

/**
 * Parses the "Dodatkowe informacje 2" sheet to extract class-level attendance.
 *
 * The Vulcan export contains class aggregate attendance (not per-student) in this format:
 * - Row with ["Frekwencja", "Stan %"] is the header
 * - Next row contains [date, percentage] e.g., ["10.01.2026", 88.93]
 *
 * @param sheet - The worksheet to parse
 * @returns ClassAttendance with percentage and date, or null if not found
 * @internal
 */
export function parseClassAttendance(sheet: WorkSheet): ClassAttendance | null {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // Find the header row with "Frekwencja" and "Stan %"
  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;

    const rowStr = row.map((cell) => String(cell ?? "").toLowerCase()).join(" ");
    if (rowStr.includes("frekwencja") && rowStr.includes("stan %")) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    return null; // Attendance section not found
  }

  // Look for data row after header (skip empty rows)
  // Limit search to 4 rows after header - data should be immediately after header in Vulcan format
  for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 5, data.length); i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.length < 2) continue;

    // First cell should be date, second should be percentage
    const dateValue = row[0];
    const percentValue = row[1];

    // Skip if percentage is not a number
    const percentage = Number(percentValue);
    if (isNaN(percentage)) continue;

    // Extract date if it matches Polish date format (DD.MM.YYYY or DD.MM)
    // Requires 2-digit day and month to avoid matching decimals like "1.5"
    let date: string | undefined;
    if (dateValue != null) {
      const dateStr = String(dateValue).trim();
      if (dateStr.match(/^\d{2}[./]\d{2}([./]\d{2,4})?$/)) {
        date = dateStr;
      }
    }

    return {
      percentage,
      date,
    };
  }

  return null; // No valid data found
}

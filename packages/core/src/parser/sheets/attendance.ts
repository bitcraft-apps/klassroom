import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";
import type {
  ClassAttendance,
  FailureStatistics,
  AggregateGradeDistribution,
} from "../../types/index.js";

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

/**
 * Polish labels for failure statistics in "Dodatkowe informacje 2" sheet.
 * Used for label-based row detection (handles row position variations).
 */
const FAILURE_LABELS = {
  NO_FAILING: "uczniów bez ocen niedostatecznych",
  ONE_TWO_FAILING: "uczniów z 1 lub 2 ocenami niedostatecznymi",
  THREE_PLUS_FAILING: "uczniów z 3 i więcej ocenami niedostatecznymi",
  UNCLASSIFIED: "uczniów nieklasyfikowanych",
} as const;

/**
 * Polish labels for grade distribution in "Dodatkowe informacje 2" sheet.
 */
const GRADE_LABELS = {
  EXCELLENT: "celujących",
  VERY_GOOD: "bardzo dobrych",
  GOOD: "dobrych",
  SATISFACTORY: "dostatecznych",
  ACCEPTABLE: "dopuszczających",
  FAILING: "niedostatecznych",
  UNCLASSIFIED: "nieklasyfikowany",
} as const;

/**
 * Parses the "Dodatkowe informacje 2" sheet to extract failure statistics.
 *
 * The Vulcan export contains failure stats in format:
 * - First column: count (number)
 * - Second column: Polish label (e.g., "uczniów bez ocen niedostatecznych")
 *
 * @param sheet - The worksheet to parse
 * @returns FailureStatistics or null if not found
 * @internal
 */
export function parseFailureStatistics(sheet: WorkSheet): FailureStatistics | null {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (!data || !Array.isArray(data)) {
    return null;
  }

  const result: FailureStatistics = {
    noFailingGrades: 0,
    oneToTwoFailingGrades: 0,
    threeOrMoreFailingGrades: 0,
    unclassified: 0,
  };

  let foundAny = false;

  for (const row of data) {
    if (!row || !Array.isArray(row) || row.length < 2) continue;

    const value = Number(row[0]);
    if (isNaN(value)) continue;

    const label = String(row[1] ?? "").toLowerCase();

    if (label.includes(FAILURE_LABELS.NO_FAILING)) {
      result.noFailingGrades = value;
      foundAny = true;
    } else if (label.includes(FAILURE_LABELS.ONE_TWO_FAILING)) {
      result.oneToTwoFailingGrades = value;
      foundAny = true;
    } else if (label.includes(FAILURE_LABELS.THREE_PLUS_FAILING)) {
      result.threeOrMoreFailingGrades = value;
      foundAny = true;
    } else if (label.includes(FAILURE_LABELS.UNCLASSIFIED)) {
      result.unclassified = value;
      foundAny = true;
    }
  }

  return foundAny ? result : null;
}

/**
 * Parses the "Dodatkowe informacje 2" sheet to extract aggregate grade distribution.
 *
 * The Vulcan export contains grade counts in format:
 * - First column: count (number)
 * - Second column: Polish label (e.g., "celujących", "bardzo dobrych")
 *
 * @param sheet - The worksheet to parse
 * @returns AggregateGradeDistribution or null if not found
 * @internal
 */
export function parseAggregateGradeDistribution(
  sheet: WorkSheet
): AggregateGradeDistribution | null {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (!data || !Array.isArray(data)) {
    return null;
  }

  const result: AggregateGradeDistribution = {
    excellent: 0,
    veryGood: 0,
    good: 0,
    satisfactory: 0,
    acceptable: 0,
    failing: 0,
    unclassified: 0,
  };

  let foundAny = false;

  for (const row of data) {
    if (!row || !Array.isArray(row) || row.length < 2) continue;

    const value = Number(row[0]);
    if (isNaN(value)) continue;

    const label = String(row[1] ?? "").toLowerCase();

    // Order matters: check more specific labels first
    // "nieklasyfikowany" should match unclassified grades, not the failure stat
    if (label.includes(GRADE_LABELS.EXCELLENT)) {
      result.excellent = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.VERY_GOOD)) {
      result.veryGood = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.GOOD) && !label.includes("bardzo")) {
      result.good = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.SATISFACTORY)) {
      result.satisfactory = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.ACCEPTABLE)) {
      result.acceptable = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.FAILING) && !label.includes("uczniów")) {
      // Exclude failure stats which also contain "niedostatecznych"
      result.failing = value;
      foundAny = true;
    } else if (
      label.includes(GRADE_LABELS.UNCLASSIFIED) &&
      !label.includes("uczniów")
    ) {
      // Exclude unclassified students stat
      result.unclassified = value;
      foundAny = true;
    }
  }

  return foundAny ? result : null;
}

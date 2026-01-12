import type { WorkSheet } from 'xlsx';
import * as XLSX from 'xlsx';
import type {
  ClassAttendance,
  FailureStatistics,
  AggregateGradeDistribution,
} from '../../types/index.js';

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

    const rowStr = row.map((cell) => String(cell ?? '').toLowerCase()).join(' ');
    if (rowStr.includes('frekwencja') && rowStr.includes('stan %')) {
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
 * The actual Vulcan export uses abbreviated forms like "ndst." for "niedostatecznych".
 * Labels appear in column 2 (index 2) of the multi-column table.
 */
const FAILURE_LABELS = {
  NO_FAILING: 'bez ocen niedostatecznych',
  ONE_TWO_FAILING: '1-2', // matches "z 1-2 ocenami ndst."
  THREE_PLUS_FAILING: '3 i więcej', // matches "z 3 i więcej ocenami ndst."
  UNCLASSIFIED: 'nieklasyfikowani',
} as const;

/**
 * Polish labels for grade distribution in "Dodatkowe informacje 2" sheet.
 * Labels appear in column 4 (index 4) of the multi-column table.
 * Uses nominative case (e.g., "Celujący") not genitive (e.g., "celujących").
 */
const GRADE_LABELS = {
  EXCELLENT: 'celujący',
  VERY_GOOD: 'bardzo dobry',
  GOOD: 'dobry',
  SATISFACTORY: 'dostateczny',
  ACCEPTABLE: 'dopuszczający',
  FAILING: 'niedostateczny',
  UNCLASSIFIED: 'nieklasyfikowany',
} as const;

/**
 * Parses the "Dodatkowe informacje 2" sheet to extract failure statistics.
 *
 * The Vulcan export contains failure stats in a multi-column table:
 * - Column 2 (index 2): Polish label (e.g., "bez ocen niedostatecznych")
 * - Column 3 (index 3): Count (number)
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
    if (!row || !Array.isArray(row) || row.length < 4) continue;

    // Failure stats are in columns 2 (label) and 3 (count)
    const label = String(row[2] ?? '').toLowerCase();
    const value = Number(row[3]);

    if (isNaN(value) || !label) continue;

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
 * The Vulcan export contains grade counts in a multi-column table:
 * - Column 4 (index 4): Polish label (e.g., "Celujący", "Bardzo dobry")
 * - Column 5 (index 5): Count (number)
 *
 * @param sheet - The worksheet to parse
 * @returns AggregateGradeDistribution or null if not found
 * @internal
 */
export function parseAggregateGradeDistribution(
  sheet: WorkSheet,
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
    if (!row || !Array.isArray(row) || row.length < 6) continue;

    // Grade distribution is in columns 4 (label) and 5 (count)
    const label = String(row[4] ?? '').toLowerCase();
    const value = Number(row[5]);

    if (isNaN(value) || !label) continue;

    // Order matters: check more specific labels first
    if (label.includes(GRADE_LABELS.EXCELLENT)) {
      result.excellent = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.VERY_GOOD)) {
      result.veryGood = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.GOOD) && !label.includes(GRADE_LABELS.VERY_GOOD)) {
      result.good = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.SATISFACTORY) && !label.includes(GRADE_LABELS.FAILING)) {
      // "niedostateczny" contains "dostateczny" as substring, so exclude it
      result.satisfactory = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.ACCEPTABLE)) {
      result.acceptable = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.FAILING)) {
      result.failing = value;
      foundAny = true;
    } else if (label.includes(GRADE_LABELS.UNCLASSIFIED)) {
      result.unclassified = value;
      foundAny = true;
    }
  }

  return foundAny ? result : null;
}

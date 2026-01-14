import * as fs from 'node:fs';
import * as XLSX from 'xlsx';
import type { ClassData, RawStudent, Student } from '../types/index.js';
import { stripStudentPII } from '../types/index.js';
import { parseGradesSheet } from './sheets/grades.js';
import { parseAveragesSheet } from './sheets/averages.js';
import { parseMetadataSheet } from './sheets/metadata.js';
import {
  parseClassAttendance,
  parseFailureStatistics,
  parseAggregateGradeDistribution,
} from './sheets/attendance.js';

/**
 * All 6 sheet names that appear in Vulcan UONET+ XLSX exports.
 * Used for format detection/validation.
 */
const VULCAN_SHEET_NAMES = [
  'Okres klasyfikacyjny',
  'Dodatkowe informacje 1',
  'Średnia uczniów',
  'Dodatkowe informacje 2',
  'Zachowanie',
  'Informacje o uczniach',
] as const;

/**
 * Sheets required for parsing (subset of VULCAN_SHEET_NAMES).
 * Note: Behavior is embedded in the grades sheet column, not parsed from "Zachowanie" sheet.
 */
const REQUIRED_SHEETS = {
  GRADES: 'Okres klasyfikacyjny',
  AVERAGES: 'Średnia uczniów',
  METADATA: 'Dodatkowe informacje 1',
} as const;

/**
 * Optional sheets that will be parsed if present.
 */
const OPTIONAL_SHEETS = {
  ATTENDANCE: 'Dodatkowe informacje 2',
} as const;

/**
 * Detected file format from sheet name analysis.
 */
export type DetectedFormat = 'vulcan' | 'unknown';

/**
 * Detects the format of an XLSX file based on sheet names.
 *
 * @param sheetNames - Array of sheet names from the workbook
 * @returns Detected format and confidence details
 */
export function detectFormat(sheetNames: string[]): {
  format: DetectedFormat;
  matchedSheets: string[];
  missingSheets: string[];
} {
  const sheetSet = new Set(sheetNames);
  const matchedSheets = VULCAN_SHEET_NAMES.filter((name) => sheetSet.has(name));
  const missingSheets = VULCAN_SHEET_NAMES.filter((name) => !sheetSet.has(name));

  // Consider it Vulcan format if at least 4 of 6 expected sheets are present
  const format: DetectedFormat = matchedSheets.length >= 4 ? 'vulcan' : 'unknown';

  return { format, matchedSheets, missingSheets };
}

/**
 * Parses a Vulcan UONET+ XLSX grade export from an ArrayBuffer into ClassData.
 *
 * Browser-compatible function that accepts raw XLSX data as an ArrayBuffer.
 * Suitable for browser FileReader, fetch responses, or any context where
 * file system access is unavailable.
 *
 * @param buffer - ArrayBuffer containing XLSX file data
 * @returns Parsed class data with GDPR-safe student records
 * @throws Error if buffer is empty, unrecognized format, missing required sheets, or invalid structure
 *
 * @example
 * // Browser usage with FileReader
 * const file = input.files[0];
 * const buffer = await file.arrayBuffer();
 * const data = parseVulcanXlsxFromBuffer(buffer);
 *
 * @example
 * // Node.js usage
 * const nodeBuffer = fs.readFileSync("./grades.xlsx");
 * const arrayBuffer = nodeBuffer.buffer.slice(
 *   nodeBuffer.byteOffset,
 *   nodeBuffer.byteOffset + nodeBuffer.byteLength
 * );
 * const data = parseVulcanXlsxFromBuffer(arrayBuffer);
 */
export function parseVulcanXlsxFromBuffer(buffer: ArrayBuffer): ClassData {
  // Validate buffer is not empty
  if (buffer.byteLength === 0) {
    throw new Error('Empty buffer: cannot parse empty XLSX data');
  }

  // Parse workbook using 'array' type for browser compatibility
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Detect and validate format
  const { format, matchedSheets, missingSheets } = detectFormat(workbook.SheetNames);

  if (format === 'unknown') {
    const foundSheets = workbook.SheetNames.join(', ');
    throw new Error(
      `Unrecognized XLSX format. Expected Vulcan UONET+ export with sheets: ${VULCAN_SHEET_NAMES.join(', ')}. ` +
        `Found sheets: ${foundSheets}. ` +
        `This parser only supports Vulcan UONET+ exports. Other formats not yet supported - please file an issue.`,
    );
  }

  // Verify required sheets exist (subset needed for parsing)
  for (const sheetName of Object.values(REQUIRED_SHEETS)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Missing required sheet: ${sheetName}. ` +
          `Matched ${matchedSheets.length}/6 Vulcan sheets. Missing: ${missingSheets.join(', ')}`,
      );
    }
  }

  // Parse each sheet. Non-null assertions are safe here because we validated
  // all required sheets exist in the loop above.
  const metadataSheet = workbook.Sheets[REQUIRED_SHEETS.METADATA]!;
  const metadata = parseMetadataSheet(metadataSheet);

  const gradesSheet = workbook.Sheets[REQUIRED_SHEETS.GRADES]!;
  const gradesData = parseGradesSheet(gradesSheet);

  const averagesSheet = workbook.Sheets[REQUIRED_SHEETS.AVERAGES]!;
  const averagesMap = parseAveragesSheet(averagesSheet);

  // Parse optional class-level data from "Dodatkowe informacje 2"
  // Returns null if sheet missing or format not recognized
  const attendanceSheet = workbook.Sheets[OPTIONAL_SHEETS.ATTENDANCE];
  const classAttendance = attendanceSheet ? parseClassAttendance(attendanceSheet) : null;
  const failureStatistics = attendanceSheet ? parseFailureStatistics(attendanceSheet) : null;
  const aggregateGradeDistribution = attendanceSheet
    ? parseAggregateGradeDistribution(attendanceSheet)
    : null;

  // Build RawStudent records by correlating data across sheets
  // Note: Behavior comes from the grades sheet (embedded in column 2)
  const rawStudents: RawStudent[] = gradesData.map((row) => {
    const rawStudent: RawStudent = {
      number: row.number,
      name: row.name,
      grades: row.grades,
      average: averagesMap.get(row.name),
      behavior: row.behavior,
    };
    return rawStudent;
  });

  // Strip PII to produce GDPR-safe Student records
  const students: Student[] = rawStudents.map(stripStudentPII);

  return {
    metadata,
    students,
    classAttendance: classAttendance ?? undefined,
    failureStatistics: failureStatistics ?? undefined,
    aggregateGradeDistribution: aggregateGradeDistribution ?? undefined,
  };
}

/**
 * Parses a Vulcan UONET+ XLSX grade export into ClassData.
 *
 * Supports XLSX files exported from Vulcan UONET+ "additional internal documentation"
 * export option. The format is identified by 6 characteristic Polish sheet names.
 *
 * Note: This function uses synchronous file I/O (fs.readFileSync).
 * Suitable for CLI usage. For browser contexts, use parseVulcanXlsxFromBuffer instead.
 *
 * @param filePath - Path to the XLSX file
 * @returns Parsed class data with GDPR-safe student records
 * @throws Error if file not found, unrecognized format, missing required sheets, or invalid structure
 *
 * @example
 * const data = parseVulcanXlsx("./grades.xlsx");
 * console.log(data.metadata.className); // "3A"
 * console.log(data.students[0].number); // 1
 */
export function parseVulcanXlsx(filePath: string): ClassData {
  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file and convert Node.js Buffer to ArrayBuffer
  const nodeBuffer = fs.readFileSync(filePath);
  const arrayBuffer = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  );

  return parseVulcanXlsxFromBuffer(arrayBuffer);
}

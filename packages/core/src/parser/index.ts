import * as fs from "node:fs";
import * as XLSX from "xlsx";
import type { ClassData, RawStudent, Student } from "../types/index.js";
import { stripStudentPII } from "../types/index.js";
import { parseGradesSheet } from "./sheets/grades.js";
import { parseAveragesSheet } from "./sheets/averages.js";
import { parseMetadataSheet } from "./sheets/metadata.js";

/**
 * All 6 sheet names that appear in Librus Synergia XLSX exports.
 * Used for format detection/validation.
 */
const LIBRUS_SHEET_NAMES = [
  "Okres klasyfikacyjny",
  "Dodatkowe informacje 1",
  "Średnia uczniów",
  "Dodatkowe informacje 2",
  "Zachowanie",
  "Informacje o uczniach",
] as const;

/**
 * Sheets required for parsing (subset of LIBRUS_SHEET_NAMES).
 * Note: Behavior is embedded in the grades sheet column, not parsed from "Zachowanie" sheet.
 */
const REQUIRED_SHEETS = {
  GRADES: "Okres klasyfikacyjny",
  AVERAGES: "Średnia uczniów",
  METADATA: "Dodatkowe informacje 1",
} as const;

/**
 * Detected file format from sheet name analysis.
 */
export type DetectedFormat = "librus" | "unknown";

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
  const matchedSheets = LIBRUS_SHEET_NAMES.filter((name) => sheetSet.has(name));
  const missingSheets = LIBRUS_SHEET_NAMES.filter((name) => !sheetSet.has(name));

  // Consider it Librus format if at least 4 of 6 expected sheets are present
  const format: DetectedFormat = matchedSheets.length >= 4 ? "librus" : "unknown";

  return { format, matchedSheets, missingSheets };
}

/**
 * Parses a Librus Synergia XLSX grade export into ClassData.
 *
 * Supports XLSX files exported from Librus Synergia's "additional internal documentation"
 * export option. The format is identified by 6 characteristic Polish sheet names.
 *
 * Note: This function uses synchronous file I/O (fs.readFileSync).
 * Suitable for CLI usage; an async variant may be needed for web/server contexts.
 *
 * @param filePath - Path to the XLSX file
 * @returns Parsed class data with GDPR-safe student records
 * @throws Error if file not found, unrecognized format, missing required sheets, or invalid structure
 *
 * @example
 * const data = parseLibrusXlsx("./grades.xlsx");
 * console.log(data.metadata.className); // "3A"
 * console.log(data.students[0].number); // 1
 */
export function parseLibrusXlsx(filePath: string): ClassData {
  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read workbook using fs.readFileSync + XLSX.read (XLSX.readFile has issues in ESM)
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  // Detect and validate format
  const { format, matchedSheets, missingSheets } = detectFormat(workbook.SheetNames);

  if (format === "unknown") {
    const foundSheets = workbook.SheetNames.join(", ");
    throw new Error(
      `Unrecognized XLSX format. Expected Librus Synergia export with sheets: ${LIBRUS_SHEET_NAMES.join(", ")}. ` +
        `Found sheets: ${foundSheets}. ` +
        `This parser only supports Librus Synergia exports. Vulcan UONET+ and other formats are not yet supported.`
    );
  }

  // Verify required sheets exist (subset needed for parsing)
  for (const sheetName of Object.values(REQUIRED_SHEETS)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(
        `Missing required sheet: ${sheetName}. ` +
          `Matched ${matchedSheets.length}/6 Librus sheets. Missing: ${missingSheets.join(", ")}`
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
  };
}

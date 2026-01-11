import * as fs from "node:fs";
import * as XLSX from "xlsx";
import type { ClassData, RawStudent, Student } from "../types/index.js";
import { stripStudentPII } from "../types/index.js";
import { parseGradesSheet } from "./sheets/grades.js";
import { parseAveragesSheet } from "./sheets/averages.js";
import { parseBehaviorSheet } from "./sheets/behavior.js";
import { parseMetadataSheet } from "./sheets/metadata.js";

/**
 * Polish sheet names as they appear in Librus XLSX exports.
 */
const SHEET_NAMES = {
  GRADES: "Okres klasyfikacyjny",
  AVERAGES: "Średnia uczniów",
  BEHAVIOR: "Zachowanie",
  METADATA: "Dodatkowe informacje 1",
} as const;

/**
 * Parses a Librus Synergia XLSX grade export into ClassData.
 *
 * @param filePath - Path to the XLSX file
 * @returns Parsed class data with GDPR-safe student records
 * @throws Error if file not found, missing required sheets, or invalid structure
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

  // Read workbook
  const workbook = XLSX.readFile(filePath);

  // Verify required sheets exist
  for (const sheetName of Object.values(SHEET_NAMES)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      throw new Error(`Missing required sheet: ${sheetName}`);
    }
  }

  // Parse metadata
  const metadataSheet = workbook.Sheets[SHEET_NAMES.METADATA];
  const metadata = parseMetadataSheet(metadataSheet!);

  // Parse grades (primary data source for student list)
  const gradesSheet = workbook.Sheets[SHEET_NAMES.GRADES];
  const gradesData = parseGradesSheet(gradesSheet!);

  // Parse supplementary data
  const averagesSheet = workbook.Sheets[SHEET_NAMES.AVERAGES];
  const averagesMap = parseAveragesSheet(averagesSheet!);

  const behaviorSheet = workbook.Sheets[SHEET_NAMES.BEHAVIOR];
  const behaviorMap = parseBehaviorSheet(behaviorSheet!);

  // Build RawStudent records by correlating data across sheets
  const rawStudents: RawStudent[] = gradesData.map((row) => {
    const rawStudent: RawStudent = {
      number: row.number,
      name: row.name,
      grades: row.grades,
      average: averagesMap.get(row.name),
      behavior: behaviorMap.get(row.name),
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

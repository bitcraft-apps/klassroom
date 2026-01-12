import type { WorkSheet } from 'xlsx';
import * as XLSX from 'xlsx';
import {
  studentNumber,
  parseBehaviorGrade,
  type Grade,
  type StudentNumber,
  type BehaviorGrade,
} from '../../types/index.js';

/**
 * Parsed row from grades sheet containing student info and their grades.
 * @internal
 */
export interface GradesRow {
  number: StudentNumber;
  name: string;
  grades: Grade[];
  behavior?: BehaviorGrade;
}

/**
 * Parses the "Okres klasyfikacyjny" (grades matrix) sheet.
 *
 * Vulcan format:
 * - Row 0: Headers ["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu", ...]
 * - Row 1: Subject names [null, null, null, "Religia", "Język polski", ...]
 * - Row 2: Empty separator row
 * - Row 3+: Student data [number, name, behavior, grade1, grade2, ...]
 *
 * @param sheet - The worksheet to parse
 * @returns Array of parsed grade rows with student number, name, behavior, and grades
 * @throws Error if sheet structure is invalid
 * @internal
 */
export function parseGradesSheet(sheet: WorkSheet): GradesRow[] {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  if (data.length < 4) {
    throw new Error('Invalid data structure in sheet: Okres klasyfikacyjny');
  }

  // Row 1 contains subject names starting from column 3
  const subjectRow = data[1];
  if (!subjectRow || !Array.isArray(subjectRow)) {
    throw new Error('Invalid data structure in sheet: Okres klasyfikacyjny');
  }

  // Extract subject names from row 1, starting at column 3
  // Filter out empty subjects and special summary columns at the end
  const SUMMARY_COLUMNS = new Set([
    // Grade count columns (lowercase in Polish)
    'celujących',
    'bardzo dobrych',
    'dobrych',
    'dostatecznych',
    'dopuszczających',
    'niedostatecznych',
    'nieklasyfikowanych',
    'zwolnionych',
    'uczestniczących',
    'zaliczonych',
    'niezaliczonych',
    // Other summary columns
    'Liczba ocen',
    'Liczba opusz. godz.',
    'Liczba spóźnień',
    'Frekwencja w %',
    'Średnia ocen',
    'Średnia ocen z modyfikatorami',
  ]);

  const subjects: string[] = [];
  for (let i = 3; i < subjectRow.length; i++) {
    const subject = subjectRow[i];
    if (subject != null) {
      const subjectStr = String(subject).trim();
      // Stop at summary columns
      if (SUMMARY_COLUMNS.has(subjectStr)) {
        break;
      }
      if (subjectStr) {
        subjects.push(subjectStr);
      }
    }
  }

  const results: GradesRow[] = [];

  // Data rows start at row 3 (after header, subjects, and separator)
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.length < 3) continue;

    const numValue = row[0];
    const nameValue = row[1];
    const behaviorValue = row[2];

    // Skip rows with missing student number
    if (numValue == null) continue;
    const num = Number(numValue);
    if (!Number.isInteger(num) || num < 1) continue;

    // Skip rows with missing name
    if (nameValue == null) continue;
    const name = String(nameValue).trim();
    if (!name) continue;

    // Parse behavior from column 2
    let behavior: BehaviorGrade | undefined;
    if (behaviorValue != null) {
      const behaviorStr = String(behaviorValue).trim();
      if (behaviorStr) {
        behavior = parseBehaviorGrade(behaviorStr);
      }
    }

    // Parse grades starting from column 3
    const grades: Grade[] = subjects.map((subject, idx) => {
      const cellValue = row[idx + 3];
      // Treat null/undefined/empty/whitespace-only as no grade
      const value = cellValue == null ? null : String(cellValue).trim() || null;
      return { subject, value };
    });

    results.push({
      number: studentNumber(num),
      name,
      grades,
      behavior,
    });
  }

  return results;
}

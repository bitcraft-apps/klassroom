/**
 * Generates a synthetic Vulcan UONET+ XLSX fixture for E2E testing.
 *
 * GDPR: Uses fake names ("Uczen 01", "Uczen 02", etc.) that never appear in output.
 * These names are only used internally for correlating data across sheets during parsing.
 *
 * @module
 */
import * as XLSX from 'xlsx';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

interface SyntheticStudent {
  number: number;
  name: string; // Fake name for internal correlation only
  behavior: string; // Polish behavior grade
  grades: Record<string, string | null>; // subject -> grade
  average: number;
}

/**
 * Deterministic student data for consistent E2E test snapshots.
 * Uses "Uczen NN" naming pattern (Polish for "Student NN").
 * GDPR: These fake names never appear in output.
 */
const DETERMINISTIC_STUDENTS: SyntheticStudent[] = [
  {
    number: 1,
    name: 'Uczen 01',
    behavior: 'wzorowe',
    grades: { 'Język polski': '5', Matematyka: '6', Historia: '5', Przyroda: '5' },
    average: 5.25,
  },
  {
    number: 2,
    name: 'Uczen 02',
    behavior: 'bardzo dobre',
    grades: { 'Język polski': '4', Matematyka: '5', Historia: '4', Przyroda: '5' },
    average: 4.5,
  },
  {
    number: 3,
    name: 'Uczen 03',
    behavior: 'dobre',
    grades: { 'Język polski': '3', Matematyka: '4', Historia: '4', Przyroda: '4' },
    average: 3.75,
  },
  {
    number: 4,
    name: 'Uczen 04',
    behavior: 'poprawne',
    grades: { 'Język polski': '4', Matematyka: '3', Historia: '3', Przyroda: '4' },
    average: 3.5,
  },
  {
    number: 5,
    name: 'Uczen 05',
    behavior: 'bardzo dobre',
    grades: { 'Język polski': '5', Matematyka: '5', Historia: '5', Przyroda: '4' },
    average: 4.75,
  },
];

/**
 * Returns deterministic synthetic students for testing.
 */
function createSyntheticStudents(): SyntheticStudent[] {
  return DETERMINISTIC_STUDENTS;
}

/**
 * Builds the "Okres klasyfikacyjny" (grades) sheet.
 *
 * Format:
 * - Row 0: Headers ["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu", ...]
 * - Row 1: Subject names [null, null, null, "Subject1", "Subject2", ...]
 * - Row 2: Empty separator
 * - Row 3+: Student data [number, name, behavior, grade1, grade2, ...]
 */
function buildGradesSheet(students: SyntheticStudent[], subjects: string[]): unknown[][] {
  const rows: unknown[][] = [];

  // Row 0: Headers
  const headers = ['Nr w dzienniku', 'Uczeń', 'Zachowanie', 'Nazwa przedmiotu'];
  for (let i = 1; i < subjects.length; i++) {
    headers.push(null as unknown as string);
  }
  rows.push(headers);

  // Row 1: Subject names (starting at column 3)
  const subjectRow: unknown[] = [null, null, null];
  for (const subject of subjects) {
    subjectRow.push(subject);
  }
  rows.push(subjectRow);

  // Row 2: Empty separator
  rows.push([]);

  // Row 3+: Student data
  for (const student of students) {
    const row: unknown[] = [student.number, student.name, student.behavior];
    for (const subject of subjects) {
      row.push(student.grades[subject] ?? null);
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Builds the "Dodatkowe informacje 1" (metadata) sheet.
 *
 * Format:
 * - Row 0: Title with period info
 * - Row 1: Horizontal form with class and teacher
 */
function buildMetadataSheet(className: string, teacher: string): unknown[][] {
  return [
    ['Dodatkowe informacje dla 1 semestru w roku szkolnym 2024/2025'],
    ['Oddział', className, 'Wychowawca', null, null, teacher],
  ];
}

/**
 * Builds the "Średnia uczniów" (averages) sheet.
 *
 * Format:
 * - Row 0: Headers ["Numer w dzienniku", "Dane ucznia", "Średnia"]
 * - Row 1+: Student data [number, name, average]
 */
function buildAveragesSheet(students: SyntheticStudent[]): unknown[][] {
  const rows: unknown[][] = [['Numer w dzienniku', 'Dane ucznia', 'Średnia']];

  for (const student of students) {
    rows.push([student.number, student.name, student.average]);
  }

  return rows;
}

/**
 * Builds the "Dodatkowe informacje 2" (class summaries) sheet.
 *
 * Contains attendance, failure statistics, and grade distribution.
 * Uses deterministic data for consistent snapshots.
 */
function buildAttendanceSheet(): unknown[][] {
  const rows: unknown[][] = [];

  // Title row
  rows.push(['Dodatkowe informacje dla oddziału 5b w roku szkolnym 2024/2025']);
  rows.push([]); // Empty row

  // Some filler rows (mimicking Vulcan's structure)
  rows.push(['Informacje podstawowe']);
  rows.push(['Wychowawca:', 'Jan Kowalski']);
  rows.push([]); // Empty row

  // Daily student counts (rows 5-16 in real export)
  for (let i = 0; i < 12; i++) {
    rows.push([]);
  }

  // Attendance header and data (rows 17-20)
  rows.push(['Frekwencja', 'Stan %']);
  rows.push(['10.01.2025', 92.5]); // Date and percentage
  rows.push([]);
  rows.push([]);

  // Failure statistics (columns 2 and 3)
  // Real format has multi-column table structure
  // 5 students: 4 with no failing, 1 with 1-2 failing
  rows.push([null, null, 'bez ocen niedostatecznych', 4, null, null]);
  rows.push([null, null, 'z 1-2 ocenami ndst.', 1, null, null]);
  rows.push([null, null, 'z 3 i więcej ocenami ndst.', 0, null, null]);
  rows.push([null, null, 'nieklasyfikowani', 0, null, null]);

  // Grade distribution (columns 4 and 5)
  // Based on 5 students x 4 subjects = 20 total grades
  rows.push([null, null, null, null, 'Celujący', 1]); // One 6
  rows.push([null, null, null, null, 'Bardzo dobry', 9]); // Nine 5s
  rows.push([null, null, null, null, 'Dobry', 6]); // Six 4s
  rows.push([null, null, null, null, 'Dostateczny', 4]); // Four 3s
  rows.push([null, null, null, null, 'Dopuszczający', 0]);
  rows.push([null, null, null, null, 'Niedostateczny', 0]);
  rows.push([null, null, null, null, 'Nieklasyfikowany', 0]);

  return rows;
}

/** Deterministic subjects matching the student data */
const SUBJECTS = ['Język polski', 'Matematyka', 'Historia', 'Przyroda'];

/**
 * Generates a complete Vulcan UONET+ format XLSX workbook.
 */
export function generateVulcanFixture(): XLSX.WorkBook {
  const className = '5b';
  const teacher = 'Jan Kowalski';
  const subjects = SUBJECTS;
  const students = createSyntheticStudents();

  const workbook = XLSX.utils.book_new();

  // Add all 6 sheets (4 required + 2 optional that Vulcan exports include)
  const gradesSheet = XLSX.utils.aoa_to_sheet(buildGradesSheet(students, subjects));
  XLSX.utils.book_append_sheet(workbook, gradesSheet, 'Okres klasyfikacyjny');

  const metadataSheet = XLSX.utils.aoa_to_sheet(buildMetadataSheet(className, teacher));
  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Dodatkowe informacje 1');

  const averagesSheet = XLSX.utils.aoa_to_sheet(buildAveragesSheet(students));
  XLSX.utils.book_append_sheet(workbook, averagesSheet, 'Średnia uczniów');

  const attendanceSheet = XLSX.utils.aoa_to_sheet(buildAttendanceSheet());
  XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Dodatkowe informacje 2');

  // Add empty sheets that Vulcan exports include (for format detection)
  const emptySheet = XLSX.utils.aoa_to_sheet([[]]);
  XLSX.utils.book_append_sheet(workbook, emptySheet, 'Zachowanie');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[]]), 'Informacje o uczniach');

  return workbook;
}

/**
 * Generates and writes the fixture file to disk.
 * @param outputPath - Path to write the fixture file
 * @param options.quiet - Suppress console output (default: false)
 */
export function writeFixture(outputPath: string, options?: { quiet?: boolean }): void {
  const workbook = generateVulcanFixture();
  // Use XLSX.write to get buffer, then fs.writeFileSync to write
  // (XLSX.writeFile has issues in some ESM contexts)
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(outputPath, buffer);
  if (!options?.quiet) {
    console.log(`Generated fixture: ${outputPath}`);
  }
}

// Execute if run directly (works with both .ts and compiled .js)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  const __dirname = path.dirname(__filename);
  const outputPath = path.join(__dirname, 'sample-class.xlsx');
  writeFixture(outputPath);
}

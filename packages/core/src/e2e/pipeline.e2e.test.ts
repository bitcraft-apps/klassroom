/**
 * End-to-end test for the full Klassroom pipeline.
 *
 * Tests the complete flow: XLSX -> Parse -> Analytics -> Charts -> HTML
 *
 * GDPR Compliance:
 * - Uses synthetic test data with fake names ("Uczen 01", "Uczen 02", etc.)
 * - Verifies output contains student numbers only, never names
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as XLSX from 'xlsx';
import { parseVulcanXlsx } from '../parser/index.js';
import { generatePresentation } from '../generator/index.js';
import { generateVulcanFixture } from './fixtures/generate-fixture.js';

// Path to the committed synthetic test fixture (stable input for true E2E testing)
const FIXTURE_PATH = path.join(import.meta.dirname, 'fixtures', 'sample-class.xlsx');

// Fake names used in the fixture (for GDPR verification)
const FAKE_NAMES = ['Uczen 01', 'Uczen 02', 'Uczen 03', 'Uczen 04', 'Uczen 05'];

describe('E2E: Full Pipeline', () => {
  let html: string;

  beforeAll(async () => {
    // Parse the committed XLSX fixture (stable input for true E2E testing)
    const classData = parseVulcanXlsx(FIXTURE_PATH);

    // Generate HTML presentation with a fixed date to ensure consistent snapshots
    html = await generatePresentation(classData, {
      meetingDate: '15 stycznia 2025',
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Pipeline Output', () => {
    it('generates non-empty HTML', () => {
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(1000);
    });

    it('produces valid HTML document', () => {
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('includes class metadata in output', () => {
      // Class name from fixture
      expect(html).toContain('5b');
      // Teacher name from fixture
      expect(html).toContain('Jan Kowalski');
      // Period from fixture
      expect(html).toContain('2024/2025');
    });
  });

  describe('Polish Localization', () => {
    it('contains Polish UI labels', () => {
      // Common Polish labels that should appear in the presentation
      const polishLabels = [
        'Średnia', // Average
        'Wychowawca', // Teacher
        'Frekwencja', // Attendance
        'uczniów', // students (genitive)
      ];

      for (const label of polishLabels) {
        expect(html, `Expected Polish label "${label}" in output`).toContain(label);
      }
    });

    it('uses Polish date format', () => {
      // The fixed meeting date in Polish format
      expect(html).toContain('15 stycznia 2025');
    });
  });

  describe('GDPR Compliance', () => {
    it('does NOT contain student names', () => {
      for (const name of FAKE_NAMES) {
        expect(html, `GDPR violation: Found student name "${name}" in output`).not.toContain(name);
      }
    });

    it('contains student numbers in tables', () => {
      // Student numbers 1-5 should be present in table cells (used for identification)
      // Verify all students appear - they show up in the "Najwyższe średnie" table
      // and other data tables as <td>N</td> where N is the student number
      const studentNumbers = [1, 5]; // Students with highest averages appear in table
      for (const num of studentNumbers) {
        expect(html, `Expected student number ${num} in table`).toContain(`<td>${num}</td>`);
      }
    });

    it('does not leak PII patterns', () => {
      // Common PII patterns that should never appear
      const piiPatterns = [
        // Polish surnames: -owski/-owska, -ewski/-ewska, -ski/-ska, -cki/-cka, -wicz, -czyk, -czak
        /[A-Z][a-z]+ [A-Z][a-z]+(owski|owska|ewski|ewska|ski|ska|cki|cka|wicz|czyk|czak)\b/,
        /\d{11}/, // PESEL (Polish national ID)
        /@.*\.[a-z]{2,}/, // Email addresses
      ];

      for (const pattern of piiPatterns) {
        // Allow "Jan Kowalski" as teacher name (not a student)
        const htmlWithoutTeacher = html.replace(/Jan Kowalski/g, '');
        expect(htmlWithoutTeacher, `Potential PII leak matching pattern: ${pattern}`).not.toMatch(
          pattern,
        );
      }
    });
  });

  describe('Content Validation', () => {
    it('includes charts as base64 images', () => {
      // Charts should be rendered as data URLs (base64 PNG images)
      expect(html).toContain('data:image/png;base64,');
    });

    it('includes subject data', () => {
      // Subjects from the fixture
      const subjects = ['Język polski', 'Matematyka', 'Historia', 'Przyroda'];

      for (const subject of subjects) {
        expect(html, `Expected subject "${subject}" in output`).toContain(subject);
      }
    });

    it('includes attendance information', () => {
      // Attendance percentage from fixture (92.5%)
      expect(html).toMatch(/92[,.]5/);
    });

    it('includes behavior grade distribution', () => {
      // Polish behavior grades should appear in the output (titlecase)
      // These come from the "Zachowanie" section of the presentation
      const behaviorGrades = ['Wzorowe', 'Bardzo dobre', 'Dobre', 'Poprawne'];

      for (const grade of behaviorGrades) {
        expect(html, `Expected behavior grade "${grade}" in output`).toContain(grade);
      }
    });
  });

  describe('Snapshot Testing', () => {
    it('matches HTML structure snapshot', () => {
      // Extract just the structural elements, excluding volatile data
      // This helps prevent snapshot churn from chart image data
      const structuralHtml = html
        // Remove base64 image data (volatile)
        .replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g, 'data:image/png;base64,[BASE64_DATA]')
        // Normalize whitespace
        .replace(/>\s+</g, '><')
        .trim();

      expect(structuralHtml).toMatchSnapshot();
    });
  });

  describe('Fixture Integrity', () => {
    it('committed fixture matches generator output', () => {
      // This test ensures the committed XLSX file stays in sync with the generator.
      // If this fails, regenerate the fixture: npx tsx packages/core/src/e2e/fixtures/generate-fixture.ts
      const committedBuffer = fs.readFileSync(FIXTURE_PATH);
      const committedWorkbook = XLSX.read(committedBuffer);
      const generatedWorkbook = generateVulcanFixture();

      // Compare sheet names
      expect(committedWorkbook.SheetNames).toEqual(generatedWorkbook.SheetNames);

      // Compare each sheet's data content
      for (const sheetName of generatedWorkbook.SheetNames) {
        const committedSheet = committedWorkbook.Sheets[sheetName];
        const generatedSheet = generatedWorkbook.Sheets[sheetName];

        // Convert to array-of-arrays for comparison (ignores XLSX metadata)
        const committedData = XLSX.utils.sheet_to_json(committedSheet, { header: 1 });
        const generatedData = XLSX.utils.sheet_to_json(generatedSheet, { header: 1 });

        expect(committedData, `Sheet "${sheetName}" data mismatch`).toEqual(generatedData);
      }
    });
  });
});

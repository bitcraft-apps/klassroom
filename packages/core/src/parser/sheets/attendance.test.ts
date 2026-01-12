import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import type { WorkSheet } from "xlsx";
import {
  parseClassAttendance,
  parseFailureStatistics,
  parseAggregateGradeDistribution,
} from "./attendance.js";

/**
 * Helper to create a mock WorkSheet from row data.
 */
function createMockSheet(rows: unknown[][]): WorkSheet {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  return ws;
}

/**
 * Creates a realistic Vulcan "Dodatkowe informacje 2" sheet structure.
 * The actual format has a multi-column table with:
 * - Columns 0-1: Behavior (label, count)
 * - Columns 2-3: Failure stats (label, count)
 * - Columns 4-5: Grade distribution (label, count)
 */
function createVulcanSheet(options: {
  failureStats?: {
    noFailing?: number;
    oneTwoFailing?: number;
    threePlusFailing?: number;
    unclassified?: number;
  };
  gradeDistribution?: {
    excellent?: number;
    veryGood?: number;
    good?: number;
    satisfactory?: number;
    acceptable?: number;
    failing?: number;
    unclassified?: number;
  };
}): WorkSheet {
  const { failureStats = {}, gradeDistribution = {} } = options;
  const rows = [
    ["Dodatkowe informacje dla oddziału 5b w roku szkolnym 2025/2026"],
    [],
    ["Dane podstawowe"],
    ["Wychowawca: Jan Kowalski"],
    [],
    ["Liczba uczniów w dniu"],
    [],
    ["Dzień", "Liczba uczniów"],
    ["01.09.2025", 30],
    [],
    ["Frekwencja na dzień klasyfikacji"],
    [],
    ["Frekwencja", "Stan %"],
    ["10.01.2026", 88.93],
    [],
    ["Liczba ocen w oddziale"],
    [],
    // Header row for the multi-column table
    ["Zachowanie", "Liczba", "Uczniowie", "Liczba uczniów", "Oceny", "Liczba ocen"],
    // Data rows with behavior, failure stats, and grade distribution
    ["wzorowe", 12, "bez ocen niedostatecznych", failureStats.noFailing ?? 29, "Celujący", gradeDistribution.excellent ?? 65],
    ["bardzo dobre", 18, "z 1-2 ocenami ndst.", failureStats.oneTwoFailing ?? 1, "Bardzo dobry", gradeDistribution.veryGood ?? 145],
    ["dobre", 0, "z 3 i więcej ocenami ndst.", failureStats.threePlusFailing ?? 0, "Dobry", gradeDistribution.good ?? 94],
    ["poprawne", 0, "nieklasyfikowani", failureStats.unclassified ?? 0, "Dostateczny", gradeDistribution.satisfactory ?? 44],
    ["nieodpowiednie", 0, "", "", "Dopuszczający", gradeDistribution.acceptable ?? 8],
    ["naganne", 0, "", "", "Niedostateczny", gradeDistribution.failing ?? 1],
    ["", "", "", "", "Nieklasyfikowany", gradeDistribution.unclassified ?? 0],
  ];
  return createMockSheet(rows);
}

describe("parseFailureStatistics", () => {
  it("parses all failure statistics from Vulcan format", () => {
    const sheet = createVulcanSheet({
      failureStats: {
        noFailing: 15,
        oneTwoFailing: 3,
        threePlusFailing: 1,
        unclassified: 2,
      },
    });

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 3,
      threeOrMoreFailingGrades: 1,
      unclassified: 2,
    });
  });

  it("parses partial data when some rows have empty labels", () => {
    const sheet = createMockSheet([
      // Multi-column row with only some failure stats
      ["wzorowe", 12, "bez ocen niedostatecznych", 10, "Celujący", 65],
      ["bardzo dobre", 18, "z 1-2 ocenami ndst.", 5, "Bardzo dobry", 145],
      // Rows without failure stats (empty column 2)
      ["dobre", 0, "", "", "Dobry", 94],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 10,
      oneToTwoFailingGrades: 5,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("returns null for empty sheet", () => {
    const sheet = createMockSheet([]);

    const result = parseFailureStatistics(sheet);

    expect(result).toBeNull();
  });

  it("returns null when no matching labels found", () => {
    const sheet = createMockSheet([
      ["Header", "Description", "Other", "Data", "More", "Values"],
      ["row1", 100, "some other data", 50, "irrelevant", 25],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toBeNull();
  });

  it("handles case insensitivity in labels", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "BEZ OCEN NIEDOSTATECZNYCH", 20, "grade", 65],
      ["behavior", 18, "Z 1-2 Ocenami Ndst.", 4, "grade", 145],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 20,
      oneToTwoFailingGrades: 4,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("handles labels with extra whitespace", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "  bez ocen niedostatecznych  ", 12, "grade", 65],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 12,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("skips rows with non-numeric values in count column", () => {
    const sheet = createMockSheet([
      ["Header", "Liczba", "Uczniowie", "Liczba uczniów", "Oceny", "Liczba ocen"],
      ["behavior", 12, "bez ocen niedostatecznych", 15, "grade", 65],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("skips rows with less than 4 columns", () => {
    const sheet = createMockSheet([
      ["only", "three", "columns"],
      ["behavior", 12, "bez ocen niedostatecznych", 15, "grade", 65],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("handles realistic Vulcan export format", () => {
    const sheet = createVulcanSheet({
      failureStats: {
        noFailing: 29,
        oneTwoFailing: 1,
        threePlusFailing: 0,
        unclassified: 0,
      },
    });

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 29,
      oneToTwoFailingGrades: 1,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });
});

describe("parseAggregateGradeDistribution", () => {
  it("parses all grade counts from Vulcan format", () => {
    const sheet = createVulcanSheet({
      gradeDistribution: {
        excellent: 10,
        veryGood: 20,
        good: 30,
        satisfactory: 15,
        acceptable: 5,
        failing: 2,
        unclassified: 1,
      },
    });

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 10,
      veryGood: 20,
      good: 30,
      satisfactory: 15,
      acceptable: 5,
      failing: 2,
      unclassified: 1,
    });
  });

  it("parses partial data when some rows are missing", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "label", 29, "Celujący", 10],
      ["behavior", 18, "label", 1, "Bardzo dobry", 20],
      ["behavior", 0, "label", 0, "Dobry", 30],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 10,
      veryGood: 20,
      good: 30,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    });
  });

  it("returns null for empty sheet", () => {
    const sheet = createMockSheet([]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toBeNull();
  });

  it("returns null when no matching labels found", () => {
    const sheet = createMockSheet([
      ["col0", "col1", "col2", "col3", "col4", "col5"],
      ["a", 100, "b", 200, "some other data", 300],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toBeNull();
  });

  it("distinguishes 'Dobry' from 'Bardzo dobry'", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "label", 29, "Bardzo dobry", 20],
      ["behavior", 18, "label", 1, "Dobry", 30],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.veryGood).toBe(20);
    expect(result?.good).toBe(30);
  });

  it("handles case insensitivity in labels", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "label", 29, "CELUJĄCY", 10],
      ["behavior", 18, "label", 1, "Bardzo Dobry", 20],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 10,
      veryGood: 20,
      good: 0,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    });
  });

  it("handles realistic Vulcan export format", () => {
    const sheet = createVulcanSheet({
      gradeDistribution: {
        excellent: 65,
        veryGood: 145,
        good: 94,
        satisfactory: 44,
        acceptable: 8,
        failing: 1,
        unclassified: 0,
      },
    });

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 65,
      veryGood: 145,
      good: 94,
      satisfactory: 44,
      acceptable: 8,
      failing: 1,
      unclassified: 0,
    });
  });

  it("skips rows with non-numeric values in count column", () => {
    const sheet = createMockSheet([
      ["Header", "Liczba", "Uczniowie", "Liczba", "Oceny", "Liczba ocen"],
      ["behavior", 12, "label", 29, "Celujący", 10],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.excellent).toBe(10);
  });

  it("handles zero counts correctly", () => {
    const sheet = createMockSheet([
      ["behavior", 12, "label", 29, "Celujący", 0],
      ["behavior", 18, "label", 1, "Niedostateczny", 0],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 0,
      veryGood: 0,
      good: 0,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    });
  });

  it("skips rows with less than 6 columns", () => {
    const sheet = createMockSheet([
      ["only", "five", "columns", "here", "now"],
      ["behavior", 12, "label", 29, "Celujący", 10],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.excellent).toBe(10);
  });
});

describe("parseClassAttendance", () => {
  it("parses attendance with date", () => {
    const sheet = createMockSheet([
      [],
      ["Frekwencja", "Stan %"],
      ["10.01.2026", 88.93],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result).toEqual({
      percentage: 88.93,
      date: "10.01.2026",
    });
  });

  it("parses attendance without date", () => {
    const sheet = createMockSheet([
      ["Frekwencja", "Stan %"],
      [null, 92.5],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result).toEqual({
      percentage: 92.5,
      date: undefined,
    });
  });

  it("returns null when header not found", () => {
    const sheet = createMockSheet([
      ["Other Header", "Data"],
      [100, 200],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result).toBeNull();
  });

  it("returns null for empty sheet", () => {
    const sheet = createMockSheet([]);

    const result = parseClassAttendance(sheet);

    expect(result).toBeNull();
  });

  it("handles case insensitivity in header", () => {
    const sheet = createMockSheet([
      ["FREKWENCJA", "STAN %"],
      ["10.01.2026", 90.0],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result?.percentage).toBe(90.0);
  });

  it("skips empty rows between header and data", () => {
    const sheet = createMockSheet([
      ["Frekwencja", "Stan %"],
      [],
      [],
      ["10.01.2026", 85.5],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result?.percentage).toBe(85.5);
  });

  it("validates date format (requires 2-digit day/month)", () => {
    const sheet = createMockSheet([
      ["Frekwencja", "Stan %"],
      ["1.5", 90.0], // Not a valid date (looks like decimal)
    ]);

    const result = parseClassAttendance(sheet);

    expect(result?.date).toBeUndefined();
    expect(result?.percentage).toBe(90.0);
  });

  it("accepts valid date formats", () => {
    const sheet = createMockSheet([
      ["Frekwencja", "Stan %"],
      ["10.01.2026", 90.0],
    ]);

    const result = parseClassAttendance(sheet);

    expect(result?.date).toBe("10.01.2026");
  });

  it("parses attendance from realistic Vulcan format", () => {
    const sheet = createVulcanSheet({});

    const result = parseClassAttendance(sheet);

    expect(result).toEqual({
      percentage: 88.93,
      date: "10.01.2026",
    });
  });
});

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

describe("parseFailureStatistics", () => {
  it("parses all failure statistics when all labels present", () => {
    const sheet = createMockSheet([
      [15, "uczniów bez ocen niedostatecznych"],
      [3, "uczniów z 1 lub 2 ocenami niedostatecznymi"],
      [1, "uczniów z 3 i więcej ocenami niedostatecznymi"],
      [2, "uczniów nieklasyfikowanych"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 3,
      threeOrMoreFailingGrades: 1,
      unclassified: 2,
    });
  });

  it("parses partial data when some labels missing", () => {
    const sheet = createMockSheet([
      [10, "uczniów bez ocen niedostatecznych"],
      [5, "uczniów z 1 lub 2 ocenami niedostatecznymi"],
      // missing: uczniów z 3 i więcej ocenami niedostatecznymi
      // missing: uczniów nieklasyfikowanych
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
      ["Header", "Description"],
      [100, "some other data"],
      [50, "more unrelated content"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toBeNull();
  });

  it("handles case insensitivity in labels", () => {
    const sheet = createMockSheet([
      [20, "UCZNIÓW BEZ OCEN NIEDOSTATECZNYCH"],
      [4, "Uczniów Z 1 Lub 2 Ocenami Niedostatecznymi"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 20,
      oneToTwoFailingGrades: 4,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("handles labels with extra whitespace or text", () => {
    const sheet = createMockSheet([
      [12, "  uczniów bez ocen niedostatecznych  (stan na 10.01)"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 12,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("skips rows with non-numeric values in first column", () => {
    const sheet = createMockSheet([
      ["Header", "uczniów bez ocen niedostatecznych"],
      [15, "uczniów bez ocen niedostatecznych"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("skips rows with less than 2 columns", () => {
    const sheet = createMockSheet([
      [15],
      [15, "uczniów bez ocen niedostatecznych"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 0,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });

  it("handles rows interspersed with other data", () => {
    const sheet = createMockSheet([
      ["Title", "Dodatkowe informacje 2"],
      [],
      [100, "other metric"],
      [15, "uczniów bez ocen niedostatecznych"],
      [50, "irrelevant data"],
      [3, "uczniów z 1 lub 2 ocenami niedostatecznymi"],
    ]);

    const result = parseFailureStatistics(sheet);

    expect(result).toEqual({
      noFailingGrades: 15,
      oneToTwoFailingGrades: 3,
      threeOrMoreFailingGrades: 0,
      unclassified: 0,
    });
  });
});

describe("parseAggregateGradeDistribution", () => {
  it("parses all grade counts when all labels present", () => {
    const sheet = createMockSheet([
      [10, "celujących"],
      [20, "bardzo dobrych"],
      [30, "dobrych"],
      [15, "dostatecznych"],
      [5, "dopuszczających"],
      [2, "niedostatecznych"],
      [1, "nieklasyfikowany"],
    ]);

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

  it("parses partial data when some grades missing", () => {
    const sheet = createMockSheet([
      [10, "celujących"],
      [20, "bardzo dobrych"],
      [30, "dobrych"],
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
      ["Header", "Description"],
      [100, "some other data"],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toBeNull();
  });

  it("distinguishes 'dobrych' from 'bardzo dobrych'", () => {
    const sheet = createMockSheet([
      [20, "bardzo dobrych"],
      [30, "dobrych"],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.veryGood).toBe(20);
    expect(result?.good).toBe(30);
  });

  it("excludes failure stats labels containing 'uczniów'", () => {
    // The sheet may contain both grade counts and failure stats
    // Grade counts: "niedostatecznych" (without "uczniów")
    // Failure stats: "uczniów z ... niedostatecznymi" (with "uczniów")
    const sheet = createMockSheet([
      [2, "niedostatecznych"],
      [5, "uczniów z 1 lub 2 ocenami niedostatecznymi"],
      [1, "nieklasyfikowany"],
      [3, "uczniów nieklasyfikowanych"],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.failing).toBe(2);
    expect(result?.unclassified).toBe(1);
  });

  it("handles case insensitivity in labels", () => {
    const sheet = createMockSheet([
      [10, "CELUJĄCYCH"],
      [20, "Bardzo Dobrych"],
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

  it("handles realistic Vulcan export format with mixed data", () => {
    // Simulates real Vulcan export structure with various data interspersed
    const sheet = createMockSheet([
      ["Dodatkowe informacje dla oddziału 5b", null],
      [],
      ["Wychowawca", "Jan Kowalski"],
      [],
      [20, "uczniów w klasie"],
      [],
      // Failure stats section
      [15, "uczniów bez ocen niedostatecznych"],
      [3, "uczniów z 1 lub 2 ocenami niedostatecznymi"],
      [1, "uczniów z 3 i więcej ocenami niedostatecznymi"],
      [1, "uczniów nieklasyfikowanych"],
      [],
      // Grade distribution section
      [5, "celujących"],
      [25, "bardzo dobrych"],
      [40, "dobrych"],
      [20, "dostatecznych"],
      [8, "dopuszczających"],
      [2, "niedostatecznych"],
      [0, "nieklasyfikowany"],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result).toEqual({
      excellent: 5,
      veryGood: 25,
      good: 40,
      satisfactory: 20,
      acceptable: 8,
      failing: 2,
      unclassified: 0,
    });
  });

  it("skips rows with non-numeric values in first column", () => {
    const sheet = createMockSheet([
      ["Ocena", "celujących"],
      [10, "celujących"],
    ]);

    const result = parseAggregateGradeDistribution(sheet);

    expect(result?.excellent).toBe(10);
  });

  it("handles zero counts correctly", () => {
    const sheet = createMockSheet([
      [0, "celujących"],
      [0, "niedostatecznych"],
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
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import { parseLibrusXlsx } from "./index.js";
import { parseGradesSheet } from "./sheets/grades.js";
import { parseAveragesSheet } from "./sheets/averages.js";
import { parseBehaviorSheet } from "./sheets/behavior.js";
import { parseMetadataSheet } from "./sheets/metadata.js";

// Mock fs module
vi.mock("node:fs");

// Mock xlsx module with factory
vi.mock("xlsx", () => ({
  readFile: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

describe("parseLibrusXlsx", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when file not found", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => parseLibrusXlsx("/path/to/missing.xlsx")).toThrow(
      "File not found: /path/to/missing.xlsx"
    );
  });

  it("throws error when required sheet is missing", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(XLSX.readFile).mockReturnValue({
      SheetNames: ["Okres klasyfikacyjny", "Średnia uczniów"],
      Sheets: {},
    } as XLSX.WorkBook);

    expect(() => parseLibrusXlsx("/path/to/file.xlsx")).toThrow(
      "Missing required sheet: Zachowanie"
    );
  });

  it("parses valid XLSX and returns ClassData without student names", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    // Mock sheet data
    const gradesSheetData = [
      ["Numer", "Uczeń", "Matematyka", "Polski"],
      [1, "Jan Kowalski", "5", "4"],
      [2, "Anna Nowak", "4+", null],
    ];

    const averagesSheetData = [
      ["Uczeń", "Średnia"],
      ["Jan Kowalski", 4.5],
      ["Anna Nowak", 4.0],
    ];

    const behaviorSheetData = [
      ["Uczeń", "Ocena"],
      ["Jan Kowalski", "wzorowe"],
      ["Anna Nowak", "bardzo dobre"],
    ];

    const metadataSheetData = [
      ["Klasa", "3A"],
      ["Okres klasyfikacyjny", "2024/2025 - Semestr 1"],
      ["Wychowawca", "Maria Wiśniewska"],
    ];

    // Mock workbook
    vi.mocked(XLSX.readFile).mockReturnValue({
      SheetNames: [
        "Okres klasyfikacyjny",
        "Średnia uczniów",
        "Zachowanie",
        "Dodatkowe informacje 1",
      ],
      Sheets: {
        "Okres klasyfikacyjny": {},
        "Średnia uczniów": {},
        Zachowanie: {},
        "Dodatkowe informacje 1": {},
      },
    } as XLSX.WorkBook);

    // Mock sheet_to_json to return appropriate data based on call order
    let callIndex = 0;
    const sheetDataSequence = [
      metadataSheetData,
      gradesSheetData,
      averagesSheetData,
      behaviorSheetData,
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockImplementation(() => {
      return sheetDataSequence[callIndex++] ?? [];
    });

    const result = parseLibrusXlsx("/path/to/file.xlsx");

    // Verify metadata
    expect(result.metadata.className).toBe("3A");
    expect(result.metadata.period).toBe("2024/2025 - Semestr 1");
    expect(result.metadata.teacher).toBe("Maria Wiśniewska");

    // Verify students (GDPR-safe - no names!)
    expect(result.students).toHaveLength(2);

    expect(result.students[0]).toEqual({
      number: 1,
      grades: [
        { subject: "Matematyka", value: "5" },
        { subject: "Polski", value: "4" },
      ],
      average: 4.5,
      behavior: "exemplary",
    });

    expect(result.students[1]).toEqual({
      number: 2,
      grades: [
        { subject: "Matematyka", value: "4+" },
        { subject: "Polski", value: null },
      ],
      average: 4.0,
      behavior: "veryGood",
    });

    // Critical: Verify no names in output
    for (const student of result.students) {
      expect(student).not.toHaveProperty("name");
    }
  });
});

describe("parseGradesSheet", () => {
  it("parses grades matrix correctly", () => {
    const sheetData = [
      ["Numer", "Uczeń", "Matematyka", "Polski"],
      [1, "Jan Kowalski", "5", "4"],
      [2, "Anna Nowak", "4+", ""],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseGradesSheet({} as XLSX.WorkSheet);

    expect(result).toHaveLength(2);
    expect(result[0]?.number).toBe(1);
    expect(result[0]?.name).toBe("Jan Kowalski");
    expect(result[0]?.grades).toEqual([
      { subject: "Matematyka", value: "5" },
      { subject: "Polski", value: "4" },
    ]);
    expect(result[1]?.grades[1]?.value).toBeNull(); // Empty cell
  });

  it("skips empty rows", () => {
    const sheetData = [
      ["Numer", "Uczeń", "Matematyka"],
      [1, "Jan Kowalski", "5"],
      ["", "", ""],
      [2, "Anna Nowak", "4"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseGradesSheet({} as XLSX.WorkSheet);
    expect(result).toHaveLength(2);
  });

  it("throws on invalid sheet structure", () => {
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);

    expect(() => parseGradesSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Okres klasyfikacyjny"
    );
  });
});

describe("parseAveragesSheet", () => {
  it("parses student averages correctly", () => {
    const sheetData = [
      ["Uczeń", "Średnia"],
      ["Jan Kowalski", 4.5],
      ["Anna Nowak", 4.0],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseAveragesSheet({} as XLSX.WorkSheet);

    expect(result.get("Jan Kowalski")).toBe(4.5);
    expect(result.get("Anna Nowak")).toBe(4.0);
  });

  it("handles string numbers", () => {
    const sheetData = [
      ["Uczeń", "Średnia"],
      ["Jan Kowalski", "4.5"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseAveragesSheet({} as XLSX.WorkSheet);
    expect(result.get("Jan Kowalski")).toBe(4.5);
  });

  it("throws on invalid sheet structure", () => {
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);

    expect(() => parseAveragesSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Średnia uczniów"
    );
  });
});

describe("parseBehaviorSheet", () => {
  it("parses Polish behavior grades to English", () => {
    const sheetData = [
      ["Uczeń", "Ocena"],
      ["Jan Kowalski", "wzorowe"],
      ["Anna Nowak", "bardzo dobre"],
      ["Piotr Wiśniewski", "dobre"],
      ["Maria Zielińska", "poprawne"],
      ["Adam Kamiński", "nieodpowiednie"],
      ["Ewa Lewandowska", "naganne"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseBehaviorSheet({} as XLSX.WorkSheet);

    expect(result.get("Jan Kowalski")).toBe("exemplary");
    expect(result.get("Anna Nowak")).toBe("veryGood");
    expect(result.get("Piotr Wiśniewski")).toBe("good");
    expect(result.get("Maria Zielińska")).toBe("acceptable");
    expect(result.get("Adam Kamiński")).toBe("inappropriate");
    expect(result.get("Ewa Lewandowska")).toBe("reprehensible");
  });

  it("handles case-insensitive Polish grades", () => {
    const sheetData = [
      ["Uczeń", "Ocena"],
      ["Jan Kowalski", "WZOROWE"],
      ["Anna Nowak", "Bardzo Dobre"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseBehaviorSheet({} as XLSX.WorkSheet);

    expect(result.get("Jan Kowalski")).toBe("exemplary");
    expect(result.get("Anna Nowak")).toBe("veryGood");
  });

  it("throws on invalid sheet structure", () => {
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([]);

    expect(() => parseBehaviorSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Zachowanie"
    );
  });
});

describe("parseMetadataSheet", () => {
  it("parses class metadata correctly", () => {
    const sheetData = [
      ["Klasa", "3A"],
      ["Okres klasyfikacyjny", "2024/2025 - Semestr 1"],
      ["Wychowawca", "Maria Wiśniewska"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseMetadataSheet({} as XLSX.WorkSheet);

    expect(result.className).toBe("3A");
    expect(result.period).toBe("2024/2025 - Semestr 1");
    expect(result.teacher).toBe("Maria Wiśniewska");
  });

  it("handles missing optional teacher field", () => {
    const sheetData = [
      ["Klasa", "3A"],
      ["Okres klasyfikacyjny", "2024/2025 - Semestr 1"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseMetadataSheet({} as XLSX.WorkSheet);

    expect(result.className).toBe("3A");
    expect(result.period).toBe("2024/2025 - Semestr 1");
    expect(result.teacher).toBeUndefined();
  });

  it("throws when className is missing", () => {
    const sheetData = [["Okres klasyfikacyjny", "2024/2025 - Semestr 1"]];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    expect(() => parseMetadataSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Dodatkowe informacje 1"
    );
  });

  it("throws when period is missing", () => {
    const sheetData = [["Klasa", "3A"]];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    expect(() => parseMetadataSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Dodatkowe informacje 1"
    );
  });
});

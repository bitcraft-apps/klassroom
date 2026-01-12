import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as XLSX from "xlsx";
import { parseVulcanXlsx, detectFormat } from "./index.js";
import { parseGradesSheet } from "./sheets/grades.js";
import { parseAveragesSheet } from "./sheets/averages.js";
import { parseMetadataSheet } from "./sheets/metadata.js";

// Mock fs module
vi.mock("node:fs");

// Mock xlsx module with factory
vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

describe("detectFormat", () => {
  it("detects Vulcan format when all 6 sheets present", () => {
    const sheetNames = [
      "Okres klasyfikacyjny",
      "Dodatkowe informacje 1",
      "Średnia uczniów",
      "Dodatkowe informacje 2",
      "Zachowanie",
      "Informacje o uczniach",
    ];

    const result = detectFormat(sheetNames);

    expect(result.format).toBe("vulcan");
    expect(result.matchedSheets).toHaveLength(6);
    expect(result.missingSheets).toHaveLength(0);
  });

  it("detects Vulcan format when 4+ sheets present", () => {
    const sheetNames = [
      "Okres klasyfikacyjny",
      "Dodatkowe informacje 1",
      "Średnia uczniów",
      "Zachowanie",
    ];

    const result = detectFormat(sheetNames);

    expect(result.format).toBe("vulcan");
    expect(result.matchedSheets).toHaveLength(4);
    expect(result.missingSheets).toHaveLength(2);
  });

  it("returns unknown format when less than 4 sheets match", () => {
    const sheetNames = ["Sheet1", "Sheet2", "Okres klasyfikacyjny"];

    const result = detectFormat(sheetNames);

    expect(result.format).toBe("unknown");
    expect(result.matchedSheets).toHaveLength(1);
  });

  it("returns unknown format for completely different sheets", () => {
    const sheetNames = ["Dane", "Oceny", "Uczniowie"];

    const result = detectFormat(sheetNames);

    expect(result.format).toBe("unknown");
    expect(result.matchedSheets).toHaveLength(0);
    expect(result.missingSheets).toHaveLength(6);
  });
});

describe("parseVulcanXlsx", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error when file not found", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => parseVulcanXlsx("/path/to/missing.xlsx")).toThrow(
      "File not found: /path/to/missing.xlsx"
    );
  });

  it("throws error for unrecognized format", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("mock"));
    vi.mocked(XLSX.read).mockReturnValue({
      SheetNames: ["Sheet1", "Sheet2", "Sheet3"],
      Sheets: {},
    } as XLSX.WorkBook);

    expect(() => parseVulcanXlsx("/path/to/file.xlsx")).toThrow(
      /Unrecognized XLSX format.*Other formats not yet supported/
    );
  });

  it("throws error when required sheet is missing from Vulcan file", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("mock"));
    // Provide 4 sheets to pass format detection, but missing "Dodatkowe informacje 1"
    vi.mocked(XLSX.read).mockReturnValue({
      SheetNames: [
        "Okres klasyfikacyjny",
        "Średnia uczniów",
        "Zachowanie",
        "Informacje o uczniach",
      ],
      Sheets: {},
    } as XLSX.WorkBook);

    expect(() => parseVulcanXlsx("/path/to/file.xlsx")).toThrow(
      /Missing required sheet: Dodatkowe informacje 1/
    );
  });

  it("parses valid XLSX and returns ClassData without student names", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from("mock"));

    // Mock sheet data in Vulcan format
    // Grades sheet: Row 0 = headers, Row 1 = subjects, Row 2 = separator, Row 3+ = data
    const gradesSheetData = [
      ["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu"],
      [null, null, null, "Matematyka", "Polski"],
      [null, null, null, null, null],
      [1, "Jan Kowalski", "wzorowe", "5", "4"],
      [2, "Anna Nowak", "bardzo dobre", "4+", null],
    ];

    // Averages sheet: [number, name, average]
    const averagesSheetData = [
      ["Numer w dzienniku", "Dane ucznia", "Średnia"],
      [1, "Jan Kowalski", 4.5],
      [2, "Anna Nowak", 4.0],
    ];

    const metadataSheetData = [
      ["Dodatkowe informacje dla 1 semestru w roku szkolnym 2024/2025"],
      ["Oddział", "3A", "Wychowawca", null, null, "Maria Wiśniewska"],
    ];

    // Mock workbook with all 6 Vulcan sheets (format detection requires 4+)
    vi.mocked(XLSX.read).mockReturnValue({
      SheetNames: [
        "Okres klasyfikacyjny",
        "Dodatkowe informacje 1",
        "Średnia uczniów",
        "Dodatkowe informacje 2",
        "Zachowanie",
        "Informacje o uczniach",
      ],
      Sheets: {
        "Okres klasyfikacyjny": {},
        "Dodatkowe informacje 1": {},
        "Średnia uczniów": {},
        "Dodatkowe informacje 2": {},
        Zachowanie: {},
        "Informacje o uczniach": {},
      },
    } as XLSX.WorkBook);

    // Mock sheet_to_json to return data in expected call order:
    // 1. metadata, 2. grades, 3. averages
    vi.mocked(XLSX.utils.sheet_to_json)
      .mockReturnValueOnce(metadataSheetData)
      .mockReturnValueOnce(gradesSheetData)
      .mockReturnValueOnce(averagesSheetData);

    const result = parseVulcanXlsx("/path/to/file.xlsx");

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
  it("parses grades matrix with behavior correctly", () => {
    // Vulcan format: Row 0 = headers, Row 1 = subjects, Row 2 = separator, Row 3+ = data
    const sheetData = [
      ["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu"],
      [null, null, null, "Matematyka", "Polski"],
      [null, null, null, null, null],
      [1, "Jan Kowalski", "wzorowe", "5", "4"],
      [2, "Anna Nowak", "bardzo dobre", "4+", ""],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseGradesSheet({} as XLSX.WorkSheet);

    expect(result).toHaveLength(2);
    expect(result[0]?.number).toBe(1);
    expect(result[0]?.name).toBe("Jan Kowalski");
    expect(result[0]?.behavior).toBe("exemplary");
    expect(result[0]?.grades).toEqual([
      { subject: "Matematyka", value: "5" },
      { subject: "Polski", value: "4" },
    ]);
    expect(result[1]?.behavior).toBe("veryGood");
    expect(result[1]?.grades[1]?.value).toBeNull(); // Empty cell
  });

  it("skips empty rows", () => {
    const sheetData = [
      ["Nr w dzienniku", "Uczeń", "Zachowanie", "Nazwa przedmiotu"],
      [null, null, null, "Matematyka"],
      [null, null, null, null],
      [1, "Jan Kowalski", "dobre", "5"],
      ["", "", "", ""],
      [2, "Anna Nowak", "dobre", "4"],
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
    // Vulcan format: [number, name, average]
    const sheetData = [
      ["Numer w dzienniku", "Dane ucznia", "Średnia"],
      [1, "Jan Kowalski", 4.5],
      [2, "Anna Nowak", 4.0],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseAveragesSheet({} as XLSX.WorkSheet);

    expect(result.get("Jan Kowalski")).toBe(4.5);
    expect(result.get("Anna Nowak")).toBe(4.0);
  });

  it("handles string numbers", () => {
    const sheetData = [
      ["Numer w dzienniku", "Dane ucznia", "Średnia"],
      [1, "Jan Kowalski", "4.5"],
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

describe("parseMetadataSheet", () => {
  it("parses class metadata correctly from Vulcan format", () => {
    // Real Vulcan format:
    // Row 0: Title with period info
    // Row 1: Horizontal form with Oddział and Wychowawca
    const sheetData = [
      ["Dodatkowe informacje dla 1 semestru w roku szkolnym 2024/2025"],
      ["Oddział", "3A", "Wychowawca", null, null, "Maria Wiśniewska"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseMetadataSheet({} as XLSX.WorkSheet);

    expect(result.className).toBe("3A");
    expect(result.period).toBe("2024/2025 - Semestr 1");
    expect(result.teacher).toBe("Maria Wiśniewska");
  });

  it("handles missing optional teacher field", () => {
    const sheetData = [
      ["Dodatkowe informacje dla 2 semestru w roku szkolnym 2024/2025"],
      ["Oddział", "3A"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    const result = parseMetadataSheet({} as XLSX.WorkSheet);

    expect(result.className).toBe("3A");
    expect(result.period).toBe("2024/2025 - Semestr 2");
    expect(result.teacher).toBeUndefined();
  });

  it("throws when className is missing", () => {
    const sheetData = [
      ["Dodatkowe informacje dla 1 semestru w roku szkolnym 2024/2025"],
      ["SomeOtherField", "value"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    expect(() => parseMetadataSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Dodatkowe informacje 1"
    );
  });

  it("throws when period is missing", () => {
    const sheetData = [
      ["Some title without period info"],
      ["Oddział", "3A"],
    ];

    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(sheetData);

    expect(() => parseMetadataSheet({} as XLSX.WorkSheet)).toThrow(
      "Invalid data structure in sheet: Dodatkowe informacje 1"
    );
  });
});

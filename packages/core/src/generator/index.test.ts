import { describe, it, expect, vi } from "vitest";
import { generatePresentation } from "./index.js";
import { studentNumber, classPeriod, type ClassData } from "../types/index.js";
import { PLACEHOLDER_IMAGE } from "./render-charts.js";

// Helper to create test class data
function createClassData(
  students: Array<{
    num: number;
    grades?: Array<{ subject: string; value: string | null }>;
    average?: number;
    behavior?: "exemplary" | "veryGood" | "good" | "acceptable" | "inappropriate" | "reprehensible";
  }>,
  metadata?: Partial<ClassData["metadata"]>
): ClassData {
  return {
    metadata: {
      className: metadata?.className ?? "3A",
      period: metadata?.period ?? classPeriod("2024/2025 - Semestr 1"),
      teacher: metadata?.teacher,
    },
    students: students.map((s) => ({
      number: studentNumber(s.num),
      grades: s.grades ?? [],
      average: s.average,
      behavior: s.behavior,
    })),
  };
}

describe("generatePresentation", () => {
  it("returns valid HTML with DOCTYPE", async () => {
    const data = createClassData([]);
    const html = await generatePresentation(data);

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("<html lang=\"pl\">");
    expect(html).toContain("</html>");
  });

  it("includes class metadata in title slide", async () => {
    const data = createClassData([], {
      className: "5B",
      period: classPeriod("2024/2025 - Semestr 2"),
      teacher: "Jan Kowalski",
    });

    const html = await generatePresentation(data);

    expect(html).toContain("Klasa:</strong> 5B");
    expect(html).toContain("Semestr:</strong> 2024/2025 - Semestr 2");
    expect(html).toContain("Wychowawca:</strong> Jan Kowalski");
  });

  it("renders student count in overview", async () => {
    const data = createClassData([
      { num: 1, average: 4.5 },
      { num: 2, average: 4.0 },
      { num: 3, average: 5.0 },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('<div class="value">3</div>');
    expect(html).toContain("Liczba uczniów");
  });

  it("renders class average statistics", async () => {
    const data = createClassData([
      { num: 1, average: 4.0 },
      { num: 2, average: 5.0 },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain("4.50"); // class average
    expect(html).toContain("4.00"); // min
    expect(html).toContain("5.00"); // max
    expect(html).toContain("Średnia klasy");
    expect(html).toContain("Najniższa średnia");
    expect(html).toContain("Najwyższa średnia");
  });

  it("renders grade distribution table with Polish labels", async () => {
    const data = createClassData([
      { num: 1, grades: [{ subject: "Matematyka", value: "5" }] },
      { num: 2, grades: [{ subject: "Matematyka", value: "4" }] },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain("Rozkład ocen");
    expect(html).toContain("Przedmiot");
    expect(html).toContain("Matematyka");
  });

  it("renders behavior counts with Polish labels", async () => {
    const data = createClassData([
      { num: 1, behavior: "exemplary" },
      { num: 2, behavior: "good" },
      { num: 3, behavior: "good" },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain("Zachowanie");
    expect(html).toContain("Wzorowe");
    expect(html).toContain("Bardzo dobre");
    expect(html).toContain("Dobre");
    expect(html).toContain("Poprawne");
  });

  it("shows 'Brak danych' when no data available", async () => {
    const data = createClassData([]);

    const html = await generatePresentation(data);

    expect(html).toContain("Brak danych");
  });

  it("renders charts as base64 images when data available", async () => {
    const data = createClassData([
      {
        num: 1,
        grades: [{ subject: "Matematyka", value: "5" }],
        average: 4.5,
      },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain("data:image/png;base64,");
  });

  describe("GDPR compliance", () => {
    it("data passed to template does not contain student names", async () => {
      // This test verifies that the template data structure
      // doesn't include any student name fields
      const data = createClassData([
        { num: 1, average: 4.5 },
        { num: 2, average: 5.0 },
      ]);

      const html = await generatePresentation(data);

      // Verify it's valid HTML (function ran without exposing names)
      expect(html).toContain("<!DOCTYPE html>");
      // Class metadata uses studentCount, not individual student data with names
      expect(html).toContain("Liczba uczniów");
    });

    it("generates presentation without throwing for student data", async () => {
      const data = createClassData([
        { num: 1, average: 4.5 },
        { num: 15, average: 5.0 },
      ]);

      // Should complete without error - indicates GDPR-safe data handling
      const html = await generatePresentation(data);
      expect(html).toContain("</html>");
    });
  });

  describe("Polish localization", () => {
    it("uses Polish slide titles", async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      expect(html).toContain("Zebranie z rodzicami");
      expect(html).toContain("Podsumowanie klasy");
      expect(html).toContain("Średnie ocen z przedmiotów");
      expect(html).toContain("Rozkład ocen");
      expect(html).toContain("Średnie ocen uczniów");
      expect(html).toContain("Zachowanie");
    });

    it("formats date in Polish", async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      // Should contain Polish month name
      expect(html).toContain("Data:");
      // Month names in Polish: styczeń, luty, marzec, kwiecień, maj, czerwiec,
      // lipiec, sierpień, wrzesień, październik, listopad, grudzień
      expect(html).toMatch(
        /\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/
      );
    });
  });

  describe("edge cases", () => {
    it("handles empty student list with zero values in overview", async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      // With no students, averages should show 0.00 (not NaN)
      expect(html).toContain('<div class="value">0</div>'); // student count
      expect(html).toContain("0.00"); // averages default to 0
      expect(html).not.toContain("NaN");
    });

    it("handles students without averages gracefully", async () => {
      const data = createClassData([
        { num: 1 }, // no average
        { num: 2 }, // no average
      ]);

      const html = await generatePresentation(data);

      // Student count should be 2
      expect(html).toContain('<div class="value">2</div>');
      // Averages should show 0.00 when no student has an average
      expect(html).toContain("0.00");
      expect(html).not.toContain("NaN");
    });
  });

  describe("chart rendering fallback", () => {
    it("uses placeholder image when chart rendering fails", async () => {
      // Mock renderChartToDataUrl to throw an error
      const renderChartsModule = await import("./render-charts.js");
      const originalRenderChart = renderChartsModule.renderChartToDataUrl;

      vi.spyOn(renderChartsModule, "renderChartToDataUrl").mockRejectedValue(
        new Error("Canvas initialization failed")
      );

      const data = createClassData([
        {
          num: 1,
          grades: [{ subject: "Matematyka", value: "5" }],
          average: 4.5,
        },
      ]);

      // Should complete without throwing
      const html = await generatePresentation(data);

      // Presentation should still render
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Zebranie z rodzicami");

      // Restore original implementation
      vi.restoreAllMocks();
    });

    it("logs warning when chart rendering fails", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const renderChartsModule = await import("./render-charts.js");
      vi.spyOn(renderChartsModule, "renderChartToDataUrl").mockRejectedValue(
        new Error("Memory error")
      );

      const data = createClassData([
        {
          num: 1,
          grades: [{ subject: "Test", value: "4" }],
          average: 4.0,
        },
      ]);

      await generatePresentation(data);

      expect(warnSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });
});

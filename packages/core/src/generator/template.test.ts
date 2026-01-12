import { describe, it, expect } from "vitest";
import { escapeHtml, safeDataUrl, renderPresentation, type PresentationData } from "./template.js";
import { studentNumber } from "../types/index.js";

function createTestPresentationData(
  overrides: Partial<PresentationData> = {}
): PresentationData {
  return {
    metadata: {
      className: "3A",
      period: "2024/2025 - Semestr 1",
    },
    generatedDate: "1 stycznia 2025",
    overview: {
      studentCount: 20,
      classAverage: "4.25",
      minAverage: "3.50",
      maxAverage: "5.50",
    },
    charts: {
      subjectAverages: null,
      studentAverages: null,
    },
    gradeDistribution: null,
    behaviorCounts: null,
    topStudents: null,
    attendanceStats: null,
    ...overrides,
  };
}

describe("escapeHtml", () => {
  it("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  it("escapes less than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater than", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('class="test"')).toBe("class=&quot;test&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("escapes multiple special characters together", () => {
    expect(escapeHtml('<a href="test">Tom & Jerry\'s</a>')).toBe(
      "&lt;a href=&quot;test&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;"
    );
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns unchanged string with no special characters", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles Polish characters unchanged", () => {
    expect(escapeHtml("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ")).toBe("ąćęłńóśźżĄĆĘŁŃÓŚŹŻ");
  });
});

describe("safeDataUrl", () => {
  it("returns valid PNG data URL unchanged", () => {
    const url = "data:image/png;base64,iVBORw0KGgo=";
    expect(safeDataUrl(url)).toBe(url);
  });

  it("returns null for null input", () => {
    expect(safeDataUrl(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(safeDataUrl("")).toBeNull();
  });

  it("rejects javascript: URL", () => {
    expect(safeDataUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data URL with wrong MIME type", () => {
    expect(safeDataUrl("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
  });

  it("rejects http URL", () => {
    expect(safeDataUrl("https://example.com/image.png")).toBeNull();
  });

  it("rejects data URL without base64 encoding", () => {
    expect(safeDataUrl("data:image/png,rawdata")).toBeNull();
  });
});

describe("renderPresentation - topStudents slide", () => {
  it("renders top students slide with Polish header", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(5), average: 5.25 },
        { number: studentNumber(12), average: 4.80 },
      ],
    });

    const html = renderPresentation(data);

    expect(html).toContain("Najwyższe średnie");
    expect(html).toContain("Średnia 4,75 i wyżej");
  });

  it("shows student count in subtitle", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(1), average: 5.00 },
        { number: studentNumber(2), average: 4.90 },
        { number: studentNumber(3), average: 4.80 },
      ],
    });

    const html = renderPresentation(data);

    expect(html).toContain("(3 uczniów)");
  });

  it("uses singular form for one student (Polish grammar)", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(1), average: 5.00 },
      ],
    });

    const html = renderPresentation(data);

    expect(html).toContain("(1 uczeń)");
    expect(html).not.toContain("(1 uczniów)");
  });

  it("displays student numbers only (GDPR)", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(7), average: 5.00 },
      ],
    });

    const html = renderPresentation(data);

    expect(html).toContain("Numer ucznia");
    expect(html).toContain("<td>7</td>");
    // Top students table should NOT have name-related columns
    const topStudentsSection = html.substring(
      html.indexOf("Najwyższe średnie"),
      html.indexOf("Zachowanie")
    );
    expect(topStudentsSection).not.toMatch(/<th[^>]*>.*(?:Imię|Nazwisko|Uczeń).*<\/th>/i);
  });

  it("formats averages with comma as decimal separator (Polish)", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(1), average: 5.25 },
      ],
    });

    const html = renderPresentation(data);

    expect(html).toContain("<td>5,25</td>");
  });

  it("skips slide when no top students", () => {
    const data = createTestPresentationData({
      topStudents: null,
    });

    const html = renderPresentation(data);

    expect(html).not.toContain("Najwyższe średnie");
  });

  it("skips slide when top students array is empty", () => {
    const data = createTestPresentationData({
      topStudents: [],
    });

    const html = renderPresentation(data);

    expect(html).not.toContain("Najwyższe średnie");
  });

  it("renders slide between student averages and behavior", () => {
    const data = createTestPresentationData({
      topStudents: [
        { number: studentNumber(1), average: 5.00 },
      ],
      behaviorCounts: {
        exemplary: 1,
        veryGood: 0,
        good: 0,
        acceptable: 0,
        inappropriate: 0,
        reprehensible: 0,
      },
    });

    const html = renderPresentation(data);

    const studentAveragesIndex = html.indexOf("Średnie ocen uczniów");
    const topStudentsIndex = html.indexOf("Najwyższe średnie");
    const behaviorIndex = html.indexOf("Zachowanie");

    expect(studentAveragesIndex).toBeLessThan(topStudentsIndex);
    expect(topStudentsIndex).toBeLessThan(behaviorIndex);
  });
});

describe("renderPresentation - attendance slide", () => {
  it("renders attendance slide with Polish labels", () => {
    const data = createTestPresentationData({
      attendanceStats: {
        averagePercentage: 92.5,
        totalPresent: 1850,
        totalAbsent: 100,
        totalExcused: 50,
        totalLate: 30,
        studentsBelow90: 3,
        studentsBelow80: 1,
      },
    });

    const html = renderPresentation(data);

    expect(html).toContain("Frekwencja");
    expect(html).toContain("Średnia frekwencja");
    expect(html).toContain("Obecności");
    expect(html).toContain("Nieobecności");
    expect(html).toContain("Spóźnienia");
  });

  it("formats percentage with comma as decimal separator (Polish)", () => {
    const data = createTestPresentationData({
      attendanceStats: {
        averagePercentage: 92.5,
        totalPresent: 1850,
        totalAbsent: 100,
        totalExcused: 50,
        totalLate: 30,
        studentsBelow90: 3,
        studentsBelow80: 1,
      },
    });

    const html = renderPresentation(data);

    expect(html).toContain("92,5%");
  });

  it("displays attendance values correctly", () => {
    const data = createTestPresentationData({
      attendanceStats: {
        averagePercentage: 95.0,
        totalPresent: 1000,
        totalAbsent: 50,
        totalExcused: 25,
        totalLate: 15,
        studentsBelow90: 2,
        studentsBelow80: 0,
      },
    });

    const html = renderPresentation(data);

    expect(html).toContain(">1000</div>");
    expect(html).toContain(">50</div>");
    expect(html).toContain(">15</div>");
  });

  it("skips slide when attendance data is null", () => {
    const data = createTestPresentationData({
      attendanceStats: null,
    });

    const html = renderPresentation(data);

    expect(html).not.toContain("Frekwencja");
  });

  it("shows dash when no attendance data (guards against division by zero)", () => {
    const data = createTestPresentationData({
      attendanceStats: {
        averagePercentage: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalExcused: 0,
        totalLate: 0,
        studentsBelow90: 0,
        studentsBelow80: 0,
      },
    });

    const html = renderPresentation(data);

    // Should show "-" for percentage when no data
    expect(html).toContain(">-</div>");
  });

  it("renders slide between top students and behavior", () => {
    const data = createTestPresentationData({
      topStudents: [{ number: studentNumber(1), average: 5.0 }],
      attendanceStats: {
        averagePercentage: 90.0,
        totalPresent: 1000,
        totalAbsent: 100,
        totalExcused: 50,
        totalLate: 20,
        studentsBelow90: 2,
        studentsBelow80: 1,
      },
      behaviorCounts: {
        exemplary: 1,
        veryGood: 0,
        good: 0,
        acceptable: 0,
        inappropriate: 0,
        reprehensible: 0,
      },
    });

    const html = renderPresentation(data);

    const topStudentsIndex = html.indexOf("Najwyższe średnie");
    const attendanceIndex = html.indexOf("Frekwencja");
    const behaviorIndex = html.indexOf("Zachowanie");

    expect(topStudentsIndex).toBeLessThan(attendanceIndex);
    expect(attendanceIndex).toBeLessThan(behaviorIndex);
  });
});

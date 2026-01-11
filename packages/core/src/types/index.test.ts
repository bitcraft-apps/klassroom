import { describe, it, expect } from "vitest";
import {
  studentNumber,
  classPeriod,
  parseBehaviorGrade,
  behaviorToIndex,
  compareBehavior,
  calculateAttendancePercentage,
  stripStudentPII,
  BEHAVIOR_GRADES,
  type StudentNumber,
  type RawStudent,
} from "./index.js";

describe("studentNumber", () => {
  it("creates a StudentNumber from a valid positive integer", () => {
    const num = studentNumber(1);
    expect(num).toBe(1);
  });

  it("accepts typical class roster numbers", () => {
    expect(studentNumber(15)).toBe(15);
    expect(studentNumber(30)).toBe(30);
  });

  it("throws for zero", () => {
    expect(() => studentNumber(0)).toThrow("Invalid student number: 0");
  });

  it("throws for negative numbers", () => {
    expect(() => studentNumber(-1)).toThrow("Invalid student number: -1");
    expect(() => studentNumber(-100)).toThrow("Invalid student number: -100");
  });

  it("throws for floating point numbers", () => {
    expect(() => studentNumber(1.5)).toThrow("Invalid student number: 1.5");
    expect(() => studentNumber(3.14)).toThrow("Invalid student number: 3.14");
  });

  it("throws for NaN", () => {
    expect(() => studentNumber(NaN)).toThrow("Invalid student number: NaN");
  });

  it("throws for Infinity", () => {
    expect(() => studentNumber(Infinity)).toThrow(
      "Invalid student number: Infinity"
    );
  });
});

describe("classPeriod", () => {
  it("creates a ClassPeriod from a valid string", () => {
    const period = classPeriod("2024/2025 - Semestr 1");
    expect(period).toBe("2024/2025 - Semestr 1");
  });

  it("accepts various period formats", () => {
    expect(classPeriod("2023/2024")).toBe("2023/2024");
    expect(classPeriod("Semester 2")).toBe("Semester 2");
  });

  it("throws for empty string", () => {
    expect(() => classPeriod("")).toThrow(
      "Invalid class period: must be a non-empty string"
    );
  });

  it("throws for whitespace-only string", () => {
    expect(() => classPeriod("   ")).toThrow(
      "Invalid class period: must be a non-empty string"
    );
    expect(() => classPeriod("\t\n")).toThrow(
      "Invalid class period: must be a non-empty string"
    );
  });
});

describe("parseBehaviorGrade", () => {
  it("parses lowercase Polish grades", () => {
    expect(parseBehaviorGrade("wzorowe")).toBe("exemplary");
    expect(parseBehaviorGrade("bardzo dobre")).toBe("veryGood");
    expect(parseBehaviorGrade("dobre")).toBe("good");
    expect(parseBehaviorGrade("poprawne")).toBe("acceptable");
    expect(parseBehaviorGrade("nieodpowiednie")).toBe("inappropriate");
    expect(parseBehaviorGrade("naganne")).toBe("reprehensible");
  });

  it("handles mixed case input", () => {
    expect(parseBehaviorGrade("Wzorowe")).toBe("exemplary");
    expect(parseBehaviorGrade("WZOROWE")).toBe("exemplary");
    expect(parseBehaviorGrade("Bardzo Dobre")).toBe("veryGood");
    expect(parseBehaviorGrade("BARDZO DOBRE")).toBe("veryGood");
  });

  it("trims whitespace", () => {
    expect(parseBehaviorGrade("  wzorowe  ")).toBe("exemplary");
    expect(parseBehaviorGrade("\twzorowe\n")).toBe("exemplary");
  });

  it("returns undefined for unrecognized values", () => {
    expect(parseBehaviorGrade("invalid")).toBeUndefined();
    expect(parseBehaviorGrade("excellent")).toBeUndefined();
    expect(parseBehaviorGrade("")).toBeUndefined();
  });
});

describe("behaviorToIndex", () => {
  it("returns correct indices for all grades (best=0, worst=5)", () => {
    expect(behaviorToIndex("exemplary")).toBe(0);
    expect(behaviorToIndex("veryGood")).toBe(1);
    expect(behaviorToIndex("good")).toBe(2);
    expect(behaviorToIndex("acceptable")).toBe(3);
    expect(behaviorToIndex("inappropriate")).toBe(4);
    expect(behaviorToIndex("reprehensible")).toBe(5);
  });

  it("returns indices matching BEHAVIOR_GRADES array positions", () => {
    BEHAVIOR_GRADES.forEach((grade, index) => {
      expect(behaviorToIndex(grade)).toBe(index);
    });
  });
});

describe("compareBehavior", () => {
  it("returns negative when first grade is better", () => {
    expect(compareBehavior("exemplary", "good")).toBeLessThan(0);
    expect(compareBehavior("veryGood", "acceptable")).toBeLessThan(0);
  });

  it("returns positive when first grade is worse", () => {
    expect(compareBehavior("good", "exemplary")).toBeGreaterThan(0);
    expect(compareBehavior("reprehensible", "exemplary")).toBeGreaterThan(0);
  });

  it("returns zero when grades are equal", () => {
    expect(compareBehavior("good", "good")).toBe(0);
    expect(compareBehavior("exemplary", "exemplary")).toBe(0);
  });

  it("can be used for sorting (ascending = best to worst)", () => {
    const grades = ["good", "exemplary", "acceptable", "veryGood"] as const;
    const sorted = [...grades].sort(compareBehavior);
    expect(sorted).toEqual(["exemplary", "veryGood", "good", "acceptable"]);
  });
});

describe("calculateAttendancePercentage", () => {
  it("calculates correct percentage for typical attendance", () => {
    const result = calculateAttendancePercentage({
      present: 90,
      absent: 5,
      excused: 5,
    });
    expect(result).toBe(90);
  });

  it("calculates 100% for perfect attendance", () => {
    const result = calculateAttendancePercentage({
      present: 100,
      absent: 0,
      excused: 0,
    });
    expect(result).toBe(100);
  });

  it("calculates 0% when always absent", () => {
    const result = calculateAttendancePercentage({
      present: 0,
      absent: 50,
      excused: 50,
    });
    expect(result).toBe(0);
  });

  it("returns null when no attendance data (all zeros)", () => {
    const result = calculateAttendancePercentage({
      present: 0,
      absent: 0,
      excused: 0,
    });
    expect(result).toBeNull();
  });

  it("handles fractional percentages", () => {
    const result = calculateAttendancePercentage({
      present: 1,
      absent: 1,
      excused: 1,
    });
    expect(result).toBeCloseTo(33.33, 1);
  });

  it("does not include late in calculation", () => {
    // Late students are still present, so late doesn't affect percentage
    const withLate = calculateAttendancePercentage({
      present: 90,
      absent: 10,
      excused: 0,
    });
    expect(withLate).toBe(90);
  });
});

describe("stripStudentPII", () => {
  it("removes the name field from RawStudent", () => {
    const raw: RawStudent = {
      number: studentNumber(5),
      name: "Jan Kowalski",
      grades: [{ subject: "Math", value: "5" }],
      average: 4.5,
      behavior: "good",
    };

    const student = stripStudentPII(raw);

    expect(student).not.toHaveProperty("name");
    expect(student.number).toBe(5);
    expect(student.grades).toEqual([{ subject: "Math", value: "5" }]);
    expect(student.average).toBe(4.5);
    expect(student.behavior).toBe("good");
  });

  it("preserves all other fields including optional ones", () => {
    const raw: RawStudent = {
      number: studentNumber(1),
      name: "Anna Nowak",
      grades: [],
      attendance: {
        present: 100,
        absent: 5,
        excused: 3,
        late: 2,
        percentage: 92.5,
      },
    };

    const student = stripStudentPII(raw);

    expect(student.attendance).toEqual({
      present: 100,
      absent: 5,
      excused: 3,
      late: 2,
      percentage: 92.5,
    });
  });

  it("handles minimal RawStudent", () => {
    const raw: RawStudent = {
      number: studentNumber(10),
      name: "Test Student",
      grades: [],
    };

    const student = stripStudentPII(raw);

    expect(student).toEqual({
      number: 10 as StudentNumber,
      grades: [],
    });
  });
});

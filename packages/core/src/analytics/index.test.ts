import { describe, it, expect } from "vitest";
import {
  countGradesByType,
  countGradesBySubject,
  calculateClassAverage,
  calculateMinMaxAverage,
  calculateSubjectAverages,
  getTopStudents,
  countStudentsByAverageRange,
  countBehaviorGrades,
  countStudentsBySubject,
  getOptionalSubjects,
} from "./index.js";
import { studentNumber, type Student } from "../types/index.js";

// Helper to create test students
function createStudent(
  num: number,
  grades: Array<{ subject: string; value: string | null }>,
  options?: {
    average?: number;
    behavior?: Student["behavior"];
    attendance?: Student["attendance"];
  }
): Student {
  return {
    number: studentNumber(num),
    grades,
    average: options?.average,
    behavior: options?.behavior,
    attendance: options?.attendance,
  };
}

describe("countGradesByType", () => {
  it("counts numeric grades correctly", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "4" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "3" },
      ]),
    ];

    const counts = countGradesByType(students);

    expect(counts[5]).toBe(2);
    expect(counts[4]).toBe(1);
    expect(counts[3]).toBe(1);
    expect(counts[1]).toBe(0);
  });

  it("handles grade modifiers like 4+ and 5-", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "4+" },
        { subject: "Polish", value: "5-" },
      ]),
    ];

    const counts = countGradesByType(students);

    expect(counts[4]).toBe(1);
    expect(counts[5]).toBe(1);
  });

  it("excludes non-numeric grades", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "PE", value: "zwolniony" },
        { subject: "Art", value: null },
        { subject: "Music", value: "" },
      ]),
    ];

    const counts = countGradesByType(students);

    expect(counts[5]).toBe(1);
    expect(counts[1]).toBe(0);
  });

  it("returns zero counts for empty student array", () => {
    const counts = countGradesByType([]);

    expect(counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });
});

describe("countGradesBySubject", () => {
  it("counts grades per subject correctly", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "4" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "4" },
        { subject: "Polish", value: "4" },
      ]),
    ];

    const bySubject = countGradesBySubject(students);

    expect(bySubject.get("Math")).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 0 });
    expect(bySubject.get("Polish")).toEqual({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 0, 6: 0 });
  });

  it("returns empty map for empty student array", () => {
    const bySubject = countGradesBySubject([]);

    expect(bySubject.size).toBe(0);
  });

  it("excludes non-numeric grades from counts", () => {
    const students = [
      createStudent(1, [
        { subject: "PE", value: "zwolniony" },
        { subject: "PE", value: "5" },
      ]),
    ];

    const bySubject = countGradesBySubject(students);

    expect(bySubject.get("PE")).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 0 });
  });
});

describe("calculateClassAverage", () => {
  it("calculates average of student averages", () => {
    const students = [
      createStudent(1, [], { average: 4.5 }),
      createStudent(2, [], { average: 5.0 }),
      createStudent(3, [], { average: 4.0 }),
    ];

    const avg = calculateClassAverage(students);

    expect(avg).toBe(4.5);
  });

  it("excludes students without average", () => {
    const students = [
      createStudent(1, [], { average: 4.0 }),
      createStudent(2, []),
      createStudent(3, [], { average: 5.0 }),
    ];

    const avg = calculateClassAverage(students);

    expect(avg).toBe(4.5);
  });

  it("returns 0 for empty student array", () => {
    const avg = calculateClassAverage([]);

    expect(avg).toBe(0);
  });

  it("returns 0 when no students have averages", () => {
    const students = [createStudent(1, []), createStudent(2, [])];

    const avg = calculateClassAverage(students);

    expect(avg).toBe(0);
  });
});

describe("calculateMinMaxAverage", () => {
  it("calculates min, max, and avg correctly", () => {
    const students = [
      createStudent(1, [], { average: 3.5 }),
      createStudent(2, [], { average: 5.5 }),
      createStudent(3, [], { average: 4.0 }),
    ];

    const result = calculateMinMaxAverage(students);

    expect(result.min).toBe(3.5);
    expect(result.max).toBe(5.5);
    expect(result.avg).toBeCloseTo(4.33, 1);
  });

  it("returns all zeros for empty student array", () => {
    const result = calculateMinMaxAverage([]);

    expect(result).toEqual({ min: 0, max: 0, avg: 0 });
  });

  it("handles single student", () => {
    const students = [createStudent(1, [], { average: 4.5 })];

    const result = calculateMinMaxAverage(students);

    expect(result).toEqual({ min: 4.5, max: 4.5, avg: 4.5 });
  });
});

describe("calculateSubjectAverages", () => {
  it("calculates average for each subject", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "4" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "3" },
        { subject: "Polish", value: "4" },
      ]),
    ];

    const subjectAvgs = calculateSubjectAverages(students);

    expect(subjectAvgs.get("Math")).toBe(4);
    expect(subjectAvgs.get("Polish")).toBe(4);
  });

  it("returns empty map for empty student array", () => {
    const subjectAvgs = calculateSubjectAverages([]);

    expect(subjectAvgs.size).toBe(0);
  });

  it("excludes non-numeric grades from calculation", () => {
    const students = [
      createStudent(1, [
        { subject: "PE", value: "zwolniony" },
        { subject: "PE", value: "5" },
      ]),
    ];

    const subjectAvgs = calculateSubjectAverages(students);

    expect(subjectAvgs.get("PE")).toBe(5);
  });
});

describe("getTopStudents", () => {
  it("returns students with average >= 4.75 by default", () => {
    const students = [
      createStudent(1, [], { average: 5.0 }),
      createStudent(2, [], { average: 4.5 }),
      createStudent(3, [], { average: 4.75 }),
    ];

    const top = getTopStudents(students);

    expect(top).toHaveLength(2);
    expect(top.map((s) => s.number)).toContain(1);
    expect(top.map((s) => s.number)).toContain(3);
  });

  it("accepts custom threshold", () => {
    const students = [
      createStudent(1, [], { average: 5.0 }),
      createStudent(2, [], { average: 4.5 }),
      createStudent(3, [], { average: 4.0 }),
    ];

    const top = getTopStudents(students, 4.5);

    expect(top).toHaveLength(2);
    expect(top.map((s) => s.number)).toContain(1);
    expect(top.map((s) => s.number)).toContain(2);
  });

  it("returns empty array for empty student array", () => {
    const top = getTopStudents([]);

    expect(top).toEqual([]);
  });

  it("excludes students without average", () => {
    const students = [createStudent(1, []), createStudent(2, [], { average: 5.0 })];

    const top = getTopStudents(students);

    expect(top).toHaveLength(1);
    expect(top[0].number).toBe(2);
  });
});

describe("countStudentsByAverageRange", () => {
  it("counts students in each range correctly", () => {
    const students = [
      createStudent(1, [], { average: 5.0 }), // honors
      createStudent(2, [], { average: 4.75 }), // honors (boundary)
      createStudent(3, [], { average: 4.5 }), // good
      createStudent(4, [], { average: 4.0 }), // good (boundary)
      createStudent(5, [], { average: 3.8 }), // satisfactory
      createStudent(6, [], { average: 3.5 }), // satisfactory (boundary)
    ];

    const counts = countStudentsByAverageRange(students);

    expect(counts.honors).toBe(2);
    expect(counts.good).toBe(2);
    expect(counts.satisfactory).toBe(2);
  });

  it("excludes students below 3.5", () => {
    const students = [
      createStudent(1, [], { average: 3.4 }),
      createStudent(2, [], { average: 2.5 }),
    ];

    const counts = countStudentsByAverageRange(students);

    expect(counts).toEqual({ satisfactory: 0, good: 0, honors: 0 });
  });

  it("returns zero counts for empty student array", () => {
    const counts = countStudentsByAverageRange([]);

    expect(counts).toEqual({ satisfactory: 0, good: 0, honors: 0 });
  });

  it("excludes students without average", () => {
    const students = [createStudent(1, []), createStudent(2, [], { average: 5.0 })];

    const counts = countStudentsByAverageRange(students);

    expect(counts.honors).toBe(1);
    expect(counts.good).toBe(0);
    expect(counts.satisfactory).toBe(0);
  });
});

describe("countBehaviorGrades", () => {
  it("counts behavior grades correctly", () => {
    const students = [
      createStudent(1, [], { behavior: "exemplary" }),
      createStudent(2, [], { behavior: "exemplary" }),
      createStudent(3, [], { behavior: "good" }),
      createStudent(4, [], { behavior: "acceptable" }),
    ];

    const counts = countBehaviorGrades(students);

    expect(counts.exemplary).toBe(2);
    expect(counts.good).toBe(1);
    expect(counts.acceptable).toBe(1);
    expect(counts.veryGood).toBe(0);
  });

  it("returns zero counts for empty student array", () => {
    const counts = countBehaviorGrades([]);

    expect(counts).toEqual({
      exemplary: 0,
      veryGood: 0,
      good: 0,
      acceptable: 0,
      inappropriate: 0,
      reprehensible: 0,
    });
  });

  it("excludes students without behavior grade", () => {
    const students = [
      createStudent(1, []),
      createStudent(2, [], { behavior: "good" }),
    ];

    const counts = countBehaviorGrades(students);

    expect(counts.good).toBe(1);
    expect(counts.exemplary).toBe(0);
  });
});

describe("countStudentsBySubject", () => {
  it("counts enrolled students per subject", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "4" },
        { subject: "Health Ed", value: "5" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "4" },
        { subject: "Polish", value: "3" },
        { subject: "Health Ed", value: null },
      ]),
      createStudent(3, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "5" },
        { subject: "Health Ed", value: "zwolniony" },
      ]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("Math")).toBe(3);
    expect(counts.get("Polish")).toBe(3);
    expect(counts.get("Health Ed")).toBe(1);
  });

  it("returns empty map for empty student array", () => {
    const counts = countStudentsBySubject([]);

    expect(counts.size).toBe(0);
  });

  it("does not count null grades as enrolled", () => {
    const students = [
      createStudent(1, [{ subject: "Art", value: null }]),
      createStudent(2, [{ subject: "Art", value: "5" }]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("Art")).toBe(1);
  });

  it("does not count empty string grades as enrolled", () => {
    const students = [
      createStudent(1, [{ subject: "Music", value: "" }]),
      createStudent(2, [{ subject: "Music", value: "4" }]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("Music")).toBe(1);
  });

  it("does not count 'zwolniony' as enrolled", () => {
    const students = [
      createStudent(1, [{ subject: "PE", value: "zwolniony" }]),
      createStudent(2, [{ subject: "PE", value: "5" }]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("PE")).toBe(1);
  });

  it("counts 'nieklasyfikowany' as enrolled", () => {
    const students = [
      createStudent(1, [{ subject: "Math", value: "nieklasyfikowany" }]),
      createStudent(2, [{ subject: "Math", value: "5" }]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("Math")).toBe(2);
  });

  it("counts 'brak oceny' as enrolled", () => {
    const students = [
      createStudent(1, [{ subject: "Math", value: "brak oceny" }]),
      createStudent(2, [{ subject: "Math", value: "4" }]),
    ];

    const counts = countStudentsBySubject(students);

    expect(counts.get("Math")).toBe(2);
  });
});

describe("getOptionalSubjects", () => {
  it("returns subjects with fewer students than class size", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Health Ed", value: "5" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "4" },
        { subject: "Health Ed", value: null },
      ]),
      createStudent(3, [
        { subject: "Math", value: "5" },
        { subject: "Health Ed", value: "zwolniony" },
      ]),
    ];

    const optional = getOptionalSubjects(students);

    expect(optional).toEqual(["Health Ed"]);
  });

  it("returns empty array when all subjects have full enrollment", () => {
    const students = [
      createStudent(1, [
        { subject: "Math", value: "5" },
        { subject: "Polish", value: "4" },
      ]),
      createStudent(2, [
        { subject: "Math", value: "4" },
        { subject: "Polish", value: "3" },
      ]),
    ];

    const optional = getOptionalSubjects(students);

    expect(optional).toEqual([]);
  });

  it("returns empty array for empty student array", () => {
    const optional = getOptionalSubjects([]);

    expect(optional).toEqual([]);
  });

  it("returns results sorted alphabetically", () => {
    const students = [
      createStudent(1, [
        { subject: "Religia", value: "5" },
        { subject: "Etyka", value: null },
        { subject: "Math", value: "5" },
      ]),
      createStudent(2, [
        { subject: "Religia", value: null },
        { subject: "Etyka", value: "5" },
        { subject: "Math", value: "4" },
      ]),
    ];

    const optional = getOptionalSubjects(students);

    expect(optional).toEqual(["Etyka", "Religia"]);
  });

  it("handles case-insensitive 'zwolniony' variations", () => {
    const students = [
      createStudent(1, [{ subject: "PE", value: "Zwolniony" }]),
      createStudent(2, [{ subject: "PE", value: "ZWOLNIONY" }]),
      createStudent(3, [{ subject: "PE", value: "5" }]),
    ];

    const optional = getOptionalSubjects(students);

    expect(optional).toEqual(["PE"]);
  });
});

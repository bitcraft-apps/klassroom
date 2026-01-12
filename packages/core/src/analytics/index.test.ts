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
  calculateClassAttendance,
  getStudentsWithLowAttendance,
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

describe("calculateClassAttendance", () => {
  it("calculates class attendance statistics correctly", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 90, absent: 5, excused: 5, late: 2 },
      }),
      createStudent(2, [], {
        attendance: { present: 80, absent: 10, excused: 10, late: 5 },
      }),
    ];

    const stats = calculateClassAttendance(students);

    expect(stats.totalPresent).toBe(170);
    expect(stats.totalAbsent).toBe(15);
    expect(stats.totalExcused).toBe(15);
    expect(stats.totalLate).toBe(7);
    expect(stats.averagePercentage).toBe(85); // (90% + 80%) / 2 = 85%
  });

  it("returns all zeros for empty student array", () => {
    const stats = calculateClassAttendance([]);

    expect(stats).toEqual({
      averagePercentage: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalExcused: 0,
      totalLate: 0,
      studentsBelow90: 0,
      studentsBelow80: 0,
    });
  });

  it("excludes students without attendance from percentage average", () => {
    const students = [
      createStudent(1, []),
      createStudent(2, [], {
        attendance: { present: 100, absent: 0, excused: 0, late: 0 },
      }),
    ];

    const stats = calculateClassAttendance(students);

    expect(stats.averagePercentage).toBe(100);
    expect(stats.totalPresent).toBe(100);
  });

  it("counts students below 90% and 80% correctly", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 95, absent: 5, excused: 0, late: 0 },
      }), // 95%
      createStudent(2, [], {
        attendance: { present: 85, absent: 15, excused: 0, late: 0 },
      }), // 85%
      createStudent(3, [], {
        attendance: { present: 75, absent: 25, excused: 0, late: 0 },
      }), // 75%
    ];

    const stats = calculateClassAttendance(students);

    expect(stats.studentsBelow90).toBe(2); // students 2 and 3
    expect(stats.studentsBelow80).toBe(1); // student 3 only
  });

  it("handles students with all 100% attendance", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 100, absent: 0, excused: 0, late: 5 },
      }),
      createStudent(2, [], {
        attendance: { present: 100, absent: 0, excused: 0, late: 3 },
      }),
    ];

    const stats = calculateClassAttendance(students);

    expect(stats.studentsBelow90).toBe(0);
    expect(stats.studentsBelow80).toBe(0);
    expect(stats.averagePercentage).toBe(100);
  });

  it("handles students with zero attendance data", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 0, absent: 0, excused: 0, late: 0 },
      }),
    ];

    const stats = calculateClassAttendance(students);

    expect(stats.averagePercentage).toBe(0);
    expect(stats.totalPresent).toBe(0);
  });
});

describe("getStudentsWithLowAttendance", () => {
  it("returns students below default 90% threshold", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 95, absent: 5, excused: 0, late: 0 },
      }), // 95%
      createStudent(2, [], {
        attendance: { present: 85, absent: 15, excused: 0, late: 0 },
      }), // 85%
      createStudent(3, [], {
        attendance: { present: 80, absent: 20, excused: 0, late: 0 },
      }), // 80%
    ];

    const lowAttendance = getStudentsWithLowAttendance(students);

    expect(lowAttendance).toHaveLength(2);
    expect(lowAttendance.map((s) => s.number)).toContain(2);
    expect(lowAttendance.map((s) => s.number)).toContain(3);
  });

  it("accepts custom threshold", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 95, absent: 5, excused: 0, late: 0 },
      }), // 95%
      createStudent(2, [], {
        attendance: { present: 85, absent: 15, excused: 0, late: 0 },
      }), // 85%
    ];

    const lowAttendance = getStudentsWithLowAttendance(students, 96);

    expect(lowAttendance).toHaveLength(2);
  });

  it("returns empty array for empty student array", () => {
    const lowAttendance = getStudentsWithLowAttendance([]);

    expect(lowAttendance).toEqual([]);
  });

  it("excludes students without attendance data", () => {
    const students = [
      createStudent(1, []),
      createStudent(2, [], {
        attendance: { present: 85, absent: 15, excused: 0, late: 0 },
      }),
    ];

    const lowAttendance = getStudentsWithLowAttendance(students);

    expect(lowAttendance).toHaveLength(1);
    expect(lowAttendance[0].number).toBe(2);
  });

  it("excludes students with zero attendance data", () => {
    const students = [
      createStudent(1, [], {
        attendance: { present: 0, absent: 0, excused: 0, late: 0 },
      }),
    ];

    const lowAttendance = getStudentsWithLowAttendance(students);

    expect(lowAttendance).toEqual([]);
  });
});

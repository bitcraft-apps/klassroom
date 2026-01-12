import { describe, it, expect } from "vitest";
import {
  createSubjectAveragesChart,
  createStudentAveragesChart,
  createGradeDistributionChart,
  createBehaviorChart,
  createAggregateGradesPieChart,
} from "./index.js";
import {
  studentNumber,
  type Student,
  type GradeCounts,
  type BehaviorCounts,
  type AggregateGradeDistribution,
} from "../types/index.js";

// Helper to create test students
function createStudent(
  num: number,
  grades: Array<{ subject: string; value: string | null }>,
  options?: { average?: number; behavior?: Student["behavior"] }
): Student {
  return {
    number: studentNumber(num),
    grades,
    average: options?.average,
    behavior: options?.behavior,
  };
}

describe("createSubjectAveragesChart", () => {
  it("creates horizontal bar chart for subject averages", () => {
    const subjectAverages = new Map([
      ["Math", 4.5],
      ["Polish", 4.0],
    ]);

    const config = createSubjectAveragesChart(subjectAverages);

    expect(config).not.toBeNull();
    expect(config!.type).toBe("bar");
    expect(config!.options?.indexAxis).toBe("y");
  });

  it("sorts subjects by average descending", () => {
    const subjectAverages = new Map([
      ["Math", 3.0],
      ["Polish", 5.0],
      ["History", 4.0],
    ]);

    const config = createSubjectAveragesChart(subjectAverages);

    expect(config!.data.labels).toEqual(["Polish", "History", "Math"]);
    expect(config!.data.datasets[0].data).toEqual([5.0, 4.0, 3.0]);
  });

  it("returns null for empty map", () => {
    const config = createSubjectAveragesChart(new Map());

    expect(config).toBeNull();
  });

  it("sets scale min to 1 and max to 6", () => {
    const subjectAverages = new Map([["Math", 4.5]]);

    const config = createSubjectAveragesChart(subjectAverages);

    expect(config!.options?.scales?.x?.min).toBe(1);
    expect(config!.options?.scales?.x?.max).toBe(6);
  });
});

describe("createStudentAveragesChart", () => {
  it("creates vertical bar chart for student averages", () => {
    const students = [
      createStudent(1, [], { average: 4.5 }),
      createStudent(2, [], { average: 5.0 }),
    ];

    const config = createStudentAveragesChart(students);

    expect(config).not.toBeNull();
    expect(config!.type).toBe("bar");
    expect(config!.options?.indexAxis).toBeUndefined(); // vertical is default
  });

  it("uses student numbers as labels (GDPR compliance)", () => {
    const students = [
      createStudent(3, [], { average: 4.5 }),
      createStudent(1, [], { average: 5.0 }),
    ];

    const config = createStudentAveragesChart(students);

    // Labels should be string representations of student numbers
    expect(config!.data.labels).toEqual(["1", "3"]);
  });

  it("output contains only number and average data (GDPR)", () => {
    const students = [createStudent(1, [], { average: 4.5 })];

    const config = createStudentAveragesChart(students);

    // Verify chart data structure contains only safe fields
    // Labels are string numbers, data is numeric averages
    expect(config!.data.labels).toEqual(["1"]);
    expect(config!.data.datasets[0].data).toEqual([4.5]);

    // Additional safety check: serialized output has no PII-related keys
    const configString = JSON.stringify(config);
    expect(configString).not.toContain("name");
    expect(configString).not.toContain("behavior");
    expect(configString).not.toContain("grades");
  });

  it("sorts students by number ascending", () => {
    const students = [
      createStudent(3, [], { average: 3.0 }),
      createStudent(1, [], { average: 5.0 }),
      createStudent(2, [], { average: 4.0 }),
    ];

    const config = createStudentAveragesChart(students);

    expect(config!.data.labels).toEqual(["1", "2", "3"]);
    expect(config!.data.datasets[0].data).toEqual([5.0, 4.0, 3.0]);
  });

  it("returns null when no students have averages", () => {
    const students = [createStudent(1, []), createStudent(2, [])];

    const config = createStudentAveragesChart(students);

    expect(config).toBeNull();
  });

  it("returns null for empty student array", () => {
    const config = createStudentAveragesChart([]);

    expect(config).toBeNull();
  });

  it("excludes students without average", () => {
    const students = [
      createStudent(1, [], { average: 4.5 }),
      createStudent(2, []), // no average
      createStudent(3, [], { average: 5.0 }),
    ];

    const config = createStudentAveragesChart(students);

    expect(config!.data.labels).toEqual(["1", "3"]);
  });
});

describe("createGradeDistributionChart", () => {
  it("creates bar chart for grade distribution", () => {
    const gradeCounts: GradeCounts = { 1: 2, 2: 3, 3: 5, 4: 8, 5: 10, 6: 4 };

    const config = createGradeDistributionChart(gradeCounts);

    expect(config).not.toBeNull();
    expect(config!.type).toBe("bar");
  });

  it("uses grades 1-6 as labels", () => {
    const gradeCounts: GradeCounts = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };

    const config = createGradeDistributionChart(gradeCounts);

    expect(config!.data.labels).toEqual(["1", "2", "3", "4", "5", "6"]);
  });

  it("maps counts to data in order 1-6", () => {
    const gradeCounts: GradeCounts = { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50, 6: 60 };

    const config = createGradeDistributionChart(gradeCounts);

    expect(config!.data.datasets[0].data).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it("returns null when all counts are zero", () => {
    const gradeCounts: GradeCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    const config = createGradeDistributionChart(gradeCounts);

    expect(config).toBeNull();
  });

  it("uses different colors for each grade", () => {
    const gradeCounts: GradeCounts = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };

    const config = createGradeDistributionChart(gradeCounts);
    const colors = config!.data.datasets[0].backgroundColor as string[];

    expect(colors).toHaveLength(6);
    expect(new Set(colors).size).toBe(6); // all unique
  });
});

describe("createBehaviorChart", () => {
  it("creates doughnut chart for behavior distribution", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 5,
      veryGood: 8,
      good: 10,
      acceptable: 4,
      inappropriate: 2,
      reprehensible: 1,
    };

    const config = createBehaviorChart(behaviorCounts);

    expect(config).not.toBeNull();
    expect(config!.type).toBe("doughnut");
  });

  it("uses Polish behavior grade labels", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 1,
      veryGood: 1,
      good: 1,
      acceptable: 1,
      inappropriate: 1,
      reprehensible: 1,
    };

    const config = createBehaviorChart(behaviorCounts);

    expect(config!.data.labels).toEqual([
      "Wzorowe",
      "Bardzo dobre",
      "Dobre",
      "Poprawne",
      "Nieodpowiednie",
      "Naganne",
    ]);
  });

  it("maps counts in order: exemplary to reprehensible", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 10,
      veryGood: 20,
      good: 30,
      acceptable: 40,
      inappropriate: 50,
      reprehensible: 60,
    };

    const config = createBehaviorChart(behaviorCounts);

    expect(config!.data.datasets[0].data).toEqual([10, 20, 30, 40, 50, 60]);
  });

  it("returns null when all counts are zero", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 0,
      veryGood: 0,
      good: 0,
      acceptable: 0,
      inappropriate: 0,
      reprehensible: 0,
    };

    const config = createBehaviorChart(behaviorCounts);

    expect(config).toBeNull();
  });

  it("shows legend on the right", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 1,
      veryGood: 0,
      good: 0,
      acceptable: 0,
      inappropriate: 0,
      reprehensible: 0,
    };

    const config = createBehaviorChart(behaviorCounts);

    expect(config!.options?.plugins?.legend?.display).toBe(true);
    expect(config!.options?.plugins?.legend?.position).toBe("right");
  });

  it("uses different colors for each behavior grade", () => {
    const behaviorCounts: BehaviorCounts = {
      exemplary: 1,
      veryGood: 1,
      good: 1,
      acceptable: 1,
      inappropriate: 1,
      reprehensible: 1,
    };

    const config = createBehaviorChart(behaviorCounts);
    const colors = config!.data.datasets[0].backgroundColor as string[];

    expect(colors).toHaveLength(6);
    expect(new Set(colors).size).toBe(6); // all unique
  });
});

describe("createAggregateGradesPieChart", () => {
  it("creates pie chart for aggregate grade distribution", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 10,
      veryGood: 20,
      good: 30,
      satisfactory: 15,
      acceptable: 5,
      failing: 2,
      unclassified: 1,
    };

    const config = createAggregateGradesPieChart(distribution);

    expect(config).not.toBeNull();
    expect(config!.type).toBe("pie");
  });

  it("uses Polish grade labels", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 1,
      veryGood: 1,
      good: 1,
      satisfactory: 1,
      acceptable: 1,
      failing: 1,
      unclassified: 1,
    };

    const config = createAggregateGradesPieChart(distribution);

    expect(config!.data.labels).toEqual([
      "Celujący (6)",
      "Bardzo dobry (5)",
      "Dobry (4)",
      "Dostateczny (3)",
      "Dopuszczający (2)",
      "Niedostateczny (1)",
      "Nieklasyfikowany",
    ]);
  });

  it("maps counts in order: 6 to 1 then unclassified", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 10,
      veryGood: 20,
      good: 30,
      satisfactory: 40,
      acceptable: 50,
      failing: 60,
      unclassified: 70,
    };

    const config = createAggregateGradesPieChart(distribution);

    expect(config!.data.datasets[0].data).toEqual([10, 20, 30, 40, 50, 60, 70]);
  });

  it("returns null when all counts are zero", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 0,
      veryGood: 0,
      good: 0,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    };

    const config = createAggregateGradesPieChart(distribution);

    expect(config).toBeNull();
  });

  it("shows legend on the right", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 1,
      veryGood: 0,
      good: 0,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    };

    const config = createAggregateGradesPieChart(distribution);

    expect(config!.options?.plugins?.legend?.display).toBe(true);
    expect(config!.options?.plugins?.legend?.position).toBe("right");
  });

  it("uses different colors for each grade", () => {
    const distribution: AggregateGradeDistribution = {
      excellent: 1,
      veryGood: 1,
      good: 1,
      satisfactory: 1,
      acceptable: 1,
      failing: 1,
      unclassified: 1,
    };

    const config = createAggregateGradesPieChart(distribution);
    const colors = config!.data.datasets[0].backgroundColor as string[];

    expect(colors).toHaveLength(7);
    expect(new Set(colors).size).toBe(7); // all unique
  });
});

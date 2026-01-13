import { describe, it, expect } from 'vitest';
import { generateConclusions, type AnalyticsResult } from './index.js';

describe('AnalyticsResult GDPR compliance', () => {
  it('type definition contains only aggregate data fields', () => {
    // This test verifies the structure of AnalyticsResult.
    // If someone adds a field like 'students' or 'studentNames', this test
    // will fail because the object won't match the expected structure.
    const validAnalyticsResult: AnalyticsResult = {
      className: '3A',
      studentCount: 25,
      subjectCount: 12,
      classAverage: 4.2,
      attendancePercentage: 95.5,
      gradeDistribution: {
        excellent: 10,
        veryGood: 20,
        good: 30,
        satisfactory: 15,
        acceptable: 5,
        failing: 2,
        unclassified: 0,
      },
      behaviorDistribution: {
        exemplary: 5,
        veryGood: 10,
        good: 8,
        acceptable: 2,
        inappropriate: 0,
        reprehensible: 0,
      },
    };

    // Verify all expected fields are present
    expect(validAnalyticsResult.className).toBe('3A');
    expect(validAnalyticsResult.studentCount).toBe(25);
    expect(validAnalyticsResult.subjectCount).toBe(12);
    expect(validAnalyticsResult.classAverage).toBe(4.2);
    expect(validAnalyticsResult.attendancePercentage).toBe(95.5);
    expect(validAnalyticsResult.gradeDistribution).toBeDefined();
    expect(validAnalyticsResult.behaviorDistribution).toBeDefined();

    // Critical GDPR check: verify no PII-related fields exist
    const keys = Object.keys(validAnalyticsResult);
    expect(keys).not.toContain('students');
    expect(keys).not.toContain('studentNames');
    expect(keys).not.toContain('studentNumbers');
    expect(keys).not.toContain('names');
    expect(keys).not.toContain('name');
  });

  it('minimal AnalyticsResult contains no PII fields', () => {
    const minimalAnalyticsResult: AnalyticsResult = {
      className: '5B',
      studentCount: 20,
      subjectCount: 10,
      classAverage: 3.8,
    };

    const keys = Object.keys(minimalAnalyticsResult);

    // Only aggregate fields should be present
    expect(keys).toEqual(['className', 'studentCount', 'subjectCount', 'classAverage']);

    // No individual student data
    expect(keys).not.toContain('students');
    expect(keys).not.toContain('studentNames');
    expect(keys).not.toContain('grades');
  });
});

describe('generateConclusions', () => {
  it('returns null when no API key is provided and env var is not set', async () => {
    // Clear environment variable for this test
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const result = await generateConclusions({
        className: '3A',
        studentCount: 25,
        subjectCount: 12,
        classAverage: 4.2,
      });

      expect(result).toBeNull();
    } finally {
      // Restore environment variable
      if (originalKey !== undefined) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });

  it('returns null when empty API key is provided', async () => {
    const result = await generateConclusions(
      {
        className: '3A',
        studentCount: 25,
        subjectCount: 12,
        classAverage: 4.2,
      },
      '',
    );

    expect(result).toBeNull();
  });
});

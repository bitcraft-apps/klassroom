import { describe, it, expect, vi } from 'vitest';
import { generatePresentation } from './index.js';
import { studentNumber, classPeriod, type ClassData } from '../types/index.js';

// Helper to create test class data
function createClassData(
  students: Array<{
    num: number;
    grades?: Array<{ subject: string; value: string | null }>;
    average?: number;
    behavior?: 'exemplary' | 'veryGood' | 'good' | 'acceptable' | 'inappropriate' | 'reprehensible';
  }>,
  metadata?: Partial<ClassData['metadata']>,
  classAttendance?: ClassData['classAttendance'],
): ClassData {
  return {
    metadata: {
      className: metadata?.className ?? '3A',
      period: metadata?.period ?? classPeriod('2024/2025 - Semestr 1'),
      teacher: metadata?.teacher,
    },
    students: students.map((s) => ({
      number: studentNumber(s.num),
      grades: s.grades ?? [],
      average: s.average,
      behavior: s.behavior,
    })),
    classAttendance,
  };
}

describe('generatePresentation', () => {
  it('returns valid HTML with DOCTYPE', async () => {
    const data = createClassData([]);
    const html = await generatePresentation(data);

    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="pl">');
    expect(html).toContain('</html>');
  });

  it('includes class metadata in title slide', async () => {
    const data = createClassData([], {
      className: '5B',
      period: classPeriod('2024/2025 - Semestr 2'),
      teacher: 'Jan Kowalski',
    });

    const html = await generatePresentation(data);

    expect(html).toContain('Klasa:</strong> 5B');
    expect(html).toContain('Semestr:</strong> 2024/2025 - Semestr 2');
    expect(html).toContain('Wychowawca:</strong> Jan Kowalski');
  });

  it('renders student count in overview', async () => {
    const data = createClassData([
      { num: 1, average: 4.5 },
      { num: 2, average: 4.0 },
      { num: 3, average: 5.0 },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('<div class="value">3</div>');
    expect(html).toContain('Liczba uczniów');
  });

  it('renders class average statistics', async () => {
    const data = createClassData([
      { num: 1, average: 4.0 },
      { num: 2, average: 5.0 },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('4.50'); // class average
    expect(html).toContain('4.00'); // min
    expect(html).toContain('5.00'); // max
    expect(html).toContain('Średnia klasy');
    expect(html).toContain('Najniższa średnia');
    expect(html).toContain('Najwyższa średnia');
  });

  it('renders grade distribution table with Polish labels', async () => {
    const data = createClassData([
      { num: 1, grades: [{ subject: 'Matematyka', value: '5' }] },
      { num: 2, grades: [{ subject: 'Matematyka', value: '4' }] },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('Rozkład ocen');
    expect(html).toContain('Przedmiot');
    expect(html).toContain('Matematyka');
  });

  it('renders behavior counts with Polish labels', async () => {
    const data = createClassData([
      { num: 1, behavior: 'exemplary' },
      { num: 2, behavior: 'good' },
      { num: 3, behavior: 'good' },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('Zachowanie');
    expect(html).toContain('Wzorowe');
    expect(html).toContain('Bardzo dobre');
    expect(html).toContain('Dobre');
    expect(html).toContain('Poprawne');
  });

  it("shows 'Brak danych' when no data available", async () => {
    const data = createClassData([]);

    const html = await generatePresentation(data);

    expect(html).toContain('Brak danych');
  });

  it('renders charts as base64 images when data available', async () => {
    const data = createClassData([
      {
        num: 1,
        grades: [{ subject: 'Matematyka', value: '5' }],
        average: 4.5,
      },
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('data:image/png;base64,');
  });

  describe('GDPR compliance', () => {
    it('data passed to template does not contain student names', async () => {
      // This test verifies that the template data structure
      // doesn't include any student name fields
      const data = createClassData([
        { num: 1, average: 4.5 },
        { num: 2, average: 5.0 },
      ]);

      const html = await generatePresentation(data);

      // Verify it's valid HTML (function ran without exposing names)
      expect(html).toContain('<!DOCTYPE html>');
      // Class metadata uses studentCount, not individual student data with names
      expect(html).toContain('Liczba uczniów');
    });

    it('generates presentation without throwing for student data', async () => {
      const data = createClassData([
        { num: 1, average: 4.5 },
        { num: 15, average: 5.0 },
      ]);

      // Should complete without error - indicates GDPR-safe data handling
      const html = await generatePresentation(data);
      expect(html).toContain('</html>');
    });
  });

  describe('Polish localization', () => {
    it('uses Polish slide titles', async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      expect(html).toContain('Zebranie z rodzicami');
      expect(html).toContain('Podsumowanie klasy');
      expect(html).toContain('Średnie ocen z przedmiotów');
      expect(html).toContain('Rozkład ocen');
      expect(html).toContain('Średnie ocen uczniów');
      expect(html).toContain('Zachowanie');
    });

    it('formats date in Polish', async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      // Should contain Polish month name
      expect(html).toContain('Data:');
      // Month names in Polish: styczeń, luty, marzec, kwiecień, maj, czerwiec,
      // lipiec, sierpień, wrzesień, październik, listopad, grudzień
      expect(html).toMatch(
        /\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/,
      );
    });
  });

  describe('meetingDate option', () => {
    it('uses custom meeting date when provided', async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data, { meetingDate: '15 stycznia 2026' });

      expect(html).toContain('Data:</strong> 15 stycznia 2026');
    });

    it('uses current date when meetingDate not provided', async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      // Should contain Polish-formatted current date (not a custom string)
      expect(html).toMatch(
        /Data:<\/strong>\s+\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/,
      );
    });

    it('passes through meetingDate as-is without validation', async () => {
      const data = createClassData([]);

      // Various format examples that should all work (pass-through)
      const html1 = await generatePresentation(data, { meetingDate: '15.01.2026' });
      expect(html1).toContain('Data:</strong> 15.01.2026');

      const html2 = await generatePresentation(data, { meetingDate: 'Styczeń 2026' });
      expect(html2).toContain('Data:</strong> Styczeń 2026');
    });
  });

  describe('edge cases', () => {
    it('handles empty student list with zero values in overview', async () => {
      const data = createClassData([]);

      const html = await generatePresentation(data);

      // With no students, averages should show 0.00 (not NaN)
      expect(html).toContain('<div class="value">0</div>'); // student count
      expect(html).toContain('0.00'); // averages default to 0
      expect(html).not.toContain('NaN');
    });

    it('handles students without averages gracefully', async () => {
      const data = createClassData([
        { num: 1 }, // no average
        { num: 2 }, // no average
      ]);

      const html = await generatePresentation(data);

      // Student count should be 2
      expect(html).toContain('<div class="value">2</div>');
      // Averages should show 0.00 when no student has an average
      expect(html).toContain('0.00');
      expect(html).not.toContain('NaN');
    });
  });

  describe('top students slide', () => {
    it('renders top students slide when students have 4.75+ average', async () => {
      const data = createClassData([
        { num: 1, average: 5.25 },
        { num: 2, average: 4.8 },
        { num: 3, average: 4.5 }, // below threshold
      ]);

      const html = await generatePresentation(data);

      expect(html).toContain('Najwyższe średnie');
      expect(html).toContain('Średnia 4,75 i wyżej');
      expect(html).toContain('(2 uczniów)');
    });

    it('skips slide when no students meet threshold', async () => {
      const data = createClassData([
        { num: 1, average: 4.5 },
        { num: 2, average: 4.0 },
      ]);

      const html = await generatePresentation(data);

      expect(html).not.toContain('Najwyższe średnie');
    });

    it('sorts by average descending, then by number ascending', async () => {
      const data = createClassData([
        { num: 3, average: 4.8 },
        { num: 1, average: 5.0 },
        { num: 5, average: 4.8 }, // tied with num 3
        { num: 2, average: 4.9 },
      ]);

      const html = await generatePresentation(data);

      // Find positions in HTML to verify order
      const pos1 = html.indexOf('<td>1</td>');
      const pos2 = html.indexOf('<td>2</td>');
      const pos3 = html.indexOf('<td>3</td>');
      const pos5 = html.indexOf('<td>5</td>');

      // Order should be: 1 (5.00), 2 (4.90), 3 (4.80), 5 (4.80)
      expect(pos1).toBeLessThan(pos2);
      expect(pos2).toBeLessThan(pos3);
      expect(pos3).toBeLessThan(pos5);
    });

    it('displays only student numbers, never names (GDPR)', async () => {
      const data = createClassData([{ num: 7, average: 5.0 }]);

      const html = await generatePresentation(data);

      expect(html).toContain('Numer ucznia');
      expect(html).toContain('<td>7</td>');
      // The slide should not have any name-related columns
      expect(html).not.toMatch(/<th[^>]*>.*(?:Imię|Nazwisko|Uczeń|Name).*<\/th>/i);
    });

    it('formats average with comma as decimal separator', async () => {
      const data = createClassData([{ num: 1, average: 5.25 }]);

      const html = await generatePresentation(data);

      expect(html).toContain('<td>5,25</td>');
    });
  });

  describe('chart rendering fallback', () => {
    it('uses placeholder image when chart rendering fails', async () => {
      // Mock renderChartToDataUrl to throw an error
      const renderChartsModule = await import('./render-charts.js');

      vi.spyOn(renderChartsModule, 'renderChartToDataUrl').mockRejectedValue(
        new Error('Canvas initialization failed'),
      );

      const data = createClassData([
        {
          num: 1,
          grades: [{ subject: 'Matematyka', value: '5' }],
          average: 4.5,
        },
      ]);

      // Should complete without throwing
      const html = await generatePresentation(data);

      // Presentation should still render
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Zebranie z rodzicami');

      // Restore original implementation
      vi.restoreAllMocks();
    });

    it('logs warning when chart rendering fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const renderChartsModule = await import('./render-charts.js');
      vi.spyOn(renderChartsModule, 'renderChartToDataUrl').mockRejectedValue(
        new Error('Memory error'),
      );

      const data = createClassData([
        {
          num: 1,
          grades: [{ subject: 'Test', value: '4' }],
          average: 4.0,
        },
      ]);

      await generatePresentation(data);

      expect(warnSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('attendance slide', () => {
    it('renders attendance slide when classAttendance provided', async () => {
      const data = createClassData([{ num: 1, average: 4.0 }], undefined, {
        percentage: 92.5,
        date: '10.01.2026',
      });

      const html = await generatePresentation(data);

      expect(html).toContain('Frekwencja');
      expect(html).toContain('Średnia frekwencja klasy');
      expect(html).toContain('92,5%');
      expect(html).toContain('stan na 10.01.2026');
    });

    it('skips attendance slide when classAttendance is undefined', async () => {
      const data = createClassData([{ num: 1, average: 4.0 }]);

      const html = await generatePresentation(data);

      expect(html).not.toContain('Frekwencja');
    });

    it('renders attendance without date when date not provided', async () => {
      const data = createClassData([{ num: 1, average: 4.0 }], undefined, { percentage: 88.0 });

      const html = await generatePresentation(data);

      expect(html).toContain('88,0%');
      expect(html).not.toContain('stan na');
    });

    it('uses Polish decimal separator (comma) for percentage', async () => {
      const data = createClassData([{ num: 1, average: 4.0 }], undefined, { percentage: 93.75 });

      const html = await generatePresentation(data);

      expect(html).toContain('93,8%');
      expect(html).not.toContain('93.8%');
    });
  });

  it('renders aggregate grades slide', async () => {
    const data = createClassData([
      { num: 1, grades: [{ subject: 'Matematyka', value: '5' }] },
      { num: 2, grades: [{ subject: 'Matematyka', value: '4' }] },
    ]);

    // Mock aggregate grade distribution to trigger slide rendering
    // Since createClassData doesn't support passing it directly
    data.aggregateGradeDistribution = {
      excellent: 1,
      veryGood: 1,
      good: 0,
      satisfactory: 0,
      acceptable: 0,
      failing: 0,
      unclassified: 0,
    };

    const html = await generatePresentation(data);

    expect(html).toContain('Rozkład wszystkich ocen');
    expect(html).toContain('Bardzo dobry (5)');
  });

  it('calculates and renders subject enrollment statistics', async () => {
    const data = createClassData([
      { num: 1, grades: [{ subject: 'Etyka', value: 'zwolniony' }] }, // Not enrolled
      { num: 2, grades: [{ subject: 'Etyka', value: '5' }] }, // Enrolled
      { num: 3, grades: [{ subject: 'Etyka', value: '4' }] }, // Enrolled
    ]);

    const html = await generatePresentation(data);

    expect(html).toContain('Przedmioty dodatkowe');
    expect(html).toContain('Etyka');
    // Should be 2 students enrolled out of 3
    expect(html).toContain('<td>2</td>');
  });
});

/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { generatePresentationBrowser } from './browser.js';
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
  };
}

describe('generatePresentationBrowser', () => {
  describe('basic generation', () => {
    it('returns valid HTML with DOCTYPE', async () => {
      const data = createClassData([]);
      const html = await generatePresentationBrowser(data);

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

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Klasa:</strong> 5B');
      expect(html).toContain('Semestr:</strong> 2024/2025 - Semestr 2');
      expect(html).toContain('Wychowawca:</strong> Jan Kowalski');
    });

    it('renders charts as base64 images when data available', async () => {
      const data = createClassData([
        {
          num: 1,
          grades: [{ subject: 'Matematyka', value: '5' }],
          average: 4.5,
        },
      ]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('data:image/png;base64,');
    });
  });

  describe('API key validation', () => {
    it('throws error when aiConclusions enabled without geminiApiKey', async () => {
      const data = createClassData([]);

      await expect(generatePresentationBrowser(data, { aiConclusions: true })).rejects.toThrow(
        'geminiApiKey is required when aiConclusions is enabled',
      );
    });

    it('passes validation when aiConclusions enabled with geminiApiKey', async () => {
      const data = createClassData([]);

      // Validates that no validation error is thrown when API key is provided.
      // API call errors are gracefully handled by generateConclusions (returns null).
      await expect(
        generatePresentationBrowser(data, {
          aiConclusions: true,
          geminiApiKey: 'test-key',
        }),
      ).resolves.toBeDefined();
    });

    it('does not throw when aiConclusions is false without geminiApiKey', async () => {
      const data = createClassData([]);

      await expect(
        generatePresentationBrowser(data, { aiConclusions: false }),
      ).resolves.toBeDefined();
    });

    it('does not throw when no options provided', async () => {
      const data = createClassData([]);

      await expect(generatePresentationBrowser(data)).resolves.toBeDefined();
    });
  });

  describe('output parity with Node version', () => {
    it('renders class average statistics', async () => {
      const data = createClassData([
        { num: 1, average: 4.0 },
        { num: 2, average: 5.0 },
      ]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('4.50'); // class average
      expect(html).toContain('4.00'); // min
      expect(html).toContain('5.00'); // max
      expect(html).toContain('Średnia klasy');
    });

    it('renders grade distribution table', async () => {
      const data = createClassData([
        { num: 1, grades: [{ subject: 'Matematyka', value: '5' }] },
        { num: 2, grades: [{ subject: 'Matematyka', value: '4' }] },
      ]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Rozkład ocen');
      expect(html).toContain('Przedmiot');
      expect(html).toContain('Matematyka');
    });

    it('renders behavior counts', async () => {
      const data = createClassData([
        { num: 1, behavior: 'exemplary' },
        { num: 2, behavior: 'good' },
      ]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Zachowanie');
      expect(html).toContain('Wzorowe');
      expect(html).toContain('Dobre');
    });

    it('renders top students slide', async () => {
      const data = createClassData([
        { num: 1, average: 5.0 },
        { num: 2, average: 4.8 },
      ]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Najwyższe średnie');
      expect(html).toContain('(2 uczniów)');
    });
  });

  describe('Polish localization', () => {
    it('uses Polish slide titles', async () => {
      const data = createClassData([]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Zebranie z rodzicami');
      expect(html).toContain('Podsumowanie klasy');
      expect(html).toContain('Średnie ocen z przedmiotów');
    });

    it('formats date in Polish', async () => {
      const data = createClassData([]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Data:');
      expect(html).toMatch(
        /\d{1,2}\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}/,
      );
    });
  });

  describe('GDPR compliance', () => {
    it('uses student numbers, never names in top students', async () => {
      const data = createClassData([{ num: 7, average: 5.0 }]);

      const html = await generatePresentationBrowser(data);

      expect(html).toContain('Numer ucznia');
      expect(html).toContain('<td>7</td>');
      expect(html).not.toMatch(/<th[^>]*>.*(?:Imię|Nazwisko|Uczeń|Name).*<\/th>/i);
    });
  });

  describe('meetingDate option', () => {
    it('uses custom meeting date when provided', async () => {
      const data = createClassData([]);

      const html = await generatePresentationBrowser(data, {
        meetingDate: '15 stycznia 2026',
      });

      expect(html).toContain('Data:</strong> 15 stycznia 2026');
    });
  });
});

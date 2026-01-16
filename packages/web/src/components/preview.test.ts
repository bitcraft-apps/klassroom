/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPreview, type PreviewData, type PreviewEvents } from './preview.js';

describe('createPreview', () => {
  let container: HTMLElement;
  let events: PreviewEvents;
  let data: PreviewData;

  beforeEach(() => {
    container = document.createElement('div');
    events = {
      onGenerate: vi.fn(),
      onCancel: vi.fn(),
    };
    data = {
      className: '3A',
      period: '2024/2025 - Semestr 1',
      teacher: 'Anna Kowalska',
      studentCount: 25,
      subjects: ['Matematyka', 'Język polski', 'Fizyka'],
      warnings: [],
    };
  });

  describe('DOM structure', () => {
    it('creates preview root in container', () => {
      createPreview(container, data, events);

      const preview = container.querySelector('.preview');
      expect(preview).toBeTruthy();
    });

    it('clears container before rendering', () => {
      container.innerHTML = '<div>existing content</div>';

      createPreview(container, data, events);

      expect(container.querySelector('.preview')).toBeTruthy();
      expect(container.textContent).not.toContain('existing content');
    });

    it('creates metadata section', () => {
      createPreview(container, data, events);

      const meta = container.querySelector('.preview__meta');
      expect(meta).toBeTruthy();
    });

    it('creates subjects section', () => {
      createPreview(container, data, events);

      const subjects = container.querySelector('.preview__subjects');
      expect(subjects).toBeTruthy();
    });

    it('creates action buttons', () => {
      createPreview(container, data, events);

      const primaryBtn = container.querySelector('.preview__button--primary');
      const secondaryBtn = container.querySelector('.preview__button--secondary');

      expect(primaryBtn).toBeTruthy();
      expect(secondaryBtn).toBeTruthy();
    });
  });

  describe('Polish labels', () => {
    it('displays class label in Polish', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Klasa:');
    });

    it('displays period label in Polish', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Okres:');
    });

    it('displays teacher label in Polish', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Wychowawca:');
    });

    it('displays student count label in Polish', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Liczba uczniów:');
    });

    it('displays subjects label in Polish', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Przedmioty:');
    });

    it('displays generate button text in Polish', () => {
      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--primary');
      expect(btn?.textContent).toBe('Generuj prezentację');
    });

    it('displays cancel button text in Polish', () => {
      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--secondary');
      expect(btn?.textContent).toBe('Wybierz inny plik');
    });
  });

  describe('data display', () => {
    it('displays className', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('3A');
    });

    it('displays period', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('2024/2025 - Semestr 1');
    });

    it('displays teacher', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Anna Kowalska');
    });

    it('displays studentCount', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('25');
    });

    it('displays all subjects', () => {
      createPreview(container, data, events);

      expect(container.textContent).toContain('Matematyka');
      expect(container.textContent).toContain('Język polski');
      expect(container.textContent).toContain('Fizyka');
    });
  });

  describe('empty data handling', () => {
    it('shows "Brak danych" for empty className', () => {
      data.className = '';

      createPreview(container, data, events);

      expect(container.textContent).toContain('Brak danych');
    });

    it('shows "Brak danych" for empty period', () => {
      data.period = '';

      createPreview(container, data, events);

      expect(container.textContent).toContain('Brak danych');
    });

    it('shows "Brak danych" for empty teacher', () => {
      data.teacher = '';

      createPreview(container, data, events);

      expect(container.textContent).toContain('Brak danych');
    });

    it('shows "Brak danych" for empty subjects', () => {
      data.subjects = [];

      createPreview(container, data, events);

      const subjectsList = container.querySelector('.preview__subjects');
      expect(subjectsList?.textContent).toContain('Brak danych');
    });
  });

  describe('warnings section', () => {
    it('hides warnings section when warnings array is empty', () => {
      data.warnings = [];

      createPreview(container, data, events);

      const warningsSection = container.querySelector('.preview__section--warnings');
      expect(warningsSection).toBeNull();
    });

    it('shows warnings section when warnings exist', () => {
      data.warnings = ['Brak ocen z matematyki'];

      createPreview(container, data, events);

      const warningsSection = container.querySelector('.preview__section--warnings');
      expect(warningsSection).toBeTruthy();
    });

    it('displays all warnings', () => {
      data.warnings = ['Brak ocen z matematyki', 'Brak średniej dla ucznia 5'];

      createPreview(container, data, events);

      expect(container.textContent).toContain('Brak ocen z matematyki');
      expect(container.textContent).toContain('Brak średniej dla ucznia 5');
    });

    it('displays warnings label in Polish', () => {
      data.warnings = ['Test warning'];

      createPreview(container, data, events);

      expect(container.textContent).toContain('Uwagi:');
    });
  });

  describe('button interactions', () => {
    it('calls onGenerate when generate button clicked', () => {
      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--primary') as HTMLButtonElement;
      btn.click();

      expect(events.onGenerate).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', () => {
      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--secondary') as HTMLButtonElement;
      btn.click();

      expect(events.onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('zero students handling', () => {
    it('disables generate button when studentCount is 0', () => {
      data.studentCount = 0;

      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--primary') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('enables generate button when studentCount > 0', () => {
      data.studentCount = 5;

      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--primary') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });

    it('does not call onGenerate when disabled button clicked', () => {
      data.studentCount = 0;

      createPreview(container, data, events);

      const btn = container.querySelector('.preview__button--primary') as HTMLButtonElement;
      btn.click();

      expect(events.onGenerate).not.toHaveBeenCalled();
    });
  });

  describe('GDPR compliance', () => {
    it('does not render any student names', () => {
      // PreviewData interface intentionally excludes student names
      // This test verifies the interface design by checking the data shape
      expect(data).not.toHaveProperty('students');
      expect(data).not.toHaveProperty('studentNames');

      createPreview(container, data, events);

      // Verify only count is shown, not names
      expect(container.textContent).toContain('25');
      expect(container.textContent).not.toContain('Jan Kowalski');
    });
  });
});

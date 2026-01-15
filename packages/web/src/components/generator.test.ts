/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGenerator,
  type GeneratorData,
  type GeneratorEvents,
} from './generator.js';
import type { ClassData, ClassPeriod, StudentNumber } from '@klassroom/core';

// Mock @klassroom/core/browser
vi.mock('@klassroom/core/browser', () => ({
  generatePresentationBrowser: vi.fn(),
}));

// Mock download utility
vi.mock('../utils/download.js', () => ({
  downloadFile: vi.fn(),
  generatePresentationFilename: vi.fn(() => '3A_semestr1.html'),
}));

import { generatePresentationBrowser } from '@klassroom/core/browser';
import { downloadFile, generatePresentationFilename } from '../utils/download.js';

describe('createGenerator', () => {
  let container: HTMLElement;
  let events: GeneratorEvents;
  let data: GeneratorData;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    events = {
      onReset: vi.fn(),
    };
    data = {
      classData: {
        metadata: {
          className: '3A',
          period: '2024/2025 - Semestr 1' as ClassPeriod,
          teacher: 'Anna Kowalska',
        },
        students: [
          {
            number: 1 as StudentNumber,
            grades: [],
            average: 4.5,
          },
        ],
      },
    };

    // Default mock: successful generation
    vi.mocked(generatePresentationBrowser).mockResolvedValue('<html></html>');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('DOM structure', () => {
    it('creates generator root in container', () => {
      createGenerator(container, data, events);

      const generator = container.querySelector('.generator');
      expect(generator).toBeTruthy();
    });

    it('clears container before rendering', () => {
      container.innerHTML = '<div>existing content</div>';

      createGenerator(container, data, events);

      expect(container.querySelector('.generator')).toBeTruthy();
      expect(container.textContent).not.toContain('existing content');
    });

    it('creates progress section', () => {
      createGenerator(container, data, events);

      const progress = container.querySelector('.generator__progress');
      expect(progress).toBeTruthy();
    });

    it('creates spinner element', () => {
      createGenerator(container, data, events);

      const spinner = container.querySelector('.generator__spinner');
      expect(spinner).toBeTruthy();
    });

    it('creates complete section (hidden initially)', () => {
      createGenerator(container, data, events);

      const complete = container.querySelector(
        '.generator__complete',
      ) as HTMLElement;
      expect(complete).toBeTruthy();
      expect(complete.hidden).toBe(true);
    });

    it('creates error section (hidden initially)', () => {
      createGenerator(container, data, events);

      const error = container.querySelector('.generator__error') as HTMLElement;
      expect(error).toBeTruthy();
      expect(error.hidden).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('sets role="status" on progress section', () => {
      createGenerator(container, data, events);

      const progress = container.querySelector('.generator__progress');
      expect(progress?.getAttribute('role')).toBe('status');
    });

    it('sets aria-live="polite" on step text', () => {
      createGenerator(container, data, events);

      const stepText = container.querySelector('.generator__step');
      expect(stepText?.getAttribute('aria-live')).toBe('polite');
    });

    it('sets aria-hidden on spinner', () => {
      createGenerator(container, data, events);

      const spinner = container.querySelector('.generator__spinner');
      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    });

    it('sets aria-hidden on success icon', () => {
      createGenerator(container, data, events);

      const icon = container.querySelector('.generator__success-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('sets aria-hidden on error icon', () => {
      createGenerator(container, data, events);

      const icon = container.querySelector('.generator__error-icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('sets role="alert" on error section', () => {
      createGenerator(container, data, events);

      const error = container.querySelector('.generator__error');
      expect(error?.getAttribute('role')).toBe('alert');
    });

    it('focuses reset button after successful generation', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const resetBtn = container.querySelector(
        '.generator__complete .generator__button--primary',
      ) as HTMLButtonElement;
      expect(document.activeElement).toBe(resetBtn);
    });

    it('focuses retry button after generation error', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const retryBtn = container.querySelector(
        '.generator__error .generator__button--primary',
      ) as HTMLButtonElement;
      expect(document.activeElement).toBe(retryBtn);
    });

    it('sets title attribute on error text for tooltip', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Long error message for accessibility'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const errorText = container.querySelector(
        '.generator__error-text',
      ) as HTMLElement;
      expect(errorText.title).toContain('Long error message for accessibility');
    });
  });

  describe('Polish labels', () => {
    it('displays initial progress step in Polish', () => {
      createGenerator(container, data, events);

      expect(container.textContent).toContain('Przetwarzanie danych...');
    });

    it('displays download ready text in Polish', async () => {
      createGenerator(container, data, events);

      // Wait for generation to complete
      await vi.runAllTimersAsync();

      expect(container.textContent).toContain('Prezentacja została pobrana');
    });

    it('displays reset button text in Polish', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const btn = container.querySelector(
        '.generator__complete .generator__button--primary',
      );
      expect(btn?.textContent).toBe('Generuj kolejną');
    });

    it('displays retry button text in Polish', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const btn = container.querySelector(
        '.generator__error .generator__button--primary',
      );
      expect(btn?.textContent).toBe('Spróbuj ponownie');
    });

    it('displays error message in Polish', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(container.textContent).toContain(
        'Wystąpił błąd podczas generowania prezentacji',
      );
    });

    it('updates progress step to preparing before download', async () => {
      let capturedStepText = '';
      vi.mocked(downloadFile).mockImplementation(() => {
        // Capture step text at the moment download is triggered
        const stepEl = container.querySelector('.generator__step');
        capturedStepText = stepEl?.textContent || '';
      });

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(capturedStepText).toBe('Przygotowywanie pliku...');
    });
  });

  describe('generation flow', () => {
    it('calls generatePresentationBrowser with classData', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(generatePresentationBrowser).toHaveBeenCalledWith(data.classData);
    });

    it('generates filename from class metadata', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(generatePresentationFilename).toHaveBeenCalledWith(
        '3A',
        '2024/2025 - Semestr 1',
      );
    });

    it('downloads file on successful generation', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(downloadFile).toHaveBeenCalledWith('<html></html>', '3A_semestr1.html');
    });

    it('shows complete section after generation', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const progress = container.querySelector(
        '.generator__progress',
      ) as HTMLElement;
      const complete = container.querySelector(
        '.generator__complete',
      ) as HTMLElement;

      expect(progress.hidden).toBe(true);
      expect(complete.hidden).toBe(false);
    });

    it('displays filename in complete section', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(container.textContent).toContain('3A_semestr1.html');
    });
  });

  describe('error handling', () => {
    it('shows error section on generation failure', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Generation failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const progress = container.querySelector(
        '.generator__progress',
      ) as HTMLElement;
      const error = container.querySelector('.generator__error') as HTMLElement;

      expect(progress.hidden).toBe(true);
      expect(error.hidden).toBe(false);
    });

    it('includes error message detail', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Chart rendering failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(container.textContent).toContain('Chart rendering failed');
    });

    it('does not call download on error', async () => {
      vi.mocked(generatePresentationBrowser).mockRejectedValue(
        new Error('Failed'),
      );

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      expect(downloadFile).not.toHaveBeenCalled();
    });
  });

  describe('button interactions', () => {
    it('calls onReset when reset button clicked', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      const btn = container.querySelector(
        '.generator__complete .generator__button--primary',
      ) as HTMLButtonElement;
      btn.click();

      expect(events.onReset).toHaveBeenCalledTimes(1);
    });

    it('retries generation when retry button clicked', async () => {
      vi.mocked(generatePresentationBrowser)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('<html></html>');

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      // Click retry
      const btn = container.querySelector(
        '.generator__error .generator__button--primary',
      ) as HTMLButtonElement;
      btn.click();

      await vi.runAllTimersAsync();

      // Should have called generation twice
      expect(generatePresentationBrowser).toHaveBeenCalledTimes(2);
    });

    it('shows progress section on retry', async () => {
      vi.mocked(generatePresentationBrowser)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('<html></html>');

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      // Click retry
      const btn = container.querySelector(
        '.generator__error .generator__button--primary',
      ) as HTMLButtonElement;
      btn.click();

      // Progress should be visible again
      const progress = container.querySelector(
        '.generator__progress',
      ) as HTMLElement;
      const error = container.querySelector('.generator__error') as HTMLElement;

      expect(progress.hidden).toBe(false);
      expect(error.hidden).toBe(true);
    });
  });

  describe('GDPR compliance', () => {
    it('does not display student names in UI', async () => {
      // ClassData type excludes student names by design (GDPR boundary).
      // The generator component receives only student numbers, making
      // name display architecturally impossible. This test documents
      // that privacy guarantee and verifies no name-like strings leak.
      data.classData.students = [
        {
          number: 1 as StudentNumber,
          grades: [],
          average: 4.5,
        },
      ];

      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      // Verify UI contains no student name patterns
      expect(container.textContent).not.toContain('Jan');
      expect(container.textContent).not.toContain('Kowalski');
    });
  });

  describe('cleanup', () => {
    it('returns a cleanup function', () => {
      const cleanup = createGenerator(container, data, events);

      expect(typeof cleanup).toBe('function');
    });

    it('prevents UI updates after cleanup during successful generation', async () => {
      // Use a deferred promise to control timing
      let resolveGeneration: (value: string) => void;
      vi.mocked(generatePresentationBrowser).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGeneration = resolve;
          }),
      );

      const cleanup = createGenerator(container, data, events);

      // Call cleanup before generation completes
      cleanup();

      // Now resolve the generation
      resolveGeneration!('<html></html>');
      await vi.runAllTimersAsync();

      // Progress should still be visible (not transitioned to complete)
      const progress = container.querySelector(
        '.generator__progress',
      ) as HTMLElement;
      const complete = container.querySelector(
        '.generator__complete',
      ) as HTMLElement;

      expect(progress.hidden).toBe(false);
      expect(complete.hidden).toBe(true);
      // Download should not have been called
      expect(downloadFile).not.toHaveBeenCalled();
    });

    it('prevents UI updates after cleanup during failed generation', async () => {
      // Use a deferred promise to control timing
      let rejectGeneration: (error: Error) => void;
      vi.mocked(generatePresentationBrowser).mockImplementation(
        () =>
          new Promise((_, reject) => {
            rejectGeneration = reject;
          }),
      );

      const cleanup = createGenerator(container, data, events);

      // Call cleanup before generation completes
      cleanup();

      // Now reject the generation
      rejectGeneration!(new Error('Failed'));
      await vi.runAllTimersAsync();

      // Progress should still be visible (not transitioned to error)
      const progress = container.querySelector(
        '.generator__progress',
      ) as HTMLElement;
      const error = container.querySelector('.generator__error') as HTMLElement;

      expect(progress.hidden).toBe(false);
      expect(error.hidden).toBe(true);
    });

    it('removes event listeners on cleanup', async () => {
      createGenerator(container, data, events);

      await vi.runAllTimersAsync();

      // Get reference to reset button before cleanup
      const resetBtn = container.querySelector(
        '.generator__complete .generator__button--primary',
      ) as HTMLButtonElement;

      // Re-create generator (which clears container and creates new elements)
      const cleanup = createGenerator(container, data, events);

      // Complete generation
      await vi.runAllTimersAsync();

      // Call cleanup
      cleanup();

      // Click the reset button after cleanup
      const newResetBtn = container.querySelector(
        '.generator__complete .generator__button--primary',
      ) as HTMLButtonElement;
      newResetBtn.click();

      // onReset should not be called because listener was removed
      expect(events.onReset).not.toHaveBeenCalled();
    });
  });
});

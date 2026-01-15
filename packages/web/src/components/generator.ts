/**
 * Presentation generator component with progress UI and download.
 * Polish UI text. Wraps @klassroom/core/browser generation with user feedback.
 */

import { generatePresentationBrowser } from '@klassroom/core/browser';
import type { ClassData } from '@klassroom/core';
import {
  downloadFile,
  generatePresentationFilename,
} from '../utils/download.js';
import './generator.css';

// Polish UI text
const STEP_PROCESSING = 'Przetwarzanie danych...';
const STEP_CHARTS = 'Generowanie wykresów...';
const STEP_PRESENTATION = 'Tworzenie prezentacji...';
const STEP_COMPLETE = 'Gotowe!';
const TEXT_DOWNLOAD_READY = 'Prezentacja została pobrana';
const TEXT_FILENAME = 'Plik:';
const BUTTON_GENERATE_ANOTHER = 'Generuj kolejną';
const BUTTON_RETRY = 'Spróbuj ponownie';
const ERROR_GENERATION_FAILED = 'Wystąpił błąd podczas generowania prezentacji';

/**
 * Progress steps for generation process.
 */
const PROGRESS_STEPS = [
  STEP_PROCESSING,
  STEP_CHARTS,
  STEP_PRESENTATION,
  STEP_COMPLETE,
] as const;

/**
 * Data required to generate presentation.
 */
export interface GeneratorData {
  classData: ClassData;
}

/**
 * Callback events for generator component.
 */
export interface GeneratorEvents {
  /** Called when user clicks "Generuj kolejną" to reset flow */
  onReset: () => void;
}

/**
 * Creates a presentation generator with progress UI and auto-download.
 * Polish UI text. Shows progress steps during generation, then download UI.
 *
 * @param container - Parent element to mount the component into
 * @param data - Class data for presentation generation
 * @param events - Callback handlers
 */
export function createGenerator(
  container: HTMLElement,
  data: GeneratorData,
  events: GeneratorEvents,
): void {
  // Clear container
  container.innerHTML = '';

  // Create DOM structure
  const root = document.createElement('div');
  root.className = 'generator';

  // Progress section (shown during generation)
  const progressSection = document.createElement('div');
  progressSection.className = 'generator__progress';

  const spinner = document.createElement('div');
  spinner.className = 'generator__spinner';

  const stepText = document.createElement('p');
  stepText.className = 'generator__step';
  stepText.textContent = STEP_PROCESSING;

  progressSection.appendChild(spinner);
  progressSection.appendChild(stepText);

  // Complete section (hidden initially)
  const completeSection = document.createElement('div');
  completeSection.className = 'generator__complete';
  completeSection.hidden = true;

  const successIcon = document.createElement('div');
  successIcon.className = 'generator__success-icon';
  successIcon.textContent = '\u2713';

  const completeText = document.createElement('p');
  completeText.className = 'generator__complete-text';
  completeText.textContent = TEXT_DOWNLOAD_READY;

  const filenameLabel = document.createElement('p');
  filenameLabel.className = 'generator__filename';

  const resetButton = document.createElement('button');
  resetButton.className = 'generator__button generator__button--primary';
  resetButton.type = 'button';
  resetButton.textContent = BUTTON_GENERATE_ANOTHER;
  resetButton.addEventListener('click', () => events.onReset());

  completeSection.appendChild(successIcon);
  completeSection.appendChild(completeText);
  completeSection.appendChild(filenameLabel);
  completeSection.appendChild(resetButton);

  // Error section (hidden initially)
  const errorSection = document.createElement('div');
  errorSection.className = 'generator__error';
  errorSection.hidden = true;

  const errorIcon = document.createElement('div');
  errorIcon.className = 'generator__error-icon';
  errorIcon.textContent = '!';

  const errorText = document.createElement('p');
  errorText.className = 'generator__error-text';
  errorText.textContent = ERROR_GENERATION_FAILED;

  const retryButton = document.createElement('button');
  retryButton.className = 'generator__button generator__button--primary';
  retryButton.type = 'button';
  retryButton.textContent = BUTTON_RETRY;

  errorSection.appendChild(errorIcon);
  errorSection.appendChild(errorText);
  errorSection.appendChild(retryButton);

  root.appendChild(progressSection);
  root.appendChild(completeSection);
  root.appendChild(errorSection);
  container.appendChild(root);

  // Generate presentation
  const generate = async (): Promise<void> => {
    try {
      // Step 1: Processing
      stepText.textContent = PROGRESS_STEPS[0];

      // Generate HTML
      const html = await generatePresentationBrowser(data.classData);

      // Step 2-3: Show progress steps briefly
      stepText.textContent = PROGRESS_STEPS[1];
      await delay(200);
      stepText.textContent = PROGRESS_STEPS[2];
      await delay(200);

      // Step 4: Complete
      stepText.textContent = PROGRESS_STEPS[3];

      // Generate filename and download
      const filename = generatePresentationFilename(
        data.classData.metadata.className,
        data.classData.metadata.period,
      );
      downloadFile(html, filename);

      // Show complete UI
      progressSection.hidden = true;
      filenameLabel.textContent = `${TEXT_FILENAME} ${filename}`;
      completeSection.hidden = false;
    } catch (error) {
      // Show error UI
      progressSection.hidden = true;
      errorSection.hidden = false;

      // Add error detail if available
      if (error instanceof Error && error.message) {
        errorText.textContent = `${ERROR_GENERATION_FAILED}: ${error.message}`;
      }
    }
  };

  // Retry handler
  retryButton.addEventListener('click', () => {
    errorSection.hidden = true;
    progressSection.hidden = false;
    stepText.textContent = STEP_PROCESSING;
    void generate();
  });

  // Start generation
  void generate();
}

/**
 * Utility function for brief delays in progress display.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

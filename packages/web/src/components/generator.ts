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
const STEP_PREPARING = 'Przygotowywanie pliku...';
const TEXT_DOWNLOAD_READY = 'Prezentacja została pobrana';
const LABEL_FILENAME = 'Plik:';
const BUTTON_GENERATE_ANOTHER = 'Generuj kolejną';
const BUTTON_RETRY = 'Spróbuj ponownie';
const ERROR_GENERATION_FAILED = 'Wystąpił błąd podczas generowania prezentacji';

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
 * @returns Cleanup function to call when unmounting the component
 */
export function createGenerator(
  container: HTMLElement,
  data: GeneratorData,
  events: GeneratorEvents,
): () => void {
  // Track if component is still active (for cleanup)
  let isActive = true;
  // Clear container
  container.innerHTML = '';

  // Create DOM structure
  const root = document.createElement('div');
  root.className = 'generator';

  // Progress section (shown during generation)
  const progressSection = document.createElement('div');
  progressSection.className = 'generator__progress';
  progressSection.setAttribute('role', 'status');

  const spinner = document.createElement('div');
  spinner.className = 'generator__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const stepText = document.createElement('p');
  stepText.className = 'generator__step';
  stepText.setAttribute('aria-live', 'polite');
  stepText.textContent = STEP_PROCESSING;

  progressSection.appendChild(spinner);
  progressSection.appendChild(stepText);

  // Complete section (hidden initially)
  const completeSection = document.createElement('div');
  completeSection.className = 'generator__complete';
  completeSection.hidden = true;

  const successIcon = document.createElement('div');
  successIcon.className = 'generator__success-icon';
  successIcon.setAttribute('aria-hidden', 'true');
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

  // Named handler for cleanup
  const handleReset = (): void => {
    events.onReset();
  };
  resetButton.addEventListener('click', handleReset);

  completeSection.appendChild(successIcon);
  completeSection.appendChild(completeText);
  completeSection.appendChild(filenameLabel);
  completeSection.appendChild(resetButton);

  // Error section (hidden initially)
  const errorSection = document.createElement('div');
  errorSection.className = 'generator__error';
  errorSection.setAttribute('role', 'alert');
  errorSection.hidden = true;

  const errorIcon = document.createElement('div');
  errorIcon.className = 'generator__error-icon';
  errorIcon.setAttribute('aria-hidden', 'true');
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
      // Generate HTML
      const html = await generatePresentationBrowser(data.classData);

      // Skip UI updates if component was cleaned up during generation
      if (!isActive) return;

      // Update progress step
      stepText.textContent = STEP_PREPARING;

      // Generate filename and download
      const filename = generatePresentationFilename(
        data.classData.metadata.className,
        data.classData.metadata.period,
      );
      downloadFile(html, filename);

      // Show complete UI
      progressSection.hidden = true;
      filenameLabel.textContent = `${LABEL_FILENAME} ${filename}`;
      completeSection.hidden = false;
    } catch (error) {
      // Skip UI updates if component was cleaned up during generation
      if (!isActive) return;

      // Show error UI
      progressSection.hidden = true;
      errorSection.hidden = false;

      // Add error detail if available
      if (error instanceof Error && error.message) {
        errorText.textContent = `${ERROR_GENERATION_FAILED}: ${error.message}`;
      }
    }
  };

  // Named handler for cleanup
  const handleRetry = (): void => {
    errorSection.hidden = true;
    progressSection.hidden = false;
    stepText.textContent = STEP_PROCESSING;
    void generate();
  };
  retryButton.addEventListener('click', handleRetry);

  // Start generation
  void generate();

  // Return cleanup function
  return () => {
    isActive = false;
    resetButton.removeEventListener('click', handleReset);
    retryButton.removeEventListener('click', handleRetry);
  };
}

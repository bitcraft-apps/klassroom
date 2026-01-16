/**
 * Main orchestration for the web app.
 * Wires together file-upload, preview, and generator components.
 * State is implicit: current state = which component is mounted.
 */
import { parseVulcanXlsxFromBuffer } from '@klassroom/core/browser';
import type { ClassData } from '@klassroom/core';
import { createFileUpload } from './components/file-upload.js';
import { createPreview, type PreviewData } from './components/preview.js';
import { createGenerator } from './components/generator.js';
import './styles/main.css';

// Polish UI text
const TEXT_PROCESSING = 'Przetwarzanie...';
const ERROR_INVALID_FILE =
  'Nieprawidłowy format pliku. Wybierz eksport z Vulcan UONET+.';
const BUTTON_RETRY = 'Spróbuj ponownie';

// State
// Only createGenerator returns a cleanup function (has async operations that need aborting).
// createFileUpload and createPreview return void - their DOM is cleared via innerHTML.
let currentCleanup: (() => void) | null = null;
let isProcessing = false;

const app = document.getElementById('app');

/**
 * Transforms ClassData to PreviewData for the preview component.
 * Extracts metadata without exposing student names (GDPR boundary).
 */
function transformToPreviewData(classData: ClassData): PreviewData {
  // Extract unique subjects from all students
  const subjectSet = new Set<string>();
  for (const student of classData.students) {
    for (const grade of student.grades) {
      subjectSet.add(grade.subject);
    }
  }

  // Build warnings list
  const warnings: string[] = [];
  if (classData.students.length === 0) {
    warnings.push('Brak danych uczniów');
  }
  if (!classData.metadata.teacher) {
    warnings.push('Brak informacji o wychowawcy');
  }

  return {
    className: classData.metadata.className,
    period: classData.metadata.period,
    teacher: classData.metadata.teacher ?? '',
    studentCount: classData.students.length,
    subjects: Array.from(subjectSet),
    warnings,
  };
}

/**
 * Clears any existing component and resets state.
 */
function clearApp(): void {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  if (app) {
    app.innerHTML = '';
  }
}

/**
 * Shows error UI with Polish message and retry button.
 */
function showError(message: string): void {
  clearApp();
  if (!app) return;

  const root = document.createElement('div');
  root.className = 'error';
  root.setAttribute('role', 'alert');

  const errorIcon = document.createElement('div');
  errorIcon.className = 'error__icon';
  errorIcon.setAttribute('aria-hidden', 'true');
  errorIcon.textContent = '!';

  const errorText = document.createElement('p');
  errorText.className = 'error__text';
  errorText.textContent = message;

  const retryButton = document.createElement('button');
  retryButton.className = 'error__button';
  retryButton.type = 'button';
  retryButton.textContent = BUTTON_RETRY;
  retryButton.addEventListener('click', () => {
    showUpload();
  });

  root.appendChild(errorIcon);
  root.appendChild(errorText);
  root.appendChild(retryButton);
  app.appendChild(root);

  retryButton.focus();
}

/**
 * Shows processing feedback text.
 */
function showProcessing(): void {
  clearApp();
  if (!app) return;

  const root = document.createElement('div');
  root.className = 'processing';
  root.setAttribute('role', 'status');

  const spinner = document.createElement('div');
  spinner.className = 'processing__spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const text = document.createElement('p');
  text.className = 'processing__text';
  text.textContent = TEXT_PROCESSING;

  root.appendChild(spinner);
  root.appendChild(text);
  app.appendChild(root);
}

/**
 * Shows file upload component.
 */
function showUpload(): void {
  clearApp();
  if (!app) return;

  createFileUpload(app, {
    onFileSelected: (file) => {
      void handleFileSelected(file);
    },
    onError: (message) => {
      showError(message);
    },
  });
}

/**
 * Handles file selection - parses and transitions to preview.
 */
async function handleFileSelected(file: File): Promise<void> {
  // Prevent duplicate processing
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Show processing feedback
    showProcessing();

    // Parse the file
    const buffer = await file.arrayBuffer();
    const classData = parseVulcanXlsxFromBuffer(buffer);

    // Transition to preview
    showPreview(classData);
  } catch (error) {
    // Log for debugging; user sees generic Polish error (invalid format is most likely cause)
    console.error('File processing failed:', error);
    showError(ERROR_INVALID_FILE);
  } finally {
    isProcessing = false;
  }
}

/**
 * Shows preview component with parsed data.
 */
function showPreview(classData: ClassData): void {
  clearApp();
  if (!app) return;

  const previewData = transformToPreviewData(classData);

  createPreview(app, previewData, {
    onGenerate: () => {
      showGenerator(classData);
    },
    onCancel: () => {
      showUpload();
    },
  });
}

/**
 * Shows generator component to create presentation.
 */
function showGenerator(classData: ClassData): void {
  clearApp();
  if (!app) return;

  currentCleanup = createGenerator(
    app,
    { classData },
    {
      onReset: () => {
        showUpload();
      },
    },
  );
}

// Initialize app
if (app) {
  showUpload();
}

// Re-export to verify @klassroom/core/browser bundles without Node.js code
export { parseVulcanXlsxFromBuffer };

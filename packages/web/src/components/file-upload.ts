/**
 * File upload component with drag-and-drop and click support.
 * Polish UI text. Validates XLSX files only, max 10MB.
 */

import './file-upload.css';

// Validation limits
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSION = '.xlsx';

// Polish error messages
const ERROR_WRONG_TYPE = 'Wybierz plik w formacie XLSX';
const ERROR_TOO_LARGE = 'Plik jest za duzy (maksymalnie 10 MB)';
const ERROR_EMPTY_FILE = 'Wybrany plik jest pusty';
const ERROR_IS_FOLDER = 'Wybierz plik, nie folder';

// Polish UI text
const TEXT_PRIMARY = 'Przeciagnij plik XLSX tutaj';
const TEXT_SECONDARY = 'lub kliknij, aby wybrac';

/**
 * Callback events for the file upload component.
 */
export interface FileUploadEvents {
  onFileSelected: (file: File) => void;
  onError: (message: string) => void;
}

/**
 * Validates a file and returns an error message or null if valid.
 */
function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();

  // Check extension
  if (!name.endsWith(ALLOWED_EXTENSION)) {
    // Distinguish folder from wrong file type
    // Folders have type="" and size exactly 0 or 4096 (common sentinel values)
    const isFolderSize = file.size === 0 || file.size === 4096;
    if (file.type === '' && isFolderSize && !name.includes('.')) {
      return ERROR_IS_FOLDER;
    }
    return ERROR_WRONG_TYPE;
  }

  // Check if empty
  if (file.size === 0) {
    return ERROR_EMPTY_FILE;
  }

  // Check size limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return ERROR_TOO_LARGE;
  }

  return null;
}

/**
 * Creates a file upload drop zone with drag-and-drop and click support.
 * Polish UI text. Validates XLSX files only, max 10MB.
 *
 * @param container - Parent element to mount the component into
 * @param events - Callback handlers for file selection and errors
 */
export function createFileUpload(
  container: HTMLElement,
  events: FileUploadEvents,
): void {
  // Create DOM structure
  const errorId = `file-upload-error-${Date.now()}`;

  const dropZone = document.createElement('div');
  dropZone.className = 'file-upload';
  dropZone.tabIndex = 0;
  dropZone.setAttribute('role', 'button');
  dropZone.setAttribute('aria-label', TEXT_PRIMARY);
  dropZone.setAttribute('aria-describedby', errorId);

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = ALLOWED_EXTENSION;
  input.hidden = true;

  const textPrimary = document.createElement('p');
  textPrimary.className = 'file-upload__primary';
  textPrimary.textContent = TEXT_PRIMARY;

  const textSecondary = document.createElement('p');
  textSecondary.className = 'file-upload__secondary';
  textSecondary.textContent = TEXT_SECONDARY;

  const errorEl = document.createElement('p');
  errorEl.id = errorId;
  errorEl.className = 'file-upload__error';
  errorEl.setAttribute('aria-live', 'polite');
  errorEl.hidden = true;

  dropZone.appendChild(input);
  dropZone.appendChild(textPrimary);
  dropZone.appendChild(textSecondary);
  dropZone.appendChild(errorEl);

  // State
  let dragCounter = 0;

  function setDefaultState(): void {
    dropZone.classList.remove('file-upload--dragover', 'file-upload--error');
    errorEl.hidden = true;
  }

  function setDragOverState(): void {
    dropZone.classList.add('file-upload--dragover');
    dropZone.classList.remove('file-upload--error');
    errorEl.hidden = true;
  }

  function setErrorState(message: string): void {
    dropZone.classList.add('file-upload--error');
    dropZone.classList.remove('file-upload--dragover');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function handleFile(file: File): void {
    const error = validateFile(file);
    if (error) {
      setErrorState(error);
      events.onError(error);
    } else {
      setDefaultState();
      events.onFileSelected(file);
    }
  }

  // Event handlers
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    input.value = '';
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== input) {
      input.click();
    }
  });

  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) {
      setDragOverState();
    }
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.classList.remove('file-upload--dragover');
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('file-upload--dragover');

    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFile(file);
    }
  });

  container.appendChild(dropZone);
}

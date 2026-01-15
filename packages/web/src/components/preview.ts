/**
 * Data preview component for verifying parsed XLSX data before generation.
 * Polish UI text. Displays class metadata, subjects, and warnings.
 */

import './preview.css';

// Polish UI text
const LABEL_CLASS = 'Klasa:';
const LABEL_PERIOD = 'Okres:';
const LABEL_TEACHER = 'Wychowawca:';
const LABEL_STUDENT_COUNT = 'Liczba uczniów:';
const LABEL_SUBJECTS = 'Przedmioty:';
const LABEL_WARNINGS = 'Uwagi:';
const TEXT_NO_DATA = 'Brak danych';
const BUTTON_GENERATE = 'Generuj prezentację';
const BUTTON_CANCEL = 'Wybierz inny plik';

/**
 * Data shape for the preview component.
 * Caller transforms parser output to this shape (GDPR boundary).
 */
export interface PreviewData {
  className: string;
  period: string;
  teacher: string;
  studentCount: number;
  subjects: string[];
  warnings: string[];
}

/**
 * Callback events for the preview component.
 */
export interface PreviewEvents {
  onGenerate: () => void;
  onCancel: () => void;
}

/**
 * Creates a data preview showing parsed class info before presentation generation.
 * Polish UI text. Shows metadata, subjects, warnings, and action buttons.
 *
 * @param container - Parent element to mount the component into
 * @param data - Parsed class data to display
 * @param events - Callback handlers for generate and cancel actions
 */
export function createPreview(
  container: HTMLElement,
  data: PreviewData,
  events: PreviewEvents,
): void {
  // Clear container
  container.innerHTML = '';

  // Create DOM structure
  const root = document.createElement('div');
  root.className = 'preview';

  // Metadata section
  const metaSection = document.createElement('dl');
  metaSection.className = 'preview__meta';

  const metaItems: [string, string][] = [
    [LABEL_CLASS, data.className || TEXT_NO_DATA],
    [LABEL_PERIOD, data.period || TEXT_NO_DATA],
    [LABEL_TEACHER, data.teacher || TEXT_NO_DATA],
    [LABEL_STUDENT_COUNT, String(data.studentCount)],
  ];

  for (const [label, value] of metaItems) {
    const dt = document.createElement('dt');
    dt.className = 'preview__label';
    dt.textContent = label;

    const dd = document.createElement('dd');
    dd.className = 'preview__value';
    dd.textContent = value;

    metaSection.appendChild(dt);
    metaSection.appendChild(dd);
  }

  root.appendChild(metaSection);

  // Subjects section
  const subjectsSection = document.createElement('div');
  subjectsSection.className = 'preview__section';

  const subjectsLabel = document.createElement('h3');
  subjectsLabel.className = 'preview__section-title';
  subjectsLabel.textContent = LABEL_SUBJECTS;

  const subjectsList = document.createElement('ul');
  subjectsList.className = 'preview__subjects';

  if (data.subjects.length > 0) {
    for (const subject of data.subjects) {
      const li = document.createElement('li');
      li.textContent = subject;
      subjectsList.appendChild(li);
    }
  } else {
    const li = document.createElement('li');
    li.textContent = TEXT_NO_DATA;
    subjectsList.appendChild(li);
  }

  subjectsSection.appendChild(subjectsLabel);
  subjectsSection.appendChild(subjectsList);
  root.appendChild(subjectsSection);

  // Warnings section (hidden when empty)
  if (data.warnings.length > 0) {
    const warningsSection = document.createElement('div');
    warningsSection.className = 'preview__section preview__section--warnings';

    const warningsLabel = document.createElement('h3');
    warningsLabel.className = 'preview__section-title';
    warningsLabel.textContent = LABEL_WARNINGS;

    const warningsList = document.createElement('ul');
    warningsList.className = 'preview__warnings';

    for (const warning of data.warnings) {
      const li = document.createElement('li');
      li.textContent = warning;
      warningsList.appendChild(li);
    }

    warningsSection.appendChild(warningsLabel);
    warningsSection.appendChild(warningsList);
    root.appendChild(warningsSection);
  }

  // Actions section
  const actionsSection = document.createElement('div');
  actionsSection.className = 'preview__actions';

  const generateButton = document.createElement('button');
  generateButton.className = 'preview__button preview__button--primary';
  generateButton.type = 'button';
  generateButton.textContent = BUTTON_GENERATE;

  // Disable generate when no students
  if (data.studentCount === 0) {
    generateButton.disabled = true;
  }

  const cancelButton = document.createElement('button');
  cancelButton.className = 'preview__button preview__button--secondary';
  cancelButton.type = 'button';
  cancelButton.textContent = BUTTON_CANCEL;

  // Event handlers
  generateButton.addEventListener('click', () => {
    events.onGenerate();
  });

  cancelButton.addEventListener('click', () => {
    events.onCancel();
  });

  actionsSection.appendChild(generateButton);
  actionsSection.appendChild(cancelButton);
  root.appendChild(actionsSection);

  container.appendChild(root);
}

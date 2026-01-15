/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFileUpload, type FileUploadEvents } from './file-upload.js';

// Polyfill DragEvent for jsdom
class MockDragEvent extends Event {
  dataTransfer: DataTransfer | null;

  constructor(type: string, init?: DragEventInit) {
    super(type, init);
    this.dataTransfer = init?.dataTransfer ?? null;
  }
}

// Polyfill DataTransfer for jsdom
class MockDataTransfer {
  files: File[] = [];
  items = {
    add: (file: File) => {
      this.files.push(file);
    },
  };

  get length(): number {
    return this.files.length;
  }
}

// @ts-expect-error polyfill for jsdom
globalThis.DragEvent = MockDragEvent;
// @ts-expect-error polyfill for jsdom
globalThis.DataTransfer = MockDataTransfer;

describe('createFileUpload', () => {
  let container: HTMLElement;
  let events: FileUploadEvents;

  // Helper to create test files
  function createFile(name: string, size: number, type = ''): File {
    const content = new Uint8Array(size);
    return new File([content], name, { type });
  }

  function createDataTransfer(file: File): DataTransfer {
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt;
  }

  beforeEach(() => {
    container = document.createElement('div');
    events = {
      onFileSelected: vi.fn(),
      onError: vi.fn(),
    };
  });

  describe('DOM structure', () => {
    it('creates drop zone in container', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload');
      expect(dropZone).toBeTruthy();
    });

    it('creates hidden file input', () => {
      createFileUpload(container, events);

      const input = container.querySelector('input[type="file"]');
      expect(input).toBeTruthy();
      expect((input as HTMLInputElement).hidden).toBe(true);
      expect((input as HTMLInputElement).accept).toBe('.xlsx');
    });

    it('sets correct ARIA attributes', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload');
      expect(dropZone?.getAttribute('role')).toBe('button');
      expect(dropZone?.getAttribute('tabindex')).toBe('0');
    });

    it('displays Polish text', () => {
      createFileUpload(container, events);

      const primary = container.querySelector('.file-upload__primary');
      const secondary = container.querySelector('.file-upload__secondary');

      expect(primary?.textContent).toBe('Przeciagnij plik XLSX tutaj');
      expect(secondary?.textContent).toBe('lub kliknij, aby wybrac');
    });
  });

  describe('click interaction', () => {
    it('opens file dialog on click', () => {
      createFileUpload(container, events);

      const input = container.querySelector('input') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.click();

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    it('opens file dialog on Enter key', () => {
      createFileUpload(container, events);

      const input = container.querySelector('input') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(clickSpy).toHaveBeenCalled();
    });

    it('opens file dialog on Space key', () => {
      createFileUpload(container, events);

      const input = container.querySelector('input') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('drag and drop', () => {
    it('adds dragover class on dragenter', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));

      expect(dropZone.classList.contains('file-upload--dragover')).toBe(true);
    });

    it('removes dragover class on dragleave', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
      dropZone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));

      expect(dropZone.classList.contains('file-upload--dragover')).toBe(false);
    });

    it('handles nested dragenter/dragleave without flicker', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      // Enter parent
      dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
      expect(dropZone.classList.contains('file-upload--dragover')).toBe(true);

      // Enter child (counter = 2)
      dropZone.dispatchEvent(new DragEvent('dragenter', { bubbles: true }));
      expect(dropZone.classList.contains('file-upload--dragover')).toBe(true);

      // Leave child (counter = 1, still dragging)
      dropZone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
      expect(dropZone.classList.contains('file-upload--dragover')).toBe(true);

      // Leave parent (counter = 0)
      dropZone.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
      expect(dropZone.classList.contains('file-upload--dragover')).toBe(false);
    });
  });

  describe('file validation', () => {
    it('accepts valid XLSX file', () => {
      createFileUpload(container, events);

      const file = createFile('test.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      expect(events.onFileSelected).toHaveBeenCalledWith(file);
    });

    it('rejects non-XLSX file', () => {
      createFileUpload(container, events);

      const file = createFile('test.pdf', 1024, 'application/pdf');
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      expect(events.onError).toHaveBeenCalledWith('Wybierz plik w formacie XLSX');
    });

    it('rejects file over 10MB', () => {
      createFileUpload(container, events);

      const file = createFile('big.xlsx', 11 * 1024 * 1024);
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      expect(events.onError).toHaveBeenCalledWith('Plik jest za duzy (maksymalnie 10 MB)');
    });

    it('rejects empty file', () => {
      createFileUpload(container, events);

      const file = createFile('empty.xlsx', 0);
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      expect(events.onError).toHaveBeenCalledWith('Wybrany plik jest pusty');
    });

    it('detects folder by heuristics', () => {
      createFileUpload(container, events);

      // Folders have no extension, empty type, and size exactly 0 or 4096
      const folder = createFile('Documents', 4096, '');
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(folder),
        }),
      );

      expect(events.onError).toHaveBeenCalledWith('Wybierz plik, nie folder');
    });

    it('accepts first file when multiple dropped', () => {
      createFileUpload(container, events);

      const file1 = createFile('first.xlsx', 1024);
      const file2 = createFile('second.xlsx', 2048);

      const dt = new DataTransfer();
      dt.items.add(file1);
      dt.items.add(file2);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: dt,
        }),
      );

      expect(events.onFileSelected).toHaveBeenCalledWith(file1);
      expect(events.onFileSelected).toHaveBeenCalledTimes(1);
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      createFileUpload(container, events);

      const file = createFile('test.pdf', 1024);
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      const errorEl = container.querySelector('.file-upload__error') as HTMLElement;
      expect(errorEl.hidden).toBe(false);
      expect(errorEl.textContent).toBe('Wybierz plik w formacie XLSX');
    });

    it('adds error class to drop zone', () => {
      createFileUpload(container, events);

      const file = createFile('test.pdf', 1024);
      const dropZone = container.querySelector('.file-upload') as HTMLElement;

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(file),
        }),
      );

      expect(dropZone.classList.contains('file-upload--error')).toBe(true);
    });

    it('clears error state on valid file', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      const errorEl = container.querySelector('.file-upload__error') as HTMLElement;

      // First, trigger an error
      const invalidFile = createFile('test.pdf', 1024);
      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(invalidFile),
        }),
      );

      expect(dropZone.classList.contains('file-upload--error')).toBe(true);
      expect(errorEl.hidden).toBe(false);

      // Then, drop a valid file
      const validFile = createFile('test.xlsx', 1024);
      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          dataTransfer: createDataTransfer(validFile),
        }),
      );

      expect(dropZone.classList.contains('file-upload--error')).toBe(false);
      expect(errorEl.hidden).toBe(true);
      expect(events.onFileSelected).toHaveBeenCalledWith(validFile);
    });
  });

  describe('accessibility', () => {
    it('links error to drop zone with aria-describedby', () => {
      createFileUpload(container, events);

      const dropZone = container.querySelector('.file-upload') as HTMLElement;
      const errorEl = container.querySelector('.file-upload__error') as HTMLElement;

      const describedBy = dropZone.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(errorEl.id).toBe(describedBy);
    });

    it('sets aria-live on error element for announcements', () => {
      createFileUpload(container, events);

      const errorEl = container.querySelector('.file-upload__error') as HTMLElement;
      expect(errorEl.getAttribute('aria-live')).toBe('polite');
    });
  });
});

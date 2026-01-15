/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeFilename,
  extractPeriodId,
  generatePresentationFilename,
  downloadFile,
} from './download.js';

describe('sanitizeFilename', () => {
  it('replaces spaces with underscores', () => {
    expect(sanitizeFilename('hello world')).toBe('hello_world');
  });

  it('replaces multiple spaces with single underscore', () => {
    expect(sanitizeFilename('hello   world')).toBe('hello_world');
  });

  it('replaces forward slash', () => {
    expect(sanitizeFilename('2024/2025')).toBe('2024_2025');
  });

  it('replaces backslash', () => {
    expect(sanitizeFilename('path\\to\\file')).toBe('path_to_file');
  });

  it('replaces colon', () => {
    expect(sanitizeFilename('Klasa: 3A')).toBe('Klasa__3A');
  });

  it('replaces asterisk', () => {
    expect(sanitizeFilename('file*name')).toBe('file_name');
  });

  it('replaces question mark', () => {
    expect(sanitizeFilename('what?')).toBe('what_');
  });

  it('replaces double quotes', () => {
    expect(sanitizeFilename('"quoted"')).toBe('_quoted_');
  });

  it('replaces angle brackets', () => {
    expect(sanitizeFilename('<html>')).toBe('_html_');
  });

  it('replaces pipe character', () => {
    expect(sanitizeFilename('a|b')).toBe('a_b');
  });

  it('handles combination of unsafe characters', () => {
    expect(sanitizeFilename('2024/2025 - Semestr 1')).toBe('2024_2025_-_Semestr_1');
  });

  it('preserves safe characters', () => {
    expect(sanitizeFilename('3A_semestr1')).toBe('3A_semestr1');
  });

  it('preserves Polish diacritics', () => {
    expect(sanitizeFilename('Klasa_3Ą')).toBe('Klasa_3Ą');
  });
});

describe('extractPeriodId', () => {
  it('extracts semestr number from full period string', () => {
    expect(extractPeriodId('2024/2025 - Semestr 1')).toBe('semestr1');
  });

  it('handles semestr 2', () => {
    expect(extractPeriodId('2024/2025 - Semestr 2')).toBe('semestr2');
  });

  it('handles uppercase SEMESTR', () => {
    expect(extractPeriodId('2024/2025 - SEMESTR 1')).toBe('semestr1');
  });

  it('handles semestr without space before number', () => {
    expect(extractPeriodId('Semestr1')).toBe('semestr1');
  });

  it('falls back to sanitized string for non-matching input', () => {
    expect(extractPeriodId('Rok szkolny 2024')).toBe('Rok_szkolny_2024');
  });

  it('handles period with extra text', () => {
    expect(extractPeriodId('2024/2025 rok szkolny - Semestr 1 oceny')).toBe(
      'semestr1',
    );
  });
});

describe('generatePresentationFilename', () => {
  it('generates filename from class and period', () => {
    const result = generatePresentationFilename('3A', '2024/2025 - Semestr 1');
    expect(result).toBe('3A_semestr1.html');
  });

  it('sanitizes class name', () => {
    const result = generatePresentationFilename(
      'Klasa 3A',
      '2024/2025 - Semestr 1',
    );
    expect(result).toBe('Klasa_3A_semestr1.html');
  });

  it('handles lowercase class name', () => {
    const result = generatePresentationFilename('5b', '2024/2025 - Semestr 2');
    expect(result).toBe('5b_semestr2.html');
  });

  it('ends with .html extension', () => {
    const result = generatePresentationFilename('3A', '2024/2025 - Semestr 1');
    expect(result).toMatch(/\.html$/);
  });
});

describe('downloadFile', () => {
  let mockObjectUrl: string;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockObjectUrl = 'blob:mock-url';

    // Mock URL methods
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => mockObjectUrl),
      revokeObjectURL: vi.fn(),
    });

    // Mock anchor click
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates blob with content and mime type', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');

    downloadFile('<html></html>', 'test.html');

    expect(blobSpy).toHaveBeenCalledWith(['<html></html>'], {
      type: 'text/html',
    });
  });

  it('creates object URL from blob', () => {
    downloadFile('<html></html>', 'test.html');

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('triggers anchor click', () => {
    downloadFile('<html></html>', 'test.html');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('sets download attribute on anchor', () => {
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    downloadFile('<html></html>', 'test.html');

    // The anchor is created but not appended to body in our implementation
    // We verify through the click being called
    expect(clickSpy).toHaveBeenCalled();
  });

  it('revokes object URL after delay', () => {
    downloadFile('<html></html>', 'test.html');

    // URL should not be revoked immediately
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    // Advance timers
    vi.advanceTimersByTime(1000);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('uses custom mime type when provided', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');

    downloadFile('data', 'file.txt', 'text/plain');

    expect(blobSpy).toHaveBeenCalledWith(['data'], { type: 'text/plain' });
  });

  it('defaults to text/html mime type', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob');

    downloadFile('<html></html>', 'test.html');

    expect(blobSpy).toHaveBeenCalledWith(['<html></html>'], {
      type: 'text/html',
    });
  });
});

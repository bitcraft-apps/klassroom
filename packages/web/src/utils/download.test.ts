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
    // Note: ": " (colon+space) is matched as one group, producing single underscore
    expect(sanitizeFilename('Klasa:3A')).toBe('Klasa_3A');
  });

  it('replaces asterisk', () => {
    expect(sanitizeFilename('file*name')).toBe('file_name');
  });

  it('replaces question mark and trims trailing underscore', () => {
    expect(sanitizeFilename('what?')).toBe('what');
  });

  it('replaces double quotes and trims resulting underscores', () => {
    expect(sanitizeFilename('"quoted"')).toBe('quoted');
  });

  it('replaces angle brackets and trims resulting underscores', () => {
    expect(sanitizeFilename('<html>')).toBe('html');
  });

  it('returns fallback for empty string', () => {
    expect(sanitizeFilename('')).toBe('untitled');
  });

  it('returns fallback for all unsafe characters', () => {
    expect(sanitizeFilename('???')).toBe('untitled');
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
  let capturedBlobs: Array<{ content: BlobPart[]; options: BlobPropertyBag }>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockObjectUrl = 'blob:mock-url';
    capturedBlobs = [];

    // Mock Blob to capture constructor args
    const OriginalBlob = globalThis.Blob;
    vi.stubGlobal(
      'Blob',
      class MockBlob extends OriginalBlob {
        constructor(content: BlobPart[], options: BlobPropertyBag) {
          super(content, options);
          capturedBlobs.push({ content, options });
        }
      },
    );

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

  it('creates blob with content and mime type including charset', () => {
    downloadFile('<html></html>', 'test.html');

    expect(capturedBlobs).toHaveLength(1);
    expect(capturedBlobs[0].content).toEqual(['<html></html>']);
    expect(capturedBlobs[0].options).toEqual({ type: 'text/html; charset=utf-8' });
  });

  it('creates object URL from blob', () => {
    downloadFile('<html></html>', 'test.html');

    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('triggers anchor click', () => {
    downloadFile('<html></html>', 'test.html');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('sets correct href and download attributes on anchor', () => {
    let capturedAnchor: HTMLAnchorElement | null = null;
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      capturedAnchor = this;
    });

    downloadFile('<html></html>', 'test.html');

    expect(capturedAnchor).not.toBeNull();
    expect(capturedAnchor!.href).toBe(mockObjectUrl);
    expect(capturedAnchor!.download).toBe('test.html');
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
    downloadFile('data', 'file.txt', 'text/plain');

    expect(capturedBlobs).toHaveLength(1);
    expect(capturedBlobs[0].content).toEqual(['data']);
    expect(capturedBlobs[0].options).toEqual({ type: 'text/plain' });
  });

  it('defaults to text/html mime type with UTF-8 charset', () => {
    downloadFile('<html></html>', 'test.html');

    expect(capturedBlobs).toHaveLength(1);
    expect(capturedBlobs[0].options).toEqual({ type: 'text/html; charset=utf-8' });
  });

  it('appends anchor to document body before click', () => {
    let anchorInBodyDuringClick = false;
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      anchorInBodyDuringClick = document.body.contains(this);
    });

    downloadFile('<html></html>', 'test.html');

    expect(anchorInBodyDuringClick).toBe(true);
  });

  it('removes anchor from document body after click', () => {
    downloadFile('<html></html>', 'test.html');

    const anchors = document.body.querySelectorAll('a[download]');
    expect(anchors).toHaveLength(0);
  });

  it('sets display:none on anchor for invisible download', () => {
    let capturedStyle = '';
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      capturedStyle = this.style.display;
    });

    downloadFile('<html></html>', 'test.html');

    expect(capturedStyle).toBe('none');
  });
});

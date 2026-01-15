import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

// Mock modules before importing the CLI
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  realpathSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  writeFile: vi.fn(),
}));

vi.mock('@klassroom/core', () => ({
  VERSION: '0.0.0',
}));

vi.mock('@klassroom/core/node', () => ({
  parseVulcanXlsx: vi.fn(),
  generatePresentation: vi.fn(),
}));

import { parseVulcanXlsx, generatePresentation } from '@klassroom/core/node';
import { generate } from './cli.js';

describe('generate function', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error when file does not exist', async () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = await generate('/path/to/missing.xlsx');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Plik nie istnieje: /path/to/missing.xlsx');
  });

  it('returns error for non-xlsx file', async () => {
    vi.mocked(existsSync).mockReturnValue(true);

    const result = await generate('/path/to/file.csv');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Plik musi mieć rozszerzenie .xlsx: /path/to/file.csv');
  });

  it('generates HTML from valid XLSX', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockResolvedValue('<html>test</html>');
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const result = await generate('/path/to/klasa-5b.xlsx');

    expect(result.success).toBe(true);
    expect(result.outputPath).toBe('/path/to/klasa-5b.html');
    expect(parseVulcanXlsx).toHaveBeenCalledWith('/path/to/klasa-5b.xlsx');
    expect(generatePresentation).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledWith('/path/to/klasa-5b.html', '<html>test</html>', 'utf-8');
  });

  it('returns error for parser failures', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockImplementation(() => {
      throw new Error('Unrecognized XLSX format');
    });

    const result = await generate('/path/to/invalid.xlsx');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unrecognized XLSX format');
  });

  it('returns error for generator failures', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockRejectedValue(new Error('Chart render failed'));

    const result = await generate('/path/to/file.xlsx');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Chart render failed');
  });

  it('returns error for file write failures', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockResolvedValue('<html>test</html>');
    vi.mocked(writeFile).mockRejectedValue(new Error('Permission denied'));

    const result = await generate('/path/to/file.xlsx');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });

  it('handles .XLSX extension (case insensitive)', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockResolvedValue('<html>test</html>');
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const result = await generate('/path/to/klasa-5b.XLSX');

    expect(result.success).toBe(true);
    expect(result.outputPath).toBe('/path/to/klasa-5b.html');
  });

  it('passes date option to generator when provided', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockResolvedValue('<html>test</html>');
    vi.mocked(writeFile).mockResolvedValue(undefined);

    await generate('/path/to/klasa-5b.xlsx', { date: '15 stycznia 2026' });

    expect(generatePresentation).toHaveBeenCalledWith(
      expect.anything(),
      { meetingDate: '15 stycznia 2026' },
    );
  });

  it('calls generator without options when date not provided', async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(parseVulcanXlsx).mockReturnValue({
      metadata: {
        className: '5b',
        period: '2024/2025 - Semestr 1' as import('@klassroom/core').ClassPeriod,
        teacher: 'Jan Kowalski',
      },
      students: [],
    });
    vi.mocked(generatePresentation).mockResolvedValue('<html>test</html>');
    vi.mocked(writeFile).mockResolvedValue(undefined);

    await generate('/path/to/klasa-5b.xlsx');

    expect(generatePresentation).toHaveBeenCalledWith(
      expect.anything(),
      { meetingDate: undefined, aiConclusions: undefined },
    );
  });
});

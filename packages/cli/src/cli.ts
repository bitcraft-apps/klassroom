import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { Command } from 'commander';
import { VERSION } from '@klassroom/core';
import {
  parseVulcanXlsx,
  generatePresentation,
  type GeneratePresentationOptions,
} from '@klassroom/core/node';

export interface GenerateOptions {
  date?: string;
  ai?: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export async function generate(
  xlsxPath: string,
  options?: GenerateOptions,
): Promise<GenerateResult> {
  // Check if file exists
  if (!existsSync(xlsxPath)) {
    return { success: false, error: `Plik nie istnieje: ${xlsxPath}` };
  }

  // Verify .xlsx extension
  if (extname(xlsxPath).toLowerCase() !== '.xlsx') {
    return {
      success: false,
      error: `Plik musi mieć rozszerzenie .xlsx: ${xlsxPath}`,
    };
  }

  try {
    // Parse XLSX
    const classData = parseVulcanXlsx(xlsxPath);

    // Generate HTML with options
    const generatorOptions: GeneratePresentationOptions = {
      meetingDate: options?.date,
      aiConclusions: options?.ai,
    };
    const html = await generatePresentation(classData, generatorOptions);

    // Write output file
    const baseName = basename(xlsxPath, extname(xlsxPath));
    const outputPath = join(dirname(xlsxPath), `${baseName}.html`);
    await writeFile(outputPath, html, 'utf-8');

    return { success: true, outputPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('klassroom')
    .description('Generuje prezentacje HTML z eksportów ocen Vulcan UONET+')
    .version(VERSION);

  program
    .command('generate')
    .description('Generuje prezentację HTML z pliku XLSX')
    .argument('<xlsx-path>', 'Ścieżka do pliku XLSX z eksportu Vulcan UONET+')
    .option('-d, --date <date>', 'data zebrania na slajdzie tytułowym')
    .option('--ai', 'generuj wnioski z pomocą AI (wymaga GEMINI_API_KEY)')
    .action(async (xlsxPath: string, opts: GenerateOptions) => {
      const result = await generate(xlsxPath, opts);

      if (result.success) {
        console.log(`Wygenerowano prezentację: ${result.outputPath}`);
      } else {
        console.error(`Błąd: ${result.error}`);
        process.exit(1);
      }
    });

  return program;
}

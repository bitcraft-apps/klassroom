import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { Command } from "commander";
import {
  VERSION,
  parseVulcanXlsx,
  generatePresentation,
} from "@klassroom/core";

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export async function generate(xlsxPath: string): Promise<GenerateResult> {
  // Check if file exists
  if (!existsSync(xlsxPath)) {
    return { success: false, error: `Plik nie istnieje: ${xlsxPath}` };
  }

  // Verify .xlsx extension
  if (extname(xlsxPath).toLowerCase() !== ".xlsx") {
    return {
      success: false,
      error: `Plik musi mieć rozszerzenie .xlsx: ${xlsxPath}`,
    };
  }

  try {
    // Parse XLSX
    const classData = parseVulcanXlsx(xlsxPath);

    // Generate HTML
    const html = await generatePresentation(classData);

    // Write output file
    const baseName = basename(xlsxPath, extname(xlsxPath));
    const outputPath = join(dirname(xlsxPath), `${baseName}.html`);
    await writeFile(outputPath, html, "utf-8");

    return { success: true, outputPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name("klassroom")
    .description("Generuje prezentacje HTML z eksportów ocen Vulcan UONET+")
    .version(VERSION);

  program
    .command("generate")
    .description("Generuje prezentację HTML z pliku XLSX")
    .argument("<xlsx-path>", "Ścieżka do pliku XLSX z eksportu Vulcan UONET+")
    .action(async (xlsxPath: string) => {
      const result = await generate(xlsxPath);

      if (result.success) {
        console.log(`Wygenerowano prezentację: ${result.outputPath}`);
      } else {
        console.error(`Błąd: ${result.error}`);
        process.exit(1);
      }
    });

  return program;
}

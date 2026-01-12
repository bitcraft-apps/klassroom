#!/usr/bin/env node

import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { Command } from "commander";
import {
  VERSION,
  parseLibrusXlsx,
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
    const classData = parseLibrusXlsx(xlsxPath);

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
    .description("Generuje prezentacje HTML z eksportów ocen Librus Synergia")
    .version(VERSION);

  program
    .command("generate")
    .description("Generuje prezentację HTML z pliku XLSX")
    .argument("<xlsx-path>", "Ścieżka do pliku XLSX z eksportu Librus")
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

// Only run when executed directly (not when imported for testing)
// Using import.meta.url for reliable ES module main detection
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";

function isMain(): boolean {
  if (!process.argv[1]) return false;
  try {
    const scriptPath = realpathSync(resolve(process.argv[1]));
    const modulePath = fileURLToPath(import.meta.url);
    return scriptPath === modulePath;
  } catch {
    return false;
  }
}

if (isMain()) {
  createProgram().parse();
}

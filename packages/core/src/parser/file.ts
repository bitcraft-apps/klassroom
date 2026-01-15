/**
 * Node.js-specific file-based XLSX parsing.
 * This module requires Node.js runtime (node:fs).
 */

import * as fs from 'node:fs';
import type { ClassData } from '../types/index.js';
import { parseVulcanXlsxFromBuffer } from './buffer.js';

/**
 * Parses a Vulcan UONET+ XLSX grade export into ClassData.
 *
 * Supports XLSX files exported from Vulcan UONET+ "additional internal documentation"
 * export option. The format is identified by 6 characteristic Polish sheet names.
 *
 * Note: This function uses synchronous file I/O (fs.readFileSync).
 * Suitable for CLI usage. For browser contexts, use parseVulcanXlsxFromBuffer instead.
 *
 * @param filePath - Path to the XLSX file
 * @returns Parsed class data with GDPR-safe student records
 * @throws Error if file not found, unrecognized format, missing required sheets, or invalid structure
 *
 * @example
 * const data = parseVulcanXlsx("./grades.xlsx");
 * console.log(data.metadata.className); // "3A"
 * console.log(data.students[0].number); // 1
 */
export function parseVulcanXlsx(filePath: string): ClassData {
  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file and convert Node.js Buffer to ArrayBuffer
  const nodeBuffer = fs.readFileSync(filePath);
  const arrayBuffer = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  );

  return parseVulcanXlsxFromBuffer(arrayBuffer);
}

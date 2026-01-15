/**
 * Parser module re-exports (internal use only).
 *
 * WARNING: This barrel file imports Node.js-specific code (node:fs).
 * DO NOT import from this file in browser contexts.
 *
 * For production code, use:
 * - '@klassroom/core' or './parser/buffer.js' for browser-safe parsing
 * - '@klassroom/core/node' or './parser/file.js' for Node.js file-based parsing
 *
 * This barrel exists for internal unit testing convenience only.
 */

// Browser-safe exports
export { parseVulcanXlsxFromBuffer, detectFormat, type DetectedFormat } from './buffer.js';

// Node.js-specific exports
export { parseVulcanXlsx } from './file.js';

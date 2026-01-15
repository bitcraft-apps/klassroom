/**
 * Parser module re-exports.
 *
 * Note: This barrel file imports from both browser-safe (buffer.ts) and
 * Node-specific (file.ts) modules. For browser contexts, import directly
 * from '@klassroom/core/browser' or './parser/buffer.js' to avoid
 * pulling in Node.js dependencies.
 */

// Browser-safe exports
export { parseVulcanXlsxFromBuffer, detectFormat, type DetectedFormat } from './buffer.js';

// Node.js-specific exports
export { parseVulcanXlsx } from './file.js';

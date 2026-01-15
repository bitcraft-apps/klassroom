/**
 * Node.js entry point for @klassroom/core.
 * Import from '@klassroom/core/node' for Node.js-specific functionality.
 *
 * This module requires Node.js runtime (fs, chartjs-node-canvas).
 */

// Node.js file-based parser
export { parseVulcanXlsx } from './parser/index.js';

// Node.js presentation generator (uses chartjs-node-canvas)
export { generatePresentation } from './generator/index.js';
export type { GeneratePresentationOptions } from './generator/index.js';

// Node.js chart renderer
export {
  renderChartToDataUrl,
  PLACEHOLDER_IMAGE,
} from './generator/render-charts.js';

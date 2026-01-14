import { Chart } from 'chart.js/auto';
import type { ChartConfig } from '../charts/types.js';

// Chart dimensions matching Node.js renderer (800x400 for 2:1 aspect ratio)
const CHART_WIDTH = 800;
const CHART_HEIGHT = 400;

/**
 * Renders a Chart.js configuration to a base64-encoded PNG data URL.
 * Browser-compatible implementation using Canvas API.
 *
 * @param config - Chart.js configuration object
 * @returns Promise resolving to a data:image/png;base64,... string
 */
export async function renderChartToDataUrl<T extends string>(
  config: ChartConfig<T>,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CHART_WIDTH;
  canvas.height = CHART_HEIGHT;

  // Fill white background (matches Node.js renderer)
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, CHART_WIDTH, CHART_HEIGHT);

  // Create chart with animation disabled for immediate rendering
  const chart = new Chart(ctx, {
    ...config,
    options: {
      ...config.options,
      animation: false,
      responsive: false,
    },
  } as ConstructorParameters<typeof Chart>[1]);

  // Chart.js renders synchronously when animation is disabled
  const dataUrl = canvas.toDataURL('image/png');

  // Cleanup
  chart.destroy();

  return dataUrl;
}

/**
 * Placeholder data URL for charts that failed to render.
 * A transparent 1x1 pixel PNG.
 */
export const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

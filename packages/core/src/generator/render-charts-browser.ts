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
 * @throws Error if called outside browser environment (SSR, workers)
 */
export async function renderChartToDataUrl<T extends string>(
  config: ChartConfig<T>,
): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('renderChartToDataUrl requires a browser environment with DOM access');
  }

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
  let chart: InstanceType<typeof Chart> | null = null;
  try {
    // Type cast is safe: ChartConfig<T> is a subset of Chart.js ChartConfiguration.
    // Our charts module produces standard Chart.js configs (bar, doughnut types)
    // that the Chart constructor accepts. The generic T constrains chart types we create.
    chart = new Chart(ctx, {
      ...config,
      options: {
        ...config.options,
        animation: false,
        responsive: false,
      },
    } as ConstructorParameters<typeof Chart>[1]);

    // Chart.js renders synchronously when animation is disabled
    return canvas.toDataURL('image/png');
  } finally {
    chart?.destroy();
  }
}

/**
 * Placeholder data URL for use when chart rendering fails.
 * A transparent 1x1 pixel PNG.
 *
 * This is exported for consumers who want graceful degradation.
 * The renderChartToDataUrl function throws on errors; use this
 * placeholder in your catch block if you prefer fallback behavior.
 *
 * @example
 * ```ts
 * const dataUrl = await renderChartToDataUrl(config).catch(() => PLACEHOLDER_IMAGE);
 * ```
 */
export const PLACEHOLDER_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

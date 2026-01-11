import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import type { ChartConfig } from "../charts/types.js";

// Chart dimensions optimized for presentation display:
// 800x400 (2:1 aspect ratio) fits well in slides and scales nicely on projectors
const CHART_WIDTH = 800;
const CHART_HEIGHT = 400;

// Singleton canvas instance for efficiency
let canvasInstance: ChartJSNodeCanvas | null = null;

function getCanvas(): ChartJSNodeCanvas {
  if (!canvasInstance) {
    canvasInstance = new ChartJSNodeCanvas({
      width: CHART_WIDTH,
      height: CHART_HEIGHT,
      backgroundColour: "white",
    });
  }
  return canvasInstance;
}

/**
 * Renders a Chart.js configuration to a base64-encoded PNG data URL.
 *
 * @param config - Chart.js configuration object
 * @returns Promise resolving to a data:image/png;base64,... string
 */
export async function renderChartToDataUrl<T extends string>(
  config: ChartConfig<T>
): Promise<string> {
  const canvas = getCanvas();
  // Type cast is safe: ChartConfig<T> is a subset of Chart.js ChartConfiguration.
  // Our charts module produces standard Chart.js configs (bar, doughnut types)
  // that chartjs-node-canvas accepts. The generic T constrains chart types we create.
  const buffer = await canvas.renderToBuffer(config as Parameters<typeof canvas.renderToBuffer>[0]);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

/**
 * Placeholder data URL for charts that failed to render.
 * A transparent 1x1 pixel PNG.
 */
export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

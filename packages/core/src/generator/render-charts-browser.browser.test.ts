/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderChartToDataUrl, PLACEHOLDER_IMAGE } from './render-charts-browser.js';
import type { BarChartConfig, DoughnutChartConfig, PieChartConfig } from '../charts/types.js';

describe('renderChartToDataUrl (browser environment)', () => {
  it('returns a base64 PNG data URL for bar chart', async () => {
    const config: BarChartConfig = {
      type: 'bar',
      data: {
        labels: ['A', 'B', 'C'],
        datasets: [
          {
            data: [1, 2, 3],
            backgroundColor: '#4f46e5',
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    // Result should be different from placeholder (actual rendered chart)
    expect(result).not.toBe(PLACEHOLDER_IMAGE);
  });

  it('renders chart with options', async () => {
    const config: BarChartConfig = {
      type: 'bar',
      data: {
        labels: ['Test'],
        datasets: [
          {
            data: [42],
            backgroundColor: '#000',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: false,
        plugins: {
          legend: { display: false },
        },
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('renders doughnut chart', async () => {
    const config: DoughnutChartConfig = {
      type: 'doughnut',
      data: {
        labels: ['Red', 'Blue', 'Green'],
        datasets: [
          {
            data: [30, 50, 20],
            backgroundColor: ['#ef4444', '#3b82f6', '#22c55e'],
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('renders pie chart', async () => {
    const config: PieChartConfig = {
      type: 'pie',
      data: {
        labels: ['Category A', 'Category B'],
        datasets: [
          {
            data: [60, 40],
            backgroundColor: ['#8b5cf6', '#f59e0b'],
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('renders chart with empty data', async () => {
    const config: BarChartConfig = {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: '#fff',
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe('PLACEHOLDER_IMAGE', () => {
  it('is a valid PNG data URL', () => {
    expect(PLACEHOLDER_IMAGE).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });
});

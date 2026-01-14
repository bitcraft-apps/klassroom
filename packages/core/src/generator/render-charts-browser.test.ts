import { describe, it, expect } from 'vitest';

describe('render-charts-browser module', () => {
  it('exports renderChartToDataUrl function', async () => {
    const mod = await import('./render-charts-browser.js');
    expect(typeof mod.renderChartToDataUrl).toBe('function');
  });

  it('exports PLACEHOLDER_IMAGE as valid data URL', async () => {
    const { PLACEHOLDER_IMAGE } = await import('./render-charts-browser.js');
    expect(PLACEHOLDER_IMAGE).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });

  it('throws in non-browser environment', async () => {
    const { renderChartToDataUrl } = await import('./render-charts-browser.js');
    const config = {
      type: 'bar' as const,
      data: {
        labels: ['A'],
        datasets: [{ data: [1], backgroundColor: '#000' }],
      },
    };

    await expect(renderChartToDataUrl(config)).rejects.toThrow(
      'requires a browser environment',
    );
  });
});

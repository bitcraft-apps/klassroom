import { describe, it, expect } from "vitest";
import { renderChartToDataUrl, PLACEHOLDER_IMAGE } from "./render-charts.js";
import type { BarChartConfig } from "../charts/types.js";

describe("renderChartToDataUrl", () => {
  it("returns a base64 PNG data URL", async () => {
    const config: BarChartConfig = {
      type: "bar",
      data: {
        labels: ["A", "B", "C"],
        datasets: [
          {
            data: [1, 2, 3],
            backgroundColor: "#4f46e5",
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });

  it("renders chart with options", async () => {
    const config: BarChartConfig = {
      type: "bar",
      data: {
        labels: ["Test"],
        datasets: [
          {
            data: [42],
            backgroundColor: "#000",
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: false,
        plugins: {
          legend: { display: false },
        },
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it("renders chart with empty data", async () => {
    const config: BarChartConfig = {
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: "#fff",
          },
        ],
      },
    };

    const result = await renderChartToDataUrl(config);

    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe("PLACEHOLDER_IMAGE", () => {
  it("is a valid PNG data URL", () => {
    expect(PLACEHOLDER_IMAGE).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
  });
});

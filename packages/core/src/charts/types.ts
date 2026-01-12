/**
 * Base Chart.js configuration structure.
 * Generic over the chart type for type-safe configs.
 */
export interface ChartConfig<T extends string> {
  type: T;
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: ChartOptions;
}

/**
 * A single dataset for Chart.js charts.
 */
export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

/**
 * Common Chart.js options.
 * Subset of options used by our chart generators.
 */
export interface ChartOptions {
  indexAxis?: 'x' | 'y';
  responsive?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    x?: ScaleOptions;
    y?: ScaleOptions;
  };
}

/**
 * Chart.js scale configuration options.
 */
export interface ScaleOptions {
  beginAtZero?: boolean;
  min?: number;
  max?: number;
  title?: {
    display?: boolean;
    text?: string;
  };
}

/**
 * Bar chart configuration type.
 */
export type BarChartConfig = ChartConfig<'bar'>;

/**
 * Doughnut chart configuration type.
 */
export type DoughnutChartConfig = ChartConfig<'doughnut'>;

/**
 * Pie chart configuration type.
 */
export type PieChartConfig = ChartConfig<'pie'>;

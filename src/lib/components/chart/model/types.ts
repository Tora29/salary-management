import type {
	ChartConfiguration,
	ChartData,
	ChartDataset,
	ChartOptions,
	ChartType
} from 'chart.js';

export type { ChartConfiguration, ChartType, ChartData, ChartOptions, ChartDataset };

export interface ChartProps {
	config: ChartConfiguration;
	height?: string;
	class?: string;
}

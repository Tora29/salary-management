export interface ChartDataPoint {
	label: string;
	value: number;
	color?: string;
	metadata?: Record<string, unknown>;
}

export interface LineChartData {
	labels: string[];
	datasets: LineChartDataset[];
}

export interface LineChartDataset {
	label: string;
	data: number[];
	color?: string;
	highlighted?: boolean[];
}

export interface PieChartData {
	labels: string[];
	data: number[];
	colors?: string[];
}

export interface ChartOptions {
	responsive?: boolean;
	maintainAspectRatio?: boolean;
	showLegend?: boolean;
	showTooltip?: boolean;
	animation?: boolean;
}

export interface MonthlySalaryData {
	month: string;
	amount: number;
	grossAmount: number;
}

export interface SalaryChartData {
	year: number;
	data: MonthlySalaryData[];
}

export interface SalaryChartProps {
	data: SalaryChartData;
	height?: string;
}

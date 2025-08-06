import type { SalaryChartData } from '$entities/salary-chart/model';

export interface SalaryChartProps {
	/** 給料チャートのデータ */
	data: SalaryChartData;
	/** チャートの高さ（デフォルト: 300px） */
	height?: string;
}

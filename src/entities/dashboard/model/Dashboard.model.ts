import type { Stock } from './StockTable.model';

export interface DashboardMetrics {
	currentMonthSalary: number; // 手取り累計（今年の合計）
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	totalAssets: number;
}

export interface DashboardResponse extends DashboardMetrics {
	stocks: Stock[];
}

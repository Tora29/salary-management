import type { Stock } from '$lib/data/types';

export interface DashboardResponse {
	currentMonthSalary: number;
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	stocks: Stock[];
	totalAssets: number;
}

export interface ApiError {
	error: string;
}

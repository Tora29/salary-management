import type { ParsedSalaryData } from '$entities/salary-slip/model';

export interface MonthlySalaryData {
	month: string; // YYYY-MM format
	slips: ParsedSalaryData[];
	totalNetPay: number;
	totalEarnings: number;
	totalDeductions: number;
	count: number;
}

export interface YearStats {
	totalNetPay: number;
	totalEarnings: number;
	totalDeductions: number;
	monthCount: number;
	averageNetPay: number;
}

export interface MonthlySalaryResponse {
	monthlyData: MonthlySalaryData[];
	yearStats: YearStats;
	selectedYear: string;
	selectedMonth: string;
	availableYears: string[];
}

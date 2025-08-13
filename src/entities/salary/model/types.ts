export interface Salary {
	id: string;
	profileId: string;
	yearMonth: string;
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	isBonus: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface SalaryComparison {
	current: number;
	previous: number;
	change: number;
	changePercentage: number;
}

export interface MonthlySalaryData {
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	previousMonthComparison: SalaryComparison | null;
}

export interface YearlyTrendData {
	month: string;
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	isBonus: boolean;
}

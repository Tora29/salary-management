export interface DashboardSummary {
	currentMonth: CurrentMonthData;
	yearlyTrend: YearlyTrendData[];
	totalAssets: TotalAssetsData;
}

export interface CurrentMonthData {
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	previousMonthComparison: number;
}

export interface YearlyTrendData {
	month: string;
	netSalary: number;
	isBonus: boolean;
}

export interface TotalAssetsData {
	cash: number;
	stocks: number;
	bonds: number;
	total: number;
	previousMonthComparison: number;
}

export interface PortfolioData {
	totalValue: number;
	dailyChange: {
		amount: number;
		percentage: number;
	};
	topHoldings: Holding[];
}

export interface Holding {
	symbol: string;
	name: string;
	value: number;
	change: number;
	changePercentage: number;
}

export interface Activity {
	id: string;
	type: 'salary' | 'stock' | 'dividend';
	description: string;
	amount: number;
	date: string;
}

export interface ActivitiesResponse {
	activities: Activity[];
	hasMore: boolean;
}

export interface DashboardApiError {
	message: string;
	code?: string;
}

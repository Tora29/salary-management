export interface Stock {
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	value: number;
}

export interface DashboardMetrics {
	currentMonthSalary: number;
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	totalAssets: number;
}

export interface DashboardCardProps {
	title: string;
	value: string;
	subtitle?: string;
	icon: any;
	trend?: 'up' | 'down' | 'neutral';
}

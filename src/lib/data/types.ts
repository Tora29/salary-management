export interface Stock {
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	value: number;
}

export interface DummyData {
	currentMonthSalary: number;
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	stocks: Stock[];
	totalAssets: number;
}

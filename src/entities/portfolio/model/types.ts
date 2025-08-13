export interface Portfolio {
	totalValue: number;
	dailyChange: ChangeData;
	topHoldings: Holding[];
}

export interface ChangeData {
	amount: number;
	percentage: number;
}

export interface Holding {
	id: string;
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	value: number;
	change: number;
	changePercentage: number;
}

export interface PortfolioSummary {
	totalValue: number;
	totalCost: number;
	totalReturn: number;
	totalReturnPercentage: number;
	dailyChange: ChangeData;
	holdings: Holding[];
}

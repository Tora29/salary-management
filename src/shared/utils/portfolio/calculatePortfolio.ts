export interface StockHolding {
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	purchaseDate: Date | string;
}

export interface PortfolioSummary {
	totalValue: number;
	totalCost: number;
	totalGainLoss: number;
	totalGainLossPercentage: number;
	holdings: PortfolioHolding[];
}

export interface PortfolioHolding extends StockHolding {
	currentValue: number;
	gainLoss: number;
	gainLossPercentage: number;
	allocation: number;
}

export const calculatePortfolioSummary = (holdings: StockHolding[]): PortfolioSummary => {
	let totalValue = 0;
	let totalCost = 0;

	const calculatedHoldings = holdings.map((holding) => {
		const currentValue = holding.quantity * holding.currentPrice;
		const cost = holding.quantity * holding.purchasePrice;
		const gainLoss = currentValue - cost;
		const gainLossPercentage = cost > 0 ? (gainLoss / cost) * 100 : 0;

		totalValue += currentValue;
		totalCost += cost;

		return {
			...holding,
			currentValue,
			gainLoss,
			gainLossPercentage,
			allocation: 0
		};
	});

	const portfolioHoldings: PortfolioHolding[] = calculatedHoldings.map((holding) => ({
		...holding,
		allocation: totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0
	}));

	const totalGainLoss = totalValue - totalCost;
	const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

	return {
		totalValue,
		totalCost,
		totalGainLoss,
		totalGainLossPercentage,
		holdings: portfolioHoldings.sort((a, b) => b.currentValue - a.currentValue)
	};
};

export const calculateDailyChange = (
	currentPrice: number,
	previousClose: number
): { amount: number; percentage: number } => {
	const amount = currentPrice - previousClose;
	const percentage = previousClose > 0 ? (amount / previousClose) * 100 : 0;

	return { amount, percentage };
};

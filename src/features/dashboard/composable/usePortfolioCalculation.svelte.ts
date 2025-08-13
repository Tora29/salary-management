import type { PortfolioData, Holding } from '../model/types';

interface PortfolioMetrics {
	totalValue: number;
	totalGainLoss: number;
	totalGainLossPercentage: number;
	topGainers: Holding[];
	topLosers: Holding[];
	diversificationScore: number;
}

export function usePortfolioCalculation(): {
	calculateMetrics: (portfolio: PortfolioData | null) => PortfolioMetrics | null;
	formatCurrency: (value: number) => string;
	formatPercentage: (value: number) => string;
} {
	function calculateMetrics(portfolio: PortfolioData | null): PortfolioMetrics | null {
		if (!portfolio) {
			return null;
		}

		const holdings = portfolio.topHoldings;

		const totalGainLoss = holdings.reduce((sum, holding) => sum + holding.change, 0);
		const totalCost = portfolio.totalValue - totalGainLoss;
		const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

		const topGainers = [...holdings]
			.filter((h) => h.changePercentage > 0)
			.sort((a, b) => b.changePercentage - a.changePercentage)
			.slice(0, 3);

		const topLosers = [...holdings]
			.filter((h) => h.changePercentage < 0)
			.sort((a, b) => a.changePercentage - b.changePercentage)
			.slice(0, 3);

		const diversificationScore = calculateDiversificationScore(holdings, portfolio.totalValue);

		return {
			totalValue: portfolio.totalValue,
			totalGainLoss,
			totalGainLossPercentage,
			topGainers,
			topLosers,
			diversificationScore
		};
	}

	function calculateDiversificationScore(holdings: Holding[], totalValue: number): number {
		if (holdings.length === 0 || totalValue === 0) {
			return 0;
		}

		const weights = holdings.map((h) => h.value / totalValue);
		const herfindahlIndex = weights.reduce((sum, w) => sum + w * w, 0);

		const score = (1 - herfindahlIndex) * 100;
		return Math.min(100, Math.max(0, score));
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(value);
	}

	function formatPercentage(value: number): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	return {
		calculateMetrics,
		formatCurrency,
		formatPercentage
	};
}

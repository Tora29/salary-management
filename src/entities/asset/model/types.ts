export type AssetType = 'stock' | 'bond' | 'cash' | 'other';

export interface Asset {
	id: string;
	profileId: string;
	assetType: AssetType;
	name: string;
	symbol?: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	currency: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface AssetSummary {
	totalValue: number;
	cashValue: number;
	stockValue: number;
	bondValue: number;
	otherValue: number;
}

export interface TotalAssetsData {
	cash: number;
	stocks: number;
	bonds: number;
	total: number;
	previousMonthComparison: AssetComparison | null;
}

export interface AssetComparison {
	current: number;
	previous: number;
	change: number;
	changePercentage: number;
}

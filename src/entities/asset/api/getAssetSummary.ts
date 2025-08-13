import type { AssetSummary, Asset } from '../model/types';

export function calculateAssetSummary(assets: Asset[]): AssetSummary {
	const summary: AssetSummary = {
		totalValue: 0,
		cashValue: 0,
		stockValue: 0,
		bondValue: 0,
		otherValue: 0
	};

	for (const asset of assets) {
		const value = asset.currentPrice * asset.quantity;
		summary.totalValue += value;

		switch (asset.assetType) {
			case 'cash':
				summary.cashValue += value;
				break;
			case 'stock':
				summary.stockValue += value;
				break;
			case 'bond':
				summary.bondValue += value;
				break;
			case 'other':
				summary.otherValue += value;
				break;
		}
	}

	return summary;
}

export async function getAssetSummary(profileId: string): Promise<AssetSummary | null> {
	try {
		const response = await fetch(`/api/assets/summary?profileId=${profileId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch asset summary');
		}
		return await response.json();
	} catch (error) {
		console.error('Error fetching asset summary:', error);
		return null;
	}
}

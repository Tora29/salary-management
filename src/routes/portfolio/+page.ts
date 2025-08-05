import type { PageLoad } from './$types';
import type { Stock } from '$entities/dashboard/model';

export const load: PageLoad = async ({ fetch }) => {
	try {
		// APIから株式データを取得
		const response = await fetch('/api/portfolio');
		if (!response.ok) {
			throw new Error(`Portfolio API error: ${response.status}`);
		}

		const stocks: Stock[] = await response.json();

		return {
			stocks
		};
	} catch (error) {
		console.error('Failed to load portfolio data:', error);
		return {
			stocks: [] as Stock[],
			error: (error instanceof Error ? error.message : '株式データの読み込みに失敗しました') as string | null
		};
	}
};

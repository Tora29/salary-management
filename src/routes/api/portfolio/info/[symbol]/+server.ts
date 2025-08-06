import type { RequestHandler } from './$types';

import { getStockInfo } from '$features/portfolio/api/stockInfoService';
import { json } from '@sveltejs/kit';

/**
 * GET: 証券コードから銘柄情報を取得
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { symbol } = params;
		console.log(`[API] Fetching stock info for symbol: ${symbol}`);

		const stockInfo = await getStockInfo(symbol);

		if (!stockInfo) {
			console.log(`[API] Stock info not found for symbol: ${symbol}`);
			return json({ error: '銘柄が見つかりません' }, { status: 404 });
		}

		console.log(`[API] Stock info found:`, stockInfo);
		return json(stockInfo);
	} catch (error) {
		console.error('[API] Failed to fetch stock info:', error);
		console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		return json({ error: '銘柄情報の取得に失敗しました' }, { status: 500 });
	}
};

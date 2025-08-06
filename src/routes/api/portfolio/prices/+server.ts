import type { RequestHandler } from './$types';

import { getCachedStockPrices } from '$features/portfolio/api/stockPriceProvider';
import { json } from '@sveltejs/kit';
import { z } from 'zod';

const requestSchema = z.object({
	symbols: z.array(z.string()).min(1).max(50) // 一度に50銘柄まで
});

/**
 * POST: 複数の株価を一括取得
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { symbols } = requestSchema.parse(body);

		// キャッシュ付きで株価を取得
		const stockPrices = await getCachedStockPrices(symbols);

		return json({ quotes: stockPrices, errors: [] });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 });
		}

		console.error('Failed to fetch stock prices:', error);
		return json({ error: 'Failed to fetch stock prices' }, { status: 500 });
	}
};

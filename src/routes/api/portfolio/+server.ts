import type { RequestHandler } from './$types';

import { portfolioRepository } from '$features/portfolio/api/portfolioRepository';
import type { StockFormData } from '$features/portfolio/model';
import { json } from '@sveltejs/kit';

/**
 * GET: すべての株式を取得
 */
export const GET: RequestHandler = async () => {
	try {
		const stocks = await portfolioRepository.findAll();
		return json(stocks);
	} catch (error) {
		console.error('Failed to fetch stocks:', error);
		return json({ error: '株式データの取得に失敗しました' }, { status: 500 });
	}
};

/**
 * POST: 新規株式を追加
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: StockFormData = await request.json();

		// 既存チェック
		const existingStock = await portfolioRepository.findBySymbol(data.symbol);
		if (existingStock) {
			return json({ error: 'この証券コードの株式はすでに登録されています' }, { status: 400 });
		}

		// 新規株式を作成
		const newStock = await portfolioRepository.create(data);
		return json(newStock, { status: 201 });
	} catch (error) {
		console.error('Failed to add stock:', error);
		return json({ error: '株式の追加に失敗しました' }, { status: 500 });
	}
};

import type { RequestHandler } from './$types';

import { portfolioRepository } from '$features/portfolio/api/portfolioRepository';
import type { StockFormData } from '$features/portfolio/model';
import { json } from '@sveltejs/kit';

/**
 * PUT: 株式を更新
 */
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { symbol } = params;
		const data: StockFormData = await request.json();

		const existingStock = await portfolioRepository.findBySymbol(symbol);
		if (!existingStock) {
			return json({ error: '株式が見つかりません' }, { status: 404 });
		}

		const updatedStock = await portfolioRepository.update(symbol, data);
		return json(updatedStock);
	} catch (error) {
		console.error('Failed to update stock:', error);
		return json({ error: '株式の更新に失敗しました' }, { status: 500 });
	}
};

/**
 * DELETE: 株式を削除
 */
export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { symbol } = params;

		const existingStock = await portfolioRepository.findBySymbol(symbol);
		if (!existingStock) {
			return json({ error: '株式が見つかりません' }, { status: 404 });
		}

		await portfolioRepository.delete(symbol);
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('Failed to delete stock:', error);
		return json({ error: '株式の削除に失敗しました' }, { status: 500 });
	}
};

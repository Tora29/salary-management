import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stock } from '$entities/dashboard/model';
import type { StockFormData } from '$features/portfolio/model';

// 親ディレクトリのストアを使用（実際の実装ではデータベースを使用）
declare global {
	// eslint-disable-next-line no-var
	var portfolioStocksStore: Map<string, Stock> | undefined;
}

// グローバルストアの初期化
if (!globalThis.portfolioStocksStore) {
	globalThis.portfolioStocksStore = new Map<string, Stock>();

	// 初期データ
	const initialStocks: Stock[] = [
		{
			symbol: '7203',
			name: 'トヨタ自動車',
			quantity: 100,
			purchasePrice: 2500,
			currentPrice: 2650,
			value: 265000
		},
		{
			symbol: '6758',
			name: 'ソニーグループ',
			quantity: 50,
			purchasePrice: 14000,
			currentPrice: 13500,
			value: 675000
		}
	];

	initialStocks.forEach((stock) => {
		globalThis.portfolioStocksStore!.set(stock.symbol, stock);
	});
}

const stocksStore = globalThis.portfolioStocksStore;

/**
 * PUT: 株式を更新
 */
export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const { symbol } = params;
		const data: StockFormData = await request.json();

		const existingStock = stocksStore.get(symbol);
		if (!existingStock) {
			return json({ error: '株式が見つかりません' }, { status: 404 });
		}

		// 更新された株式を作成
		const updatedStock: Stock = {
			...existingStock,
			name: data.name,
			quantity: data.quantity,
			purchasePrice: data.purchasePrice,
			value: data.quantity * existingStock.currentPrice
		};

		stocksStore.set(symbol, updatedStock);
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

		if (!stocksStore.has(symbol)) {
			return json({ error: '株式が見つかりません' }, { status: 404 });
		}

		stocksStore.delete(symbol);
		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('Failed to delete stock:', error);
		return json({ error: '株式の削除に失敗しました' }, { status: 500 });
	}
};

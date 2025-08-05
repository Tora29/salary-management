import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stock } from '$entities/dashboard/model';
import type { StockFormData } from '$features/portfolio/model';

// グローバルストアの型定義
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
 * GET: すべての株式を取得
 */
export const GET: RequestHandler = async () => {
	const stocks = Array.from(stocksStore.values());
	return json(stocks);
};

/**
 * POST: 新規株式を追加
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: StockFormData = await request.json();

		// 既存チェック
		if (stocksStore.has(data.symbol)) {
			return json({ error: 'この証券コードの株式はすでに登録されています' }, { status: 400 });
		}

		// 新規株式を作成
		const newStock: Stock = {
			symbol: data.symbol,
			name: data.name,
			quantity: data.quantity,
			purchasePrice: data.purchasePrice,
			currentPrice: data.purchasePrice, // 初期値は購入価格と同じ
			value: data.quantity * data.purchasePrice
		};

		stocksStore.set(data.symbol, newStock);
		return json(newStock, { status: 201 });
	} catch (error) {
		console.error('Failed to add stock:', error);
		return json({ error: '株式の追加に失敗しました' }, { status: 500 });
	}
};

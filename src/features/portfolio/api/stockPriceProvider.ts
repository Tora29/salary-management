/**
 * 株価取得サービス（サーバーサイド）
 *
 * 現在はモックデータを返すが、将来的には実際のAPIを使用
 */
import type { StockQuote } from '$entities/stock-price/model';

/**
 * モックの株価データ
 */
const MOCK_PRICES: Record<string, Partial<StockQuote>> = {
	'7203': {
		regularMarketPrice: 2850.5,
		regularMarketChange: 45.5,
		regularMarketChangePercent: 1.62
	},
	'7267': {
		regularMarketPrice: 3455.0,
		regularMarketChange: -25.0,
		regularMarketChangePercent: -0.72
	},
	'6758': {
		regularMarketPrice: 14230.0,
		regularMarketChange: 180.0,
		regularMarketChangePercent: 1.28
	},
	'9984': {
		regularMarketPrice: 6890.0,
		regularMarketChange: -120.0,
		regularMarketChangePercent: -1.71
	},
	'7974': {
		regularMarketPrice: 7125.0,
		regularMarketChange: 85.0,
		regularMarketChangePercent: 1.21
	},
	'4063': {
		regularMarketPrice: 5230.0,
		regularMarketChange: 60.0,
		regularMarketChangePercent: 1.16
	},
	'6861': {
		regularMarketPrice: 68900.0,
		regularMarketChange: 450.0,
		regularMarketChangePercent: 0.66
	},
	'9983': {
		regularMarketPrice: 39800.0,
		regularMarketChange: -250.0,
		regularMarketChangePercent: -0.62
	}
};

/**
 * 複数の株価を取得
 * @param symbols 証券コードの配列
 * @returns 株価情報の配列
 */
export async function getStockPrices(symbols: string[]): Promise<StockQuote[]> {
	const quotes: StockQuote[] = [];

	for (const symbol of symbols) {
		const mockData = MOCK_PRICES[symbol];
		if (mockData) {
			quotes.push({
				symbol,
				regularMarketPrice: mockData.regularMarketPrice || 0,
				regularMarketChange: mockData.regularMarketChange || 0,
				regularMarketChangePercent: mockData.regularMarketChangePercent || 0,
				regularMarketTime: new Date(),
				currency: 'JPY',
				marketState: 'REGULAR'
			});
		}
	}

	return quotes;
}

/**
 * キャッシュ付き株価取得
 * @param symbols 証券コードの配列
 * @returns 株価情報の配列
 */
export async function getCachedStockPrices(symbols: string[]): Promise<StockQuote[]> {
	// 現在はキャッシュなしで直接取得
	// 将来的にはRedisやメモリキャッシュを実装
	return getStockPrices(symbols);
}

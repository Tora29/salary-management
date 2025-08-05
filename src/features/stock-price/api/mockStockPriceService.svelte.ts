import type { StockQuote, StockPriceResponse } from '$entities/stock-price/model';

/**
 * モック株価サービス - デモ用
 *
 * 実際の株価APIがレート制限やCORS問題で使えない場合のフォールバック。
 * ランダムな価格変動をシミュレートします。
 */

// モック用の基準価格
const mockBasePrices: Record<string, number> = {
	'7203': 3150, // トヨタ自動車
	'6758': 15200, // ソニーグループ
	'6861': 65500, // キーエンス
	'9984': 9200, // ソフトバンクグループ
	AAPL: 180.5, // Apple
	GOOGL: 140.2, // Google
	MSFT: 380.1 // Microsoft
};

/**
 * ランダムな価格変動を生成（-3%から+3%の範囲）
 */
function generateRandomChange(): number {
	return (Math.random() - 0.5) * 0.06; // -3% to +3%
}

/**
 * モック株価を生成
 */
function generateMockQuote(symbol: string): StockQuote {
	const basePrice = mockBasePrices[symbol] || 1000;
	const changePercent = generateRandomChange();
	const currentPrice = basePrice * (1 + changePercent);
	const change = currentPrice - basePrice;

	return {
		symbol: symbol,
		regularMarketPrice: Math.round(currentPrice * 100) / 100,
		regularMarketChange: Math.round(change * 100) / 100,
		regularMarketChangePercent: Math.round(changePercent * 10000) / 100,
		regularMarketTime: new Date(),
		currency: symbol.match(/^\d{4}$/) ? 'JPY' : 'USD',
		marketState: 'REGULAR'
	};
}

/**
 * モック株価取得関数
 */
export async function getMockStockPrices(symbols: string[]): Promise<StockPriceResponse> {
	// APIの遅延をシミュレート
	await new Promise((resolve) => setTimeout(resolve, 500));

	const quotes: StockQuote[] = [];
	const errors: { symbol: string; error: string }[] = [];

	for (const symbol of symbols) {
		try {
			const quote = generateMockQuote(symbol);
			quotes.push(quote);
		} catch (error) {
			errors.push({
				symbol,
				error: 'モックデータの生成に失敗しました'
			});
		}
	}

	return { quotes, errors };
}

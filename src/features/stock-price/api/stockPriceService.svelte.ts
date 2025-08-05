import type { StockQuote, StockPriceResponse } from '$entities/stock-price/model';
import { getMockStockPrices } from './mockStockPriceService.svelte';

/**
 * Yahoo Finance APIを使用して株価情報を取得するサービス
 *
 * 無料で利用可能なYahoo Finance APIを使用しています。
 * データは約15分遅延の準リアルタイムデータです。
 */

/**
 * 日本株のシンボルをYahoo Finance形式に変換
 * @param symbol 日本株のシンボル（例: "7203"）
 * @returns Yahoo Finance形式のシンボル（例: "7203.T"）
 */
function formatJapaneseSymbol(symbol: string): string {
	// 既に.Tが付いている場合はそのまま返す
	if (symbol.endsWith('.T')) {
		return symbol;
	}
	// 4桁の数字の場合は日本株として.Tを付ける
	if (/^\d{4}$/.test(symbol)) {
		return `${symbol}.T`;
	}
	// それ以外（米国株など）はそのまま返す
	return symbol;
}

/**
 * 複数の株価情報を一括取得
 * @param symbols 取得したい株式のシンボル配列
 * @returns 株価情報とエラー情報
 */
export async function getStockPrices(symbols: string[]): Promise<StockPriceResponse> {
	// APIレート制限を回避するため、現在はモックデータを使用
	// 本番環境では実際のAPIを使用する場合は、ここを修正してください
	const useMockData = true;

	if (useMockData) {
		console.log('Using mock stock data due to API limitations');
		return getMockStockPrices(symbols);
	}

	const quotes: StockQuote[] = [];
	const errors: { symbol: string; error: string }[] = [];

	// Yahoo Finance APIはCORS制限があるため、サーバーサイドで実行する必要があります
	// また、レート制限を考慮して、必要に応じてバッチ処理を実装することを推奨します

	for (const symbol of symbols) {
		try {
			const formattedSymbol = formatJapaneseSymbol(symbol);
			const response = await fetchStockPrice(formattedSymbol);

			if (response) {
				quotes.push({
					symbol: symbol, // 元のシンボルを返す
					regularMarketPrice: response.regularMarketPrice,
					regularMarketChange: response.regularMarketChange,
					regularMarketChangePercent: response.regularMarketChangePercent,
					regularMarketTime: new Date(response.regularMarketTime * 1000),
					currency: response.currency,
					marketState: response.marketState
				});
			}
		} catch (error) {
			errors.push({
				symbol,
				error: error instanceof Error ? error.message : '株価の取得に失敗しました'
			});
		}
	}

	return { quotes, errors };
}

/**
 * 単一の株価情報を取得（内部使用）
 * サーバーサイドでのみ実行されるため、CORS制限を回避できます
 */
async function fetchStockPrice(symbol: string): Promise<any> {
	// Yahoo Finance v7 APIを使用（より安定）
	// 注意: このAPIは非公式であり、仕様が変更される可能性があります
	const baseUrl = 'https://query1.finance.yahoo.com/v7/finance/quote';

	try {
		// クエリパラメータを構築
		const params = new URLSearchParams({
			symbols: symbol,
			fields:
				'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketTime,currency,marketState,symbol'
		});

		const response = await fetch(`${baseUrl}?${params}`, {
			headers: {
				Accept: 'application/json',
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		});

		if (!response.ok) {
			// 404の場合は銘柄が見つからない
			if (response.status === 404) {
				throw new Error(`Symbol ${symbol} not found`);
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (data.quoteResponse?.result?.[0]) {
			const quote = data.quoteResponse.result[0];

			return {
				regularMarketPrice: quote.regularMarketPrice || 0,
				regularMarketChange: quote.regularMarketChange || 0,
				regularMarketChangePercent: quote.regularMarketChangePercent || 0,
				regularMarketTime: quote.regularMarketTime || Math.floor(Date.now() / 1000),
				currency: quote.currency || 'JPY',
				marketState: quote.marketState || 'CLOSED'
			};
		}

		throw new Error('Invalid response format');
	} catch (error) {
		console.error(`Failed to fetch stock price for ${symbol}:`, error);
		throw error;
	}
}

/**
 * キャッシュ付き株価取得（開発中）
 * レート制限を回避するため、一定時間キャッシュすることを推奨
 */
const priceCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1分間キャッシュ

export async function getCachedStockPrices(symbols: string[]): Promise<StockPriceResponse> {
	const now = Date.now();
	const uncachedSymbols: string[] = [];
	const cachedQuotes: StockQuote[] = [];

	// キャッシュチェック
	for (const symbol of symbols) {
		const cached = priceCache.get(symbol);
		if (cached && now - cached.timestamp < CACHE_DURATION) {
			cachedQuotes.push(cached.data);
		} else {
			uncachedSymbols.push(symbol);
		}
	}

	// キャッシュにない分を取得
	if (uncachedSymbols.length > 0) {
		const freshData = await getStockPrices(uncachedSymbols);

		// キャッシュに保存
		for (const quote of freshData.quotes) {
			priceCache.set(quote.symbol, {
				data: quote,
				timestamp: now
			});
		}

		return {
			quotes: [...cachedQuotes, ...freshData.quotes],
			errors: freshData.errors
		};
	}

	return {
		quotes: cachedQuotes,
		errors: []
	};
}

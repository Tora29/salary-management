/**
 * Stooq API を使用した無料株価・銘柄情報取得サービス
 *
 * Stooq API の特徴：
 * - 完全無料、制限なし
 * - 登録不要
 * - 日本株対応（.t サフィックス）
 * - CSV形式でデータ取得
 */
import type { StockInfo } from './stockInfoService';

/**
 * Stooq API のレスポンス形式
 * CSV: Symbol,Date,Time,Open,High,Low,Close,Volume,Name
 */
interface StooqResponse {
	symbol: string;
	date: string;
	time: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
	name: string;
}

/**
 * CSV行をパースしてStooqResponseオブジェクトに変換
 */
function parseStooqCsvLine(line: string): StooqResponse | null {
	const parts = line.split(',');
	if (parts.length < 9) return null;

	// 名前部分は複数のカンマを含む可能性があるため、最後の部分を結合
	const name = parts.slice(8).join(',').replace(/"/g, '');

	return {
		symbol: parts[0]?.replace(/"/g, '') || '',
		date: parts[1]?.replace(/"/g, '') || '',
		time: parts[2]?.replace(/"/g, '') || '',
		open: parseFloat(parts[3] || '0') || 0,
		high: parseFloat(parts[4] || '0') || 0,
		low: parseFloat(parts[5] || '0') || 0,
		close: parseFloat(parts[6] || '0') || 0,
		volume: parseInt(parts[7] || '0') || 0,
		name: name
	};
}

/**
 * Stooq API から銘柄情報を取得
 *
 * @param symbol 4桁の証券コード（例: "7203"）
 * @returns 銘柄情報または null
 */
export async function getStockInfoFromStooq(symbol: string): Promise<StockInfo | null> {
	try {
		// 4桁の数字のみ許可
		if (!/^\d{4}$/.test(symbol)) {
			return null;
		}

		// Stooq API エンドポイント
		// 形式: https://stooq.com/q/l/?s={symbol}.t&f=sd2t2ohlcv&h&e=csv
		// s = シンボル (.t = 東証)
		// f = フィールド指定
		// h = ヘッダー付き
		// e = CSV形式
		const url = `https://stooq.com/q/l/?s=${symbol}.t&f=sd2t2ohlcvn&h&e=csv`;

		console.log(`🔍 Stooq API でデータ取得中: ${url}`);

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; StockApp/1.0)',
				Accept: 'text/csv'
			}
		});

		if (!response.ok) {
			console.error(`❌ Stooq API エラー: ${response.status} ${response.statusText}`);
			return null;
		}

		const csvText = await response.text();
		console.log(`📄 CSV レスポンス:`, csvText);

		// CSV解析
		const lines = csvText.trim().split('\n');
		if (lines.length < 2) {
			console.warn('⚠️ CSV データが不正です');
			return null;
		}

		// ヘッダー行をスキップして最初のデータ行を取得
		const dataLine = lines[1];
		if (!dataLine) {
			console.warn('⚠️ データ行が存在しません');
			return null;
		}
		const stockData = parseStooqCsvLine(dataLine);

		if (!stockData) {
			console.warn('⚠️ CSV行のパースに失敗しました');
			return null;
		}

		// 銘柄名が空または "N/A" の場合は無効
		if (!stockData.name || stockData.name.toLowerCase() === 'n/a' || stockData.name.trim() === '') {
			console.warn(`⚠️ 銘柄名が無効です: "${stockData.name}"`);
			return null;
		}

		console.log(`✅ Stooq API から銘柄情報を取得: ${symbol} = ${stockData.name}`);

		return {
			symbol: symbol,
			name: stockData.name,
			market: '東証'
		};
	} catch (error) {
		console.error('❌ Stooq API エラー:', error);
		return null;
	}
}

/**
 * 複数の銘柄情報を一括取得
 *
 * @param symbols 証券コードの配列
 * @returns 銘柄情報の配列
 */
export async function getMultipleStockInfoFromStooq(symbols: string[]): Promise<StockInfo[]> {
	const results: StockInfo[] = [];

	// 同時実行数を制限（APIに優しく）
	const batchSize = 5;

	for (let i = 0; i < symbols.length; i += batchSize) {
		const batch = symbols.slice(i, i + batchSize);
		const batchPromises = batch.map((symbol) => getStockInfoFromStooq(symbol));

		const batchResults = await Promise.all(batchPromises);

		// null以外の結果のみ追加
		results.push(...batchResults.filter((result): result is StockInfo => result !== null));

		// APIに優しく少し待機
		if (i + batchSize < symbols.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return results;
}

/**
 * API接続テスト
 */
export async function testStooqApi(): Promise<boolean> {
	try {
		// トヨタ自動車でテスト
		const result = await getStockInfoFromStooq('7203');
		return result !== null;
	} catch {
		return false;
	}
}

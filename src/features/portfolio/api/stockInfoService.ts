/**
 * 証券コードから銘柄情報を取得するサービス
 */
import { getStockInfoFromStooq } from './stooqApiService';

export interface StockInfo {
	symbol: string;
	name: string;
	market?: string;
}

/**
 * 日本の主要銘柄の証券コードと銘柄名のマッピング
 * 実際のプロダクションでは外部APIやデータベースから取得
 */
const STOCK_INFO_MAP: Record<string, StockInfo> = {
	// 自動車・輸送機
	'7203': { symbol: '7203', name: 'トヨタ自動車', market: '東証プライム' },
	'7267': { symbol: '7267', name: 'ホンダ', market: '東証プライム' },
	'7201': { symbol: '7201', name: '日産自動車', market: '東証プライム' },
	'7261': { symbol: '7261', name: 'マツダ', market: '東証プライム' },
	'7270': { symbol: '7270', name: 'SUBARU', market: '東証プライム' },

	// 電気機器
	'6758': { symbol: '6758', name: 'ソニーグループ', market: '東証プライム' },
	'6861': { symbol: '6861', name: 'キーエンス', market: '東証プライム' },
	'6501': { symbol: '6501', name: '日立製作所', market: '東証プライム' },
	'6954': { symbol: '6954', name: 'ファナック', market: '東証プライム' },
	'6752': { symbol: '6752', name: 'パナソニック ホールディングス', market: '東証プライム' },
	'6902': { symbol: '6902', name: 'デンソー', market: '東証プライム' },
	'6503': { symbol: '6503', name: '三菱電機', market: '東証プライム' },
	'6762': { symbol: '6762', name: 'TDK', market: '東証プライム' },

	// 情報・通信業
	'9984': { symbol: '9984', name: 'ソフトバンクグループ', market: '東証プライム' },
	'4689': { symbol: '4689', name: 'LINEヤフー', market: '東証プライム' },
	'9613': { symbol: '9613', name: 'エヌ・ティ・ティ・データ', market: '東証プライム' },
	'9432': { symbol: '9432', name: '日本電信電話', market: '東証プライム' },
	'9434': { symbol: '9434', name: 'ソフトバンク', market: '東証プライム' },
	'4751': { symbol: '4751', name: 'サイバーエージェント', market: '東証プライム' },
	'3659': { symbol: '3659', name: 'ネクソン', market: '東証プライム' },

	// 金融業
	'8306': { symbol: '8306', name: '三菱UFJフィナンシャル・グループ', market: '東証プライム' },
	'8316': { symbol: '8316', name: '三井住友フィナンシャルグループ', market: '東証プライム' },
	'8411': { symbol: '8411', name: 'みずほフィナンシャルグループ', market: '東証プライム' },
	'8058': { symbol: '8058', name: '三菱商事', market: '東証プライム' },
	'8031': { symbol: '8031', name: '三井物産', market: '東証プライム' },

	// 小売業
	'9983': { symbol: '9983', name: 'ファーストリテイリング', market: '東証プライム' },
	'3382': { symbol: '3382', name: 'セブン&アイ・ホールディングス', market: '東証プライム' },
	'8267': { symbol: '8267', name: 'イオン', market: '東証プライム' },
	'3099': { symbol: '3099', name: '三越伊勢丹ホールディングス', market: '東証プライム' },

	// 医薬品
	'4568': { symbol: '4568', name: '第一三共', market: '東証プライム' },
	'4502': { symbol: '4502', name: '武田薬品工業', market: '東証プライム' },
	'4523': { symbol: '4523', name: 'エーザイ', market: '東証プライム' },
	'4578': { symbol: '4578', name: '大塚ホールディングス', market: '東証プライム' },

	// ゲーム・エンターテイメント
	'7974': { symbol: '7974', name: '任天堂', market: '東証プライム' },
	'6178': { symbol: '6178', name: '日本郵政', market: '東証プライム' },
	'9766': { symbol: '9766', name: 'コナミグループ', market: '東証プライム' },
	'7832': { symbol: '7832', name: 'バンダイナムコホールディングス', market: '東証プライム' },

	// エネルギー・商社
	'1605': { symbol: '1605', name: '国際石油開発帝石', market: '東証プライム' },
	'5020': { symbol: '5020', name: 'ENEOSホールディングス', market: '東証プライム' },
	'1928': { symbol: '1928', name: '積水ハウス', market: '東証プライム' },

	// 建設業
	'1801': { symbol: '1801', name: '大成建設', market: '東証プライム' },
	'1802': { symbol: '1802', name: '大林組', market: '東証プライム' },
	'1803': { symbol: '1803', name: '清水建設', market: '東証プライム' },
	'1925': { symbol: '1925', name: '大和ハウス工業', market: '東証プライム' },

	// 化学
	'4063': { symbol: '4063', name: '信越化学工業', market: '東証プライム' },
	'4188': { symbol: '4188', name: '三菱ケミカルグループ', market: '東証プライム' },
	'4005': { symbol: '4005', name: '住友化学', market: '東証プライム' },

	// 食品
	'2502': { symbol: '2502', name: 'アサヒグループホールディングス', market: '東証プライム' },
	'2503': { symbol: '2503', name: 'キリンホールディングス', market: '東証プライム' },
	'2269': { symbol: '2269', name: '明治ホールディングス', market: '東証プライム' },
	'2801': { symbol: '2801', name: 'キッコーマン', market: '東証プライム' },

	// 鉄鋼
	'5401': { symbol: '5401', name: '日本製鉄', market: '東証プライム' },
	'5411': { symbol: '5411', name: 'JFEホールディングス', market: '東証プライム' },

	// 航空・運輸
	'9201': { symbol: '9201', name: '日本航空', market: '東証プライム' },
	'9202': { symbol: '9202', name: 'ANA ホールディングス', market: '東証プライム' },
	'9020': { symbol: '9020', name: '東日本旅客鉄道', market: '東証プライム' },
	'9022': { symbol: '9022', name: '東海旅客鉄道', market: '東証プライム' }
};

/**
 * 証券コードから銘柄情報を取得
 * フォールバック戦略: Stooq API → ハードコードデータ
 */
export async function getStockInfo(symbol: string): Promise<StockInfo | null> {
	console.log(`[stockInfoService] Getting stock info for: ${symbol}`);

	// 4桁の数字のみ許可
	if (!/^\d{4}$/.test(symbol)) {
		console.log(`[stockInfoService] Invalid symbol format: ${symbol}`);
		return null;
	}

	try {
		// 1. まずStooq API から取得を試行
		console.log(`[stockInfoService] Calling Stooq API...`);
		const apiResult = await getStockInfoFromStooq(symbol);

		if (apiResult) {
			console.log(`🌐 API経由で銘柄情報を取得: ${symbol} = ${apiResult.name}`);
			return apiResult;
		}

		console.log(`⚠️ API で見つからず、ハードコードデータを確認: ${symbol}`);
	} catch (error) {
		console.error('🚨 API エラー、ハードコードデータにフォールバック:', error);
	}

	// 2. APIで取得できない場合、ハードコードされたデータを使用
	const hardcodedInfo = STOCK_INFO_MAP[symbol];
	if (hardcodedInfo) {
		console.log(`📚 ハードコードデータから取得: ${symbol} = ${hardcodedInfo.name}`);
		return hardcodedInfo;
	}

	console.log(`❌ 銘柄が見つかりません: ${symbol}`);
	return null;
}

/**
 * 銘柄名での部分検索
 */
export async function searchStocksByName(partialName: string): Promise<StockInfo[]> {
	if (!partialName || partialName.length < 1) {
		return [];
	}

	return Object.values(STOCK_INFO_MAP).filter((stock) => stock.name.includes(partialName));
}

/**
 * すべての銘柄を取得（開発用）
 */
export async function getAllStockInfo(): Promise<StockInfo[]> {
	return Object.values(STOCK_INFO_MAP);
}

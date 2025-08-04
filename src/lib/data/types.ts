/**
 * 株式銘柄情報
 */
export interface Stock {
	/** 銘柄コード */
	symbol: string;
	/** 銘柄名 */
	name: string;
	/** 保有株数 */
	quantity: number;
	/** 取得単価（円） */
	purchasePrice: number;
	/** 現在値（円） */
	currentPrice: number;
	/** 評価額（円） */
	value: number;
}

export interface DummyData {
	currentMonthSalary: number;
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	stocks: Stock[];
	totalAssets: number;
}

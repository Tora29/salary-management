export interface Stock {
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	value: number;
}

export interface StockTableProps {
	/** 表示する株式データの配列 */
	stocks: Stock[];
}

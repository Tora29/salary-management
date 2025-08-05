import type { Stock } from '$entities/dashboard/model';

export interface StockPriceUpdaterProps {
	stocks: Stock[];
	onPricesUpdate: (updatedStocks: Stock[]) => void;
	updateInterval?: number; // ミリ秒単位
}

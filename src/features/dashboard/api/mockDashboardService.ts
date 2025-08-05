import type { DashboardResponse } from '$entities/dashboard/model';
import type { Stock } from '$entities/dashboard/model';

/**
 * ダッシュボードデータを取得（モック実装）
 */
export async function getDashboardData(): Promise<DashboardResponse> {
	// ポートフォリオAPIから株式データを取得
	const stocksResponse = await fetch('http://localhost:5173/api/portfolio');
	const stocks = await stocksResponse.json();

	// 株式評価額を計算
	const stockValuation = stocks.reduce((sum: number, stock: Stock) => sum + stock.value, 0);

	// モックデータ
	return {
		currentMonthSalary: 350000,
		yearlyIncome: 4200000,
		depositBalance: 5000000,
		stockValuation,
		stocks,
		totalAssets: 5000000 + stockValuation
	};
}

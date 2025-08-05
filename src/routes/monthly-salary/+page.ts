import type { PageLoad } from './$types';
import type { MonthlySalaryResponse } from '$features/monthly-salary/api';

export const load: PageLoad = async ({ fetch, url }) => {
	// URLクエリパラメータを取得（スコープを広げる）
	const year = url.searchParams.get('year') || undefined;
	const month = url.searchParams.get('month') || undefined;

	try {
		// クエリパラメータを構築
		const params = new URLSearchParams();
		if (year) params.set('year', year);
		if (month) params.set('month', month);

		// APIからデータ取得
		const response = await fetch(`/api/monthly-salary?${params.toString()}`);
		if (!response.ok) {
			throw new Error(`Monthly salary API error: ${response.status}`);
		}

		const monthlySalaryData: MonthlySalaryResponse = await response.json();

		return {
			monthlySalaryData,
			selectedYear: year || null,
			selectedMonth: month || null
		};
	} catch (error) {
		console.error('Failed to load monthly salary data:', error);
		return {
			monthlySalaryData: {
				monthlyData: [],
				yearStats: {
					totalNetPay: 0,
					totalEarnings: 0,
					totalDeductions: 0,
					monthCount: 0,
					averageNetPay: 0
				},
				selectedYear: new Date().getFullYear().toString(),
				selectedMonth: '',
				availableYears: []
			} as MonthlySalaryResponse,
			selectedYear: year || null,
			selectedMonth: month || null,
			error: (error instanceof Error ? error.message : 'データの読み込みに失敗しました') as string | null
		};
	}
};

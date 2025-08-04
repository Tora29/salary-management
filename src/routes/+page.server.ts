import type { PageServerLoad } from './$types';
import type { DashboardResponse } from '$lib/api/types';

type PageServerData = {
	dashboardData: DashboardResponse;
	error?: string;
};

export const load: PageServerLoad<PageServerData> = async ({ fetch }) => {
	try {
		const response = await fetch('/api/dashboard');

		if (!response.ok) {
			throw new Error('Failed to fetch dashboard data');
		}

		const data: DashboardResponse = await response.json();

		return {
			dashboardData: data
		};
	} catch (error) {
		console.error('Error loading dashboard:', error);

		// エラー時はデフォルト値を返す
		return {
			dashboardData: {
				currentMonthSalary: 0,
				yearlyIncome: 0,
				depositBalance: 0,
				stockValuation: 0,
				stocks: [],
				totalAssets: 0
			},
			error: 'データの取得に失敗しました'
		};
	}
};

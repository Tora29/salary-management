import type { PageLoad } from './$types';
import type { DashboardResponse } from '$entities/dashboard/model';
import type { ParsedSalaryData } from '$entities/salary-slip/model';
import type { SalaryChartData } from '$entities/salary-chart/model';

export const load: PageLoad = async ({ fetch }) => {
	try {
		// ダッシュボードデータをAPIから取得
		const dashboardResponse = await fetch('/api/dashboard');
		if (!dashboardResponse.ok) {
			throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
		}
		const dashboardData: DashboardResponse = await dashboardResponse.json();

		// 給料明細データをAPIから取得
		const salarySlipsResponse = await fetch('/api/salary-slips');
		if (!salarySlipsResponse.ok) {
			throw new Error(`Salary slips API error: ${salarySlipsResponse.status}`);
		}
		const salarySlips: ParsedSalaryData[] = await salarySlipsResponse.json();

		// 給料チャートデータをAPIから取得
		const chartResponse = await fetch('/api/salary-chart');
		if (!chartResponse.ok) {
			throw new Error(`Salary chart API error: ${chartResponse.status}`);
		}
		const salaryChartData: SalaryChartData = await chartResponse.json();

		return {
			dashboardData,
			salarySlips,
			salaryChartData
		};
	} catch (error) {
		console.error('Error loading dashboard:', error);
		return {
			dashboardData: {
				currentMonthSalary: 0,
				yearlyIncome: 0,
				depositBalance: 0,
				stockValuation: 0,
				stocks: [],
				totalAssets: 0
			},
			salarySlips: [],
			salaryChartData: null,
			error: (error instanceof Error ? error.message : 'Unknown error') as string
		};
	}
};

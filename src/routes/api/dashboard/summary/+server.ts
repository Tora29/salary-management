import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { DashboardSummary } from '$features/dashboard/model/types';
import { createSupabaseServerClient } from '$shared/utils/supabase';

export const GET: RequestHandler = async (event) => {
	const supabase = createSupabaseServerClient(event);

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const currentDate = new Date();
		const currentMonth = currentDate.toISOString().slice(0, 7);
		const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
			.toISOString()
			.slice(0, 7);

		const startMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1)
			.toISOString()
			.slice(0, 7);

		const { data: profile } = await supabase
			.from('profiles')
			.select('id')
			.eq('user_id', user.id)
			.single();

		if (!profile) {
			return json({ error: 'Profile not found' }, { status: 404 });
		}

		const { data: currentMonthSalary } = await supabase
			.from('salaries')
			.select('net_salary, basic_salary, overtime, allowances, deductions')
			.eq('profile_id', profile.id)
			.eq('year_month', currentMonth)
			.single();

		const { data: previousMonthSalary } = await supabase
			.from('salaries')
			.select('net_salary')
			.eq('profile_id', profile.id)
			.eq('year_month', previousMonth)
			.single();

		const { data: yearlyData } = await supabase
			.from('salaries')
			.select('year_month, net_salary')
			.eq('profile_id', profile.id)
			.gte('year_month', startMonth)
			.lte('year_month', currentMonth)
			.order('year_month', { ascending: true });

		const { data: assets } = await supabase
			.from('assets')
			.select('asset_type, current_price, quantity')
			.eq('profile_id', profile.id);

		const totalIncome = currentMonthSalary
			? Number(currentMonthSalary.basic_salary) +
				Number(currentMonthSalary.overtime || 0) +
				Number(currentMonthSalary.allowances || 0)
			: 0;

		const currentMonthData = {
			netSalary: Number(currentMonthSalary?.net_salary || 0),
			totalIncome,
			totalDeductions: Number(currentMonthSalary?.deductions || 0),
			previousMonthComparison: previousMonthSalary
				? ((Number(currentMonthSalary?.net_salary || 0) - Number(previousMonthSalary.net_salary)) /
						Number(previousMonthSalary.net_salary)) *
					100
				: 0
		};

		type YearlyDataItem = {
			year_month: string;
			net_salary: number;
		};

		type AssetItem = {
			asset_type: string;
			current_price: number;
			quantity: number;
		};

		const yearlyTrend = (yearlyData || []).map((item: YearlyDataItem) => {
			const month = parseInt(item.year_month.split('-')[1] ?? '1', 10);
			const isBonus = month === 6 || month === 12;
			return {
				month: item.year_month,
				netSalary: Number(item.net_salary || 0),
				isBonus
			};
		});

		const cashAssets = (yearlyData || []).reduce(
			(sum: number, item: YearlyDataItem) => sum + Number(item.net_salary || 0),
			0
		);
		const stockAssets = (assets || [])
			.filter((a: AssetItem) => a.asset_type === 'stock')
			.reduce(
				(sum: number, asset: AssetItem) =>
					sum + Number(asset.current_price) * Number(asset.quantity),
				0
			);
		const bondAssets = (assets || [])
			.filter((a: AssetItem) => a.asset_type === 'bond')
			.reduce(
				(sum: number, asset: AssetItem) =>
					sum + Number(asset.current_price) * Number(asset.quantity),
				0
			);

		const totalAssets = {
			cash: cashAssets,
			stocks: stockAssets,
			bonds: bondAssets,
			total: cashAssets + stockAssets + bondAssets,
			previousMonthComparison: 0
		};

		const summary: DashboardSummary = {
			currentMonth: currentMonthData,
			yearlyTrend,
			totalAssets
		};

		return json(summary);
	} catch (error) {
		console.error('Dashboard summary error:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};

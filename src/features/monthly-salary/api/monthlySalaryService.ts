import { getAllSalarySlips } from '$features/salary-slip/api';
import type { MonthlySalaryData, YearStats, MonthlySalaryResponse } from '../model/types';

/**
 * 月別給料データを取得
 */
export async function getMonthlySalaryData(
	year?: string,
	selectedMonth?: string
): Promise<MonthlySalaryResponse> {
	const targetYear = year || new Date().getFullYear().toString();
	const targetMonth = selectedMonth || '';

	// 全ての給料明細を取得
	const formattedSlips = await getAllSalarySlips();

	// 指定年でフィルタリング
	const yearFilteredSlips = formattedSlips.filter((slip) => {
		const match = slip.salarySlip.paymentDate.match(/(\d{4})年/);
		return match && match[1] === targetYear;
	});

	// 月別にグループ化
	const monthlyData: { [key: string]: MonthlySalaryData } = {};

	yearFilteredSlips.forEach((slip) => {
		// 支給日から年月を抽出 (YYYY年MM月DD日 -> YYYY-MM)
		const match = slip.salarySlip.paymentDate.match(/(\d{4})年(\d{1,2})月/);
		if (!match) return;

		const monthKey = `${match[1]}-${match[2]!.padStart(2, '0')}`;

		if (!monthlyData[monthKey]) {
			monthlyData[monthKey] = {
				month: monthKey,
				slips: [],
				totalNetPay: 0,
				totalEarnings: 0,
				totalDeductions: 0,
				count: 0
			};
		}

		monthlyData[monthKey].slips.push(slip);
		monthlyData[monthKey].totalNetPay += slip.salarySlip.netPay;
		monthlyData[monthKey].totalEarnings += slip.salarySlip.earnings.total;
		monthlyData[monthKey].totalDeductions += slip.salarySlip.deductions.total;
		monthlyData[monthKey].count++;
	});

	// 月別データを配列に変換してソート
	const sortedMonthlyData = Object.values(monthlyData).sort((a, b) =>
		b.month.localeCompare(a.month)
	);

	// 年度の統計
	const yearStats: YearStats = {
		totalNetPay: sortedMonthlyData.reduce((sum, month) => sum + month.totalNetPay, 0),
		totalEarnings: sortedMonthlyData.reduce((sum, month) => sum + month.totalEarnings, 0),
		totalDeductions: sortedMonthlyData.reduce((sum, month) => sum + month.totalDeductions, 0),
		monthCount: sortedMonthlyData.length,
		averageNetPay:
			sortedMonthlyData.length > 0
				? sortedMonthlyData.reduce((sum, month) => sum + month.totalNetPay, 0) /
					sortedMonthlyData.length
				: 0
	};

	// 利用可能な年度のリスト
	const availableYears = Array.from(
		new Set(
			formattedSlips
				.map((slip) => {
					const match = slip.salarySlip.paymentDate.match(/(\d{4})年/);
					return match ? match[1] : '';
				})
				.filter(Boolean)
		)
	)
		.sort()
		.reverse();

	return {
		monthlyData: sortedMonthlyData,
		yearStats,
		selectedYear: targetYear,
		selectedMonth: targetMonth,
		availableYears
	};
}

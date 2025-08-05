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
		// YYYY-MM-DD形式とYYYY年MM月DD日形式の両方に対応
		const dateMatch = slip.salarySlip.paymentDate.match(/^(\d{4})-\d{2}-\d{2}$/);
		const jpMatch = slip.salarySlip.paymentDate.match(/(\d{4})年/);

		if (dateMatch) {
			return dateMatch[1] === targetYear;
		} else if (jpMatch) {
			return jpMatch[1] === targetYear;
		}
		return false;
	});

	// 月別にグループ化
	const monthlyData: { [key: string]: MonthlySalaryData } = {};

	yearFilteredSlips.forEach((slip) => {
		// 支給日から年月を抽出 (YYYY-MM-DD または YYYY年MM月DD日 -> YYYY-MM)
		const dateMatch = slip.salarySlip.paymentDate.match(/^(\d{4})-(\d{2})-\d{2}$/);
		const jpMatch = slip.salarySlip.paymentDate.match(/(\d{4})年(\d{1,2})月/);

		let monthKey: string;
		if (dateMatch) {
			monthKey = `${dateMatch[1]}-${dateMatch[2]}`;
		} else if (jpMatch) {
			monthKey = `${jpMatch[1]}-${jpMatch[2]!.padStart(2, '0')}`;
		} else {
			return;
		}

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

		const monthData = monthlyData[monthKey];
		if (monthData) {
			monthData.slips.push(slip);
			monthData.totalNetPay += slip.salarySlip.netPay;
			monthData.totalEarnings += slip.salarySlip.earnings.total;
			monthData.totalDeductions += slip.salarySlip.deductions.total;
			monthData.count++;
		}
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
					// YYYY-MM-DD形式とYYYY年MM月DD日形式の両方に対応
					const dateMatch = slip.salarySlip.paymentDate.match(/^(\d{4})-\d{2}-\d{2}$/);
					const jpMatch = slip.salarySlip.paymentDate.match(/(\d{4})年/);

					if (dateMatch) {
						return dateMatch[1];
					} else if (jpMatch) {
						return jpMatch[1];
					}
					return undefined;
				})
				.filter((year): year is string => year !== undefined)
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

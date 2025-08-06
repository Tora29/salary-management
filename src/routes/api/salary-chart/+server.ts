import { BUSINESS_ERROR_MESSAGES } from '$lib/consts/businessErrorMessages';

import type { RequestHandler } from './$types';

import { getAllSalarySlips } from '$features/salary-slip/api';
import { json } from '@sveltejs/kit';

interface MonthlySalaryData {
	month: string;
	amount: number;
	grossAmount: number;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const year = url.searchParams.get('year');
		const currentYear = year ? parseInt(year) : new Date().getFullYear();

		const allSlips = await getAllSalarySlips();

		// 給料明細を月別に集計
		const monthlyData: Record<string, { netPay: number; grossPay: number }> = {};

		allSlips.forEach((slip) => {
			const paymentDate = new Date(slip.salarySlip.paymentDate);
			const slipYear = paymentDate.getFullYear();

			if (slipYear === currentYear) {
				const month = paymentDate.getMonth() + 1;
				const monthKey = `${slipYear}-${month.toString().padStart(2, '0')}`;
				monthlyData[monthKey] = {
					netPay: slip.salarySlip.netPay,
					grossPay: slip.salarySlip.earnings.total
				};
			}
		});

		// 月別データを配列に変換（1月から12月まで）
		const chartData: MonthlySalaryData[] = [];
		for (let month = 1; month <= 12; month++) {
			const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`;
			chartData.push({
				month: `${month}月`,
				amount: monthlyData[monthKey]?.netPay || 0,
				grossAmount: monthlyData[monthKey]?.grossPay || 0
			});
		}

		return json({
			year: currentYear,
			data: chartData
		});
	} catch (error) {
		console.error('Failed to fetch salary chart data:', error);
		return json({ error: BUSINESS_ERROR_MESSAGES.SALARY_SLIP.FETCH_FAILED }, { status: 500 });
	}
};

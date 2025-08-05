import { prisma } from '$lib/utils/server/prisma';
import type { DashboardResponse } from '$entities/dashboard/model';

/**
 * ダッシュボードデータを取得
 */
export async function getDashboardData(): Promise<DashboardResponse> {
	const currentDate = new Date();
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();
	const startOfYear = new Date(currentYear, 0, 1);
	const startOfMonth = new Date(currentYear, currentMonth, 1);
	const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

	const [currentMonthSalary, yearlyIncome, stocks, assets] = await Promise.all([
		prisma.salarySlip.findFirst({
			where: {
				paymentDate: {
					gte: startOfMonth.toISOString().split('T')[0] as string,
					lte: endOfMonth.toISOString().split('T')[0] as string
				}
			},
			orderBy: {
				paymentDate: 'desc'
			}
		}),
		prisma.salarySlip.aggregate({
			_sum: {
				netPay: true
			},
			where: {
				paymentDate: {
					gte: startOfYear.toISOString().split('T')[0] as string
				}
			}
		}),
		prisma.stock.findMany({
			orderBy: {
				symbol: 'asc'
			}
		}),
		prisma.asset.findMany({
			where: {
				type: 'deposit'
			}
		})
	]);

	const depositBalance = assets.reduce((sum, asset) => {
		return sum + Number(asset.amount);
	}, 0);

	const stocksWithValue = stocks.map((stock) => ({
		symbol: stock.symbol,
		name: stock.name,
		quantity: stock.quantity,
		purchasePrice: Number(stock.purchasePrice),
		currentPrice: Number(stock.currentPrice || stock.purchasePrice),
		value: stock.quantity * Number(stock.currentPrice || stock.purchasePrice)
	}));

	const stockValuation = stocksWithValue.reduce((sum, stock) => sum + stock.value, 0);

	return {
		currentMonthSalary: Number(currentMonthSalary?.netPay || 0),
		yearlyIncome: Number(yearlyIncome._sum?.netPay || 0),
		depositBalance,
		stockValuation,
		stocks: stocksWithValue,
		totalAssets: depositBalance + stockValuation
	};
}

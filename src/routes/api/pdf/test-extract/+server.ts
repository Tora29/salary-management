import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// テスト用: 確実にデータを返すエンドポイント
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { fileId } = await request.json();
		console.log('Test extract for fileId:', fileId);

		// テスト用の固定データを返す
		const testData = {
			paymentDate: '2025年1月',
			basicSalary: 250000,
			overtimeAllowance: 35000,
			commutingAllowance: 15000,
			healthInsurance: 12500,
			pensionInsurance: 25000,
			employmentInsurance: 1500,
			incomeTax: 8500,
			residentTax: 12000,
			totalPayment: 300000,
			totalDeductions: 59500,
			netPayment: 240500
		};

		console.log('Returning test data:', testData);

		return json({
			success: true,
			extractedData: testData,
			confidence: 1.0,
			message: 'Test data (not from actual PDF)'
		});
	} catch (error) {
		console.error('Test extract error:', error);
		return json(
			{
				success: false,
				error: 'Test extraction failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

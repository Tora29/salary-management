import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SalarySlip } from '$entities/salary-slip/model';
import { saveSalarySlipWithDuplicateCheck, getAllSalarySlips } from '$features/salary-slip/api';
import { BUSINESS_ERROR_MESSAGES } from '$lib/consts/businessErrorMessages';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { salarySlip, fileName }: { salarySlip: SalarySlip; fileName: string } = data;

		// ビジネスロジックはfeatures/apiに委譲
		const result = await saveSalarySlipWithDuplicateCheck(salarySlip, fileName);

		if (!result.success) {
			const status = result.duplicate ? 409 : 500;
			return json(result, { status });
		}

		return json(result);
	} catch (error) {
		console.error('Failed to save salary slip:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		const formattedSlips = await getAllSalarySlips();
		return json(formattedSlips);
	} catch (error) {
		console.error('Failed to fetch salary slips:', error);
		return json({ error: BUSINESS_ERROR_MESSAGES.SALARY_SLIP.FETCH_FAILED }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMonthlySalaryData } from '$features/monthly-salary/api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const year = url.searchParams.get('year') || undefined;
		const selectedMonth = url.searchParams.get('month') || undefined;

		const data = await getMonthlySalaryData(year, selectedMonth);
		return json(data);
	} catch (error) {
		console.error('Monthly salary API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

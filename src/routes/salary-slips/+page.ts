import type { PageLoad } from './$types';

import type { ParsedSalaryData } from '$entities/salary-slip/model';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/salary-slips');
		if (!response.ok) {
			throw new Error(`Salary slips API error: ${response.status}`);
		}
		const salaryHistory: ParsedSalaryData[] = await response.json();

		return {
			salaryHistory
		};
	} catch (error) {
		console.error('Failed to load salary slips:', error);
		return {
			salaryHistory: [],
			error: (error instanceof Error ? error.message : 'Unknown error') as string | null
		};
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDashboardData } from '$features/dashboard/api';

export const GET: RequestHandler = async () => {
	try {
		const dashboardData = await getDashboardData();
		return json(dashboardData);
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

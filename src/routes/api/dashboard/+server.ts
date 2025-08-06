import type { RequestHandler } from './$types';

import { getDashboardData } from '$features/dashboard/api';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const dashboardData = await getDashboardData();
		return json(dashboardData);
	} catch (error) {
		console.error('Dashboard API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

import type { DashboardSummary } from '../model/types';

export async function getDashboardSummary(
	fetch: typeof globalThis.fetch
): Promise<DashboardSummary> {
	const response = await fetch('/api/dashboard/summary', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: 'Failed to fetch dashboard summary' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

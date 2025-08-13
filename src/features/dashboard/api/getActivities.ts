import type { ActivitiesResponse } from '../model/types';

export async function getActivities(
	fetch: typeof globalThis.fetch,
	limit = 5
): Promise<ActivitiesResponse> {
	const url = new URL('/api/dashboard/activities', window.location.origin);
	url.searchParams.set('limit', limit.toString());

	const response = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Failed to fetch activities' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

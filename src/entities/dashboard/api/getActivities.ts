import type { RecentActivity } from '$entities/activity/model/types';

export async function getActivities(fetch: typeof window.fetch): Promise<RecentActivity[]> {
	const response = await fetch('/api/dashboard/activities');

	if (!response.ok) {
		throw new Error(`Failed to fetch activities: ${response.statusText}`);
	}

	return response.json();
}

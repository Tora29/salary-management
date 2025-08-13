import type { DashboardSummary } from '$entities/dashboard/model/types';

export async function getSummary(fetch: typeof window.fetch): Promise<DashboardSummary> {
	const response = await fetch('/api/dashboard/summary');

	if (!response.ok) {
		throw new Error(`Failed to fetch summary: ${response.statusText}`);
	}

	return response.json();
}

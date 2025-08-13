import type { PortfolioData } from '$entities/dashboard/model/types';

export async function getPortfolio(fetch: typeof window.fetch): Promise<PortfolioData> {
	const response = await fetch('/api/dashboard/portfolio');

	if (!response.ok) {
		throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
	}

	return response.json();
}

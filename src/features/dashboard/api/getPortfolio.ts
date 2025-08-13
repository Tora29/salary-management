import type { PortfolioData } from '../model/types';

export async function getPortfolio(fetch: typeof globalThis.fetch): Promise<PortfolioData> {
	const response = await fetch('/api/dashboard/portfolio', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		},
		credentials: 'include'
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ message: 'Failed to fetch portfolio data' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

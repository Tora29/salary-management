import { getDashboardSummary } from '../api/getDashboardSummary';
import { getPortfolio } from '../api/getPortfolio';
import { getActivities } from '../api/getActivities';
import type { DashboardSummary, PortfolioData, ActivitiesResponse } from '../model/types';

interface DashboardState {
	summary: DashboardSummary | null;
	portfolio: PortfolioData | null;
	activities: ActivitiesResponse | null;
	loading: boolean;
	error: Error | null;
}

export function useDashboardData(fetch: typeof globalThis.fetch): {
	summary: DashboardSummary | null;
	portfolio: PortfolioData | null;
	activities: ActivitiesResponse | null;
	loading: boolean;
	error: Error | null;
	loadData: () => Promise<void>;
	refresh: () => Promise<void>;
} {
	const state = $state<DashboardState>({
		summary: null,
		portfolio: null,
		activities: null,
		loading: false,
		error: null
	});

	async function loadData(): Promise<void> {
		state.loading = true;
		state.error = null;

		try {
			const [summary, portfolio, activities] = await Promise.all([
				getDashboardSummary(fetch),
				getPortfolio(fetch),
				getActivities(fetch, 5)
			]);

			state.summary = summary;
			state.portfolio = portfolio;
			state.activities = activities;
		} catch (err) {
			state.error = err instanceof Error ? err : new Error('Failed to load dashboard data');
		} finally {
			state.loading = false;
		}
	}

	async function refresh(): Promise<void> {
		await loadData();
	}

	return {
		get summary() {
			return state.summary;
		},
		get portfolio() {
			return state.portfolio;
		},
		get activities() {
			return state.activities;
		},
		get loading() {
			return state.loading;
		},
		get error() {
			return state.error;
		},
		loadData,
		refresh
	};
}

// Dashboard entity types

import type {
	DashboardSummary,
	PortfolioData,
	YearlyTrendData,
	ActivitiesResponse
} from '$features/dashboard/model/types';

// Re-export types from features/dashboard for convenience
export type {
	DashboardSummary,
	PortfolioData,
	YearlyTrendData,
	ActivitiesResponse
} from '$features/dashboard/model/types';

// PortfolioOverview component types
export interface PortfolioOverviewProps {
	portfolio: PortfolioData | null;
	loading?: boolean;
	error?: Error | null;
}

// QuickActions component types
export interface QuickAction {
	id: string;
	label: string;
	icon: string;
	href: string;
	color: 'primary' | 'secondary';
}

// RecentActivities component types
export interface RecentActivitiesProps {
	activities: ActivitiesResponse | null;
	loading?: boolean;
	error?: Error | null;
}

// SummaryCards component types
export interface SummaryCardsProps {
	summary: DashboardSummary | null;
	portfolio: PortfolioData | null;
	loading?: boolean;
	error?: Error | null;
}

// YearlyTrendChart component types
export interface YearlyTrendChartProps {
	data: YearlyTrendData[];
	loading?: boolean;
	height?: string;
}

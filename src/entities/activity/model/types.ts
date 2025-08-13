export type ActivityType = 'salary' | 'stock' | 'asset' | 'other';

export interface Activity {
	id: string;
	profileId: string;
	type: ActivityType;
	title: string;
	description: string;
	amount?: number;
	date: Date;
	metadata?: Record<string, unknown>;
	createdAt: Date;
}

export interface ActivityGroup {
	date: string;
	activities: Activity[];
}

export interface RecentActivity {
	id: string;
	type: ActivityType;
	description: string;
	amount: number;
	date: string;
}

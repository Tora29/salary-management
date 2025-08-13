<script lang="ts">
	import ActivityTimeline from '$entities/activity/ui/ActivityTimeline.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import type { RecentActivity } from '$entities/activity/model/types';
	import type { RecentActivitiesProps } from '$entities/dashboard/model/types';

	const { activities, loading = false, error = null }: RecentActivitiesProps = $props();

	const recentActivities = $derived<RecentActivity[]>(
		activities?.activities.map((activity: any) => ({
			id: activity.id,
			type: activity.type as 'salary' | 'stock',
			description: activity.description,
			amount: activity.amount,
			date: activity.date
		})) || []
	);
</script>

<DashboardCard title="最近のアクティビティ" {loading} error={error?.message || null}>
	{#if activities?.hasMore}
		<div class="flex items-center justify-between mb-4">
			<div></div>
			<a href="/activities" class="text-sm text-blue-600 hover:underline"> すべて表示 → </a>
		</div>
	{/if}

	<ActivityTimeline
		activities={recentActivities}
		{loading}
		error={error?.message || null}
		maxItems={5}
	/>
</DashboardCard>

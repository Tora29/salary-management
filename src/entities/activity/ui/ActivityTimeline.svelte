<script lang="ts">
	import type { RecentActivity } from '../model/types';

	interface Props {
		activities: RecentActivity[];
		loading?: boolean;
		error?: string | null;
		maxItems?: number;
	}

	const { activities, loading = false, error = null, maxItems = 5 }: Props = $props();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('ja-JP', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function getActivityIcon(type: RecentActivity['type']): string {
		switch (type) {
			case 'salary':
				return '💰';
			case 'stock':
				return '📈';
			default:
				return '📋';
		}
	}

	function getActivityColor(type: RecentActivity['type']): string {
		switch (type) {
			case 'salary':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
			case 'stock':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
		}
	}

	const displayActivities = $derived(activities.slice(0, maxItems));
</script>

<div class="relative">
	{#if loading}
		<div class="space-y-4">
			{#each Array(3) as _, i (i)}
				<div class="flex gap-4">
					<div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
						<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="text-red-500 text-sm">{error}</div>
	{:else if displayActivities.length > 0}
		<div class="space-y-4">
			{#each displayActivities as activity, index (activity.id)}
				<div class="flex gap-4 relative">
					<!-- Timeline Line -->
					{#if index < displayActivities.length - 1}
						<div class="absolute left-5 top-10 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>
					{/if}

					<!-- Icon Circle -->
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg {getActivityColor(
							activity.type
						)}"
					>
						{getActivityIcon(activity.type)}
					</div>

					<!-- Content -->
					<div class="flex-1 pb-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900 dark:text-white">
									{activity.description}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
									{formatDate(activity.date)}
								</p>
							</div>
							{#if activity.amount}
								<div class="text-sm font-medium text-gray-900 dark:text-white ml-4">
									{formatCurrency(activity.amount)}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8 space-y-4">
			<div class="text-gray-500 dark:text-gray-400 text-sm">アクティビティがありません</div>
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<a
					href="/salary/import"
					class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14,2 14,8 20,8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10,9 9,9 8,9" />
					</svg>
					給料明細を追加
				</a>
				<a
					href="/stocks/add"
					class="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
					</svg>
					株式を登録
				</a>
			</div>
		</div>
	{/if}
</div>

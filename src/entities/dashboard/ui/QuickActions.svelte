<script lang="ts">
	import Button from '$shared/components/ui/Button.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import { Upload, Plus, BarChart, Info } from '@lucide/svelte';
	import type { QuickAction } from '$entities/dashboard/model/types';

	const actions: QuickAction[] = [
		{
			id: 'import-salary',
			label: '給料明細をインポート',
			icon: 'upload',
			href: '/salary/import',
			color: 'primary'
		},
		{
			id: 'add-stock',
			label: '株式を登録',
			icon: 'plus',
			href: '/stocks/add',
			color: 'primary'
		},
		{
			id: 'view-reports',
			label: 'レポートを見る',
			icon: 'chart',
			href: '/reports',
			color: 'secondary'
		}
	];
</script>

<DashboardCard title="クイックアクション">
	<div class="space-y-3">
		{#each actions as action (action.id)}
			<a href={action.href} class="block w-full" data-testid={`${action.id}-btn`}>
				<Button variant={action.color} fullWidth>
					<div class="flex items-center justify-center">
						{#if action.icon === 'upload'}
							<Upload size={20} class="mr-2" />
						{:else if action.icon === 'plus'}
							<Plus size={20} class="mr-2" />
						{:else if action.icon === 'chart'}
							<BarChart size={20} class="mr-2" />
						{/if}
						<span>{action.label}</span>
					</div>
				</Button>
			</a>
		{/each}
	</div>

	<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
		<div class="flex items-start">
			<Info size={20} class="text-blue-600 mt-0.5" />
			<div class="ml-3">
				<p class="text-sm text-blue-700 dark:text-blue-400">
					PDFから自動で給料明細を読み取り、データベースに保存できます
				</p>
			</div>
		</div>
	</div>
</DashboardCard>

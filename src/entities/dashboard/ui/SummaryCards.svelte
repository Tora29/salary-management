<script lang="ts">
	import SalaryCard from '$entities/salary/ui/SalaryCard.svelte';
	import AssetCard from '$entities/asset/ui/AssetCard.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import { TrendingUp, TrendingDown, Maximize2, Plus } from '@lucide/svelte';
	import type { SummaryCardsProps, YearlyTrendData } from '$entities/dashboard/model/types';

	const { summary, portfolio, loading = false, error = null }: SummaryCardsProps = $props();

	const currentMonthSalaryData = $derived(
		summary
			? {
					netSalary: summary.currentMonth.netSalary,
					totalIncome: summary.currentMonth.totalIncome,
					totalDeductions: summary.currentMonth.totalDeductions,
					previousMonthComparison: {
						current: summary.currentMonth.netSalary,
						previous:
							summary.currentMonth.netSalary -
							(summary.currentMonth.netSalary * summary.currentMonth.previousMonthComparison) / 100,
						change:
							(summary.currentMonth.netSalary * summary.currentMonth.previousMonthComparison) / 100,
						changePercentage: summary.currentMonth.previousMonthComparison
					}
				}
			: null
	);

	const yearlyTrendSummary = $derived(() => {
		if (!summary?.yearlyTrend || summary.yearlyTrend.length === 0) {
			return null;
		}

		const total = summary.yearlyTrend.reduce(
			(sum: number, month: YearlyTrendData) => sum + month.netSalary,
			0
		);
		const average = total / summary.yearlyTrend.length;
		const bonusMonths = summary.yearlyTrend.filter((m: YearlyTrendData) => m.isBonus).length;

		return {
			total,
			average,
			bonusMonths,
			monthCount: summary.yearlyTrend.length
		};
	});

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
	<SalaryCard
		title="今月の手取り"
		salaryData={currentMonthSalaryData}
		{loading}
		error={error?.message || null}
		showComparison={true}
	/>

	<DashboardCard title="年間推移" {loading} error={error?.message || null}>
		{#if yearlyTrendSummary}
			{@const summaryData = yearlyTrendSummary()}
			{#if summaryData}
				<div class="text-2xl font-bold text-primary">
					{formatCurrency(summaryData.average)}
				</div>
				<div class="mt-2 text-sm text-tertiary">月平均</div>
				<div class="mt-4 pt-4 border-t border-default space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-tertiary">年間総額</span>
						<span class="font-medium text-primary">
							{formatCurrency(summaryData.total)}
						</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-tertiary">ボーナス</span>
						<span class="font-medium text-primary">
							{summaryData.bonusMonths}回
						</span>
					</div>
				</div>
			{/if}
		{:else}
			<div class="space-y-4">
				<div class="text-gray-500 dark:text-gray-400 text-sm">データがありません</div>
				<div class="pt-2">
					<a
						href="/reports"
						class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
					>
						<Maximize2 size={16} />
						レポートを見る
					</a>
				</div>
			</div>
		{/if}
	</DashboardCard>

	<DashboardCard title="ポートフォリオ" {loading} error={error?.message || null}>
		{#if portfolio}
			<div class="text-2xl font-bold text-primary">
				{formatCurrency(portfolio.totalValue)}
			</div>
			<div class="mt-2 flex items-center text-sm">
				<span class={portfolio.dailyChange.percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
					{#if portfolio.dailyChange.percentage >= 0}
						<TrendingUp size={16} class="inline-block mr-1" />
					{:else}
						<TrendingDown size={16} class="inline-block mr-1" />
					{/if}
					{portfolio.dailyChange.percentage >= 0 ? '+' : ''}
					{portfolio.dailyChange.percentage.toFixed(2)}%
				</span>
				<span class="ml-2 text-tertiary">本日</span>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="text-gray-500 dark:text-gray-400 text-sm">データがありません</div>
				<div class="pt-2">
					<a
						href="/stocks/add"
						class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
					>
						<Plus size={16} />
						株式を追加
					</a>
				</div>
			</div>
		{/if}
	</DashboardCard>

	<AssetCard
		title="総資産"
		assetsData={summary?.totalAssets
			? {
					...summary.totalAssets,
					previousMonthComparison: {
						current: summary.totalAssets.total,
						previous:
							summary.totalAssets.total * (1 - summary.totalAssets.previousMonthComparison / 100),
						change: (summary.totalAssets.total * summary.totalAssets.previousMonthComparison) / 100,
						changePercentage: summary.totalAssets.previousMonthComparison
					}
				}
			: null}
		{loading}
		error={error?.message || null}
	/>
</div>

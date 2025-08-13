<script lang="ts">
	import { onMount } from 'svelte';
	import SummaryCards from '$entities/dashboard/ui/SummaryCards.svelte';
	import YearlyTrendChart from '$entities/dashboard/ui/YearlyTrendChart.svelte';
	import RecentActivities from '$entities/dashboard/ui/RecentActivities.svelte';
	import { useDashboardData } from '../composable/useDashboardData.svelte';
	import { usePortfolioCalculation } from '../composable/usePortfolioCalculation.svelte';
	import ErrorBoundary from '$shared/components/ui/ErrorBoundary.svelte';
	import Skeleton from '$shared/components/ui/Skeleton.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import PortfolioCard from '$entities/portfolio/ui/PortfolioCard.svelte';
	import PieChart from '$entities/chart/ui/PieChart.svelte';
	import { XCircle } from '@lucide/svelte';

	interface Props {
		fetch?: typeof globalThis.fetch;
	}

	const { fetch: customFetch = globalThis.fetch }: Props = $props();

	const dashboardData = useDashboardData(customFetch);
	const { calculateMetrics, formatCurrency, formatPercentage } = usePortfolioCalculation();

	// ポートフォリオデータの処理
	const portfolioData = $derived.by(() => {
		if (!dashboardData.portfolio) {
			return null;
		}

		const metrics = calculateMetrics(dashboardData.portfolio);
		const pieChartData =
			dashboardData.portfolio.topHoldings && dashboardData.portfolio.topHoldings.length > 0
				? {
						labels: dashboardData.portfolio.topHoldings.map((h) => h.symbol),
						data: dashboardData.portfolio.topHoldings.map((h) => h.value),
						colors: [
							'#3b82f6',
							'#10b981',
							'#f59e0b',
							'#ef4444',
							'#8b5cf6',
							'#ec4899',
							'#14b8a6',
							'#f97316'
						]
					}
				: null;

		const portfolioForCard = {
			totalValue: dashboardData.portfolio.totalValue,
			dailyChange: dashboardData.portfolio.dailyChange,
			topHoldings: dashboardData.portfolio.topHoldings
				? dashboardData.portfolio.topHoldings.map((h, index) => ({
						id: `holding-${index}`,
						symbol: h.symbol,
						name: h.name,
						value: h.value,
						quantity: 0,
						purchasePrice: 0,
						currentPrice: 0,
						change: h.change,
						changePercentage: h.changePercentage
					}))
				: []
		};

		return {
			metrics,
			pieChartData,
			portfolioForCard
		};
	});

	onMount(() => {
		dashboardData.loadData();
	});
</script>

<div class="w-full">
	<ErrorBoundary>
		{#if dashboardData.error}
			<div
				class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-6"
			>
				<div class="flex">
					<div class="flex-shrink-0">
						<XCircle size={20} class="text-red-400" />
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800 dark:text-red-300">エラーが発生しました</h3>
						<p class="mt-1 text-sm text-red-700 dark:text-red-400">
							{dashboardData.error.message}
						</p>
						<button
							onclick={() => dashboardData.refresh()}
							class="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
						>
							再試行 →
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- 指定レイアウトに合わせた構造 -->
		<div class="grid grid-rows-[auto_auto_auto] gap-8 w-full">
			<!-- サマリーカードセクション（フル幅） -->
			<section class="w-full">
				{#if dashboardData.loading && !dashboardData.summary}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
						{#each Array(4) as _, i (i)}
							<Skeleton height="150px" />
						{/each}
					</div>
				{:else}
					<SummaryCards
						summary={dashboardData.summary}
						portfolio={dashboardData.portfolio}
						loading={dashboardData.loading}
						error={dashboardData.error}
					/>
				{/if}
			</section>

			<!-- 年間収入推移グラフ（フル幅） -->
			<section class="w-full">
				{#if dashboardData.loading && !dashboardData.summary}
					<Skeleton height="400px" />
				{:else if dashboardData.summary?.yearlyTrend}
					<YearlyTrendChart
						data={dashboardData.summary.yearlyTrend}
						loading={dashboardData.loading}
					/>
				{/if}
			</section>

			<!-- 3カラムレイアウトセクション -->
			<section class="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
				<!-- ポートフォリオサマリー -->
				<div class="w-full min-h-[500px] flex flex-col">
					<PortfolioCard
						title="ポートフォリオサマリー"
						portfolio={portfolioData?.portfolioForCard || null}
						loading={dashboardData.loading}
						error={dashboardData.error?.message || null}
						showTopHoldings={true}
					/>
				</div>

				<!-- 資産配分 -->
				<div class="w-full min-h-[500px] flex flex-col">
					<DashboardCard
						title="資産配分"
						loading={dashboardData.loading}
						error={dashboardData.error?.message || null}
					>
						{#if portfolioData?.pieChartData}
							<div style:height="250px">
								<PieChart
									data={portfolioData.pieChartData}
									options={{ showLegend: true, showTooltip: true }}
								/>
							</div>

							{#if portfolioData.metrics}
								<div class="mt-4 pt-4 border-t border-default grid grid-cols-2 gap-4">
									<div>
										<p class="text-xs text-tertiary">総損益</p>
										<p
											class={`text-lg font-bold ${
												portfolioData.metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
											}`}
										>
											{formatCurrency(portfolioData.metrics.totalGainLoss)}
										</p>
										<p class="text-xs text-tertiary">
											{formatPercentage(portfolioData.metrics.totalGainLossPercentage)}
										</p>
									</div>
									<div>
										<p class="text-xs text-tertiary">分散スコア</p>
										<p class="text-lg font-bold text-primary">
											{portfolioData.metrics.diversificationScore.toFixed(0)}/100
										</p>
										<div class="mt-1 w-full bg-tertiary rounded-full h-2">
											<div
												class="bg-blue-500 h-2 rounded-full transition-all duration-300"
												style:width="{portfolioData.metrics.diversificationScore}%"
											></div>
										</div>
									</div>
								</div>
							{/if}
						{:else}
							<div class="text-center py-8 space-y-4">
								<div class="text-gray-500 dark:text-gray-400 text-sm">データがありません</div>
								<div>
									<a
										href="/stocks/add"
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
											<polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
										</svg>
										株式を登録
									</a>
								</div>
							</div>
						{/if}
					</DashboardCard>
				</div>

				<!-- 最近のアクティビティ -->
				<div class="w-full min-h-[500px] flex flex-col">
					{#if dashboardData.loading && !dashboardData.activities}
						<Skeleton height="320px" />
					{:else}
						<RecentActivities
							activities={dashboardData.activities}
							loading={dashboardData.loading}
							error={dashboardData.error}
						/>
					{/if}
				</div>
			</section>
		</div>
	</ErrorBoundary>
</div>

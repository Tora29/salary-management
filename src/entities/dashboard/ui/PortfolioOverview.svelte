<script lang="ts">
	import PortfolioCard from '$entities/portfolio/ui/PortfolioCard.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import PieChart from '$entities/chart/ui/PieChart.svelte';
	import { usePortfolioCalculation } from '$features/dashboard/composable/usePortfolioCalculation.svelte';
	import type { Portfolio } from '$entities/portfolio/model/types';
	import type { PieChartData } from '$entities/chart/model/types';
	import type { PortfolioOverviewProps } from '$entities/dashboard/model/types';

	const { portfolio, loading = false, error = null }: PortfolioOverviewProps = $props();
	const { calculateMetrics, formatCurrency, formatPercentage } = usePortfolioCalculation();

	const metrics = $derived(calculateMetrics(portfolio));

	const portfolioForCard = $derived<Portfolio | null>(
		portfolio
			? {
					totalValue: portfolio.totalValue,
					dailyChange: portfolio.dailyChange,
					topHoldings: portfolio.topHoldings.map((h, index) => ({
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
				}
			: null
	);

	function generateColors(count: number): string[] {
		const colors: string[] = [];

		for (let i = 0; i < count; i++) {
			// 色相を均等に分割（0-360度）
			const hue = (i * 360) / count;
			// 彩度と明度を調整して見やすい色に
			colors.push(`hsl(${hue}, 70%, 55%)`);
		}

		return colors;
	}

	const pieChartData = $derived<PieChartData | null>(
		portfolio && portfolio.topHoldings.length > 0
			? {
					labels: portfolio.topHoldings.map((h) => h.symbol),
					data: portfolio.topHoldings.map((h) => h.value),
					colors: generateColors(portfolio.topHoldings.length)
				}
			: null
	);
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<PortfolioCard
		title="ポートフォリオサマリー"
		portfolio={portfolioForCard}
		{loading}
		error={error?.message || null}
		showTopHoldings={true}
	/>

	<DashboardCard title="資産配分" {loading} error={error?.message || null}>
		{#if pieChartData}
			<div style:height="250px">
				<PieChart data={pieChartData} options={{ showLegend: true, showTooltip: true }} />
			</div>

			{#if metrics}
				<div class="mt-4 pt-4 border-t border-default grid grid-cols-2 gap-4">
					<div>
						<p class="text-xs text-tertiary">総損益</p>
						<p
							class={`text-lg font-bold ${
								metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
							}`}
						>
							{formatCurrency(metrics.totalGainLoss)}
						</p>
						<p class="text-xs text-tertiary">
							{formatPercentage(metrics.totalGainLossPercentage)}
						</p>
					</div>
					<div>
						<p class="text-xs text-tertiary">分散スコア</p>
						<p class="text-lg font-bold text-primary">
							{metrics.diversificationScore.toFixed(0)}/100
						</p>
						<div class="mt-1 w-full bg-tertiary rounded-full h-2">
							<div
								class="bg-blue-500 h-2 rounded-full transition-all duration-300"
								style:width="{metrics.diversificationScore}%"
							></div>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</DashboardCard>
</div>

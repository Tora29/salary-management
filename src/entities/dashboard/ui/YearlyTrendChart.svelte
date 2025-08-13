<script lang="ts">
	import LineChart from '$entities/chart/ui/LineChart.svelte';
	import DashboardCard from '$shared/components/ui/DashboardCard.svelte';
	import type { LineChartData } from '$entities/chart/model/types';
	import type { YearlyTrendChartProps } from '$entities/dashboard/model/types';

	const { data, loading = false, height = '400px' }: YearlyTrendChartProps = $props();

	const chartData = $derived<LineChartData>({
		labels: data.map((item) => item.month),
		datasets: [
			{
				label: '手取り額',
				data: data.map((item) => item.netSalary),
				color: '#3b82f6',
				highlighted: data.map((item) => item.isBonus)
			}
		]
	});
</script>

<DashboardCard title="年間収入推移" {loading}>
	<p class="text-sm text-tertiary mb-4">過去12ヶ月の手取り額推移（ボーナス月はハイライト表示）</p>

	{#if data.length > 0}
		<LineChart
			data={chartData}
			{loading}
			{height}
			options={{
				responsive: true,
				maintainAspectRatio: false,
				showLegend: false,
				showTooltip: true
			}}
		/>
	{:else}
		<div class="flex items-center justify-center" style:height>
			<p class="text-tertiary">データがありません</p>
		</div>
	{/if}
</DashboardCard>

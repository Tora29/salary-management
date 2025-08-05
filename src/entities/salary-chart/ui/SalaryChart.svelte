<script lang="ts">
	import { Chart } from '$lib/components/chart';
	import type { ChartConfiguration } from 'chart.js';
	import type { SalaryChartProps } from '../model';

	let { data, height = '300px' }: SalaryChartProps = $props();

	let config: ChartConfiguration = $derived({
		type: 'bar',
		data: {
			labels: data.data.map((d) => d.month),
			datasets: [
				{
					label: '額面',
					data: data.data.map((d) => d.grossAmount),
					backgroundColor: 'rgba(156, 163, 175, 0.5)',
					borderColor: 'rgb(156, 163, 175)',
					borderWidth: 1,
					borderRadius: 4
				},
				{
					label: '手取り額',
					data: data.data.map((d) => d.amount),
					backgroundColor: 'rgba(59, 130, 246, 0.8)',
					borderColor: 'rgb(59, 130, 246)',
					borderWidth: 1,
					borderRadius: 4
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: true,
					position: 'top',
					labels: {
						usePointStyle: true,
						padding: 15
					}
				},
				tooltip: {
					callbacks: {
						label: (context) => {
							const value = context.parsed.y;
							const label = context.dataset.label;
							return `${label}: ¥${value.toLocaleString()}`;
						}
					}
				}
			},
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (value) => {
							return `¥${Number(value).toLocaleString()}`;
						}
					}
				}
			}
		}
	});
</script>

<Chart {config} {height} />

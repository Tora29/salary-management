<script lang="ts">
	import type { LineChartData, ChartOptions } from '../model/types';

	interface Props {
		data: LineChartData;
		options?: ChartOptions;
		height?: string;
		loading?: boolean;
	}

	const {
		data,
		options = {
			responsive: true,
			maintainAspectRatio: false,
			showLegend: true,
			showTooltip: true
		},
		height = '300px',
		loading = false
	}: Props = $props();

	function getMaxValue(): number {
		const allValues = data.datasets.flatMap((dataset) => dataset.data);
		return Math.max(...allValues);
	}

	function getMinValue(): number {
		const allValues = data.datasets.flatMap((dataset) => dataset.data);
		return Math.min(...allValues);
	}

	function formatValue(value: number): string {
		return new Intl.NumberFormat('ja-JP').format(value);
	}

	const maxValue = $derived(getMaxValue());
	const minValue = $derived(getMinValue());
	const valueRange = $derived(maxValue - minValue);
</script>

<div class="w-full" style:height>
	{#if loading}
		<div class="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div>
	{:else}
		<div class="relative w-full h-full">
			<svg viewBox="0 0 800 400" class="w-full h-full">
				<!-- Grid Lines -->
				<g class="grid">
					{#each Array(5) as _, i (i)}
						<line
							x1="60"
							y1={60 + i * 70}
							x2="740"
							y2={60 + i * 70}
							stroke="#e5e7eb"
							stroke-width="1"
							class="dark:stroke-gray-700"
						/>
					{/each}
				</g>

				<!-- Y-axis labels -->
				<g class="y-axis">
					{#each Array(5) as _, i (i)}
						{@const value = maxValue - (valueRange / 4) * i}
						<text
							x="50"
							y={65 + i * 70}
							text-anchor="end"
							class="text-xs fill-gray-600 dark:fill-gray-400"
						>
							{formatValue(Math.round(value))}
						</text>
					{/each}
				</g>

				<!-- X-axis labels -->
				<g class="x-axis">
					{#each data.labels as label, i (i)}
						{@const x = 60 + (i * 680) / (data.labels.length - 1)}
						<text {x} y="380" text-anchor="middle" class="text-xs fill-gray-600 dark:fill-gray-400">
							{label}
						</text>
					{/each}
				</g>

				<!-- Data Lines -->
				{#each data.datasets as dataset, datasetIndex (datasetIndex)}
					{@const color = dataset.color || `hsl(${datasetIndex * 60}, 70%, 50%)`}
					<g class="dataset">
						<!-- Line Path -->
						<path
							d={data.labels
								.map((_, i) => {
									const x = 60 + (i * 680) / (data.labels.length - 1);
									const dataValue = dataset.data[i] ?? 0;
									const y = 340 - ((dataValue - minValue) / valueRange) * 280;
									return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
								})
								.join(' ')}
							fill="none"
							stroke={color}
							stroke-width="2"
							class="transition-all duration-300"
						/>

						<!-- Data Points -->
						{#each dataset.data as value, i (i)}
							{@const x = 60 + (i * 680) / (data.labels.length - 1)}
							{@const y = 340 - ((value - minValue) / valueRange) * 280}
							{@const isHighlighted = dataset.highlighted?.[i] || false}
							<circle
								cx={x}
								cy={y}
								r={isHighlighted ? '6' : '4'}
								fill={isHighlighted ? color : 'white'}
								stroke={color}
								stroke-width="2"
								class="transition-all duration-200 hover:r-6"
							>
								{#if options.showTooltip}
									<title>{data.labels[i]}: {formatValue(value)}円</title>
								{/if}
							</circle>
						{/each}
					</g>
				{/each}

				<!-- Legend -->
				{#if options.showLegend && data.datasets.length > 1}
					<g class="legend">
						{#each data.datasets as dataset, i (i)}
							{@const color = dataset.color || `hsl(${i * 60}, 70%, 50%)`}
							<g transform="translate({100 + i * 120}, 20)">
								<rect x="0" y="0" width="12" height="12" fill={color} rx="2" />
								<text x="18" y="10" class="text-xs fill-gray-700 dark:fill-gray-300">
									{dataset.label}
								</text>
							</g>
						{/each}
					</g>
				{/if}
			</svg>
		</div>
	{/if}
</div>

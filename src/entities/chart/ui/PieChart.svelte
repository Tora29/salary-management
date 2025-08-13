<script lang="ts">
	import type { PieChartData, ChartOptions } from '../model/types';

	interface Props {
		data: PieChartData;
		options?: ChartOptions;
		size?: number;
		loading?: boolean;
	}

	const {
		data,
		options = {
			showLegend: true,
			showTooltip: true
		},
		size = 200,
		loading = false
	}: Props = $props();

	const defaultColors: string[] = [
		'#3B82F6',
		'#10B981',
		'#F59E0B',
		'#EF4444',
		'#8B5CF6',
		'#EC4899',
		'#14B8A6',
		'#F97316'
	];

	function getTotal(): number {
		return data.data.reduce((sum, value) => sum + value, 0);
	}

	function getPercentage(value: number): string {
		const total = getTotal();
		if (total === 0) {
			return '0%';
		}
		return `${((value / total) * 100).toFixed(1)}%`;
	}

	function formatValue(value: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(value);
	}

	type PieSlice = {
		label: string;
		value: number;
		percentage: number;
		startAngle: number;
		endAngle: number;
		color: string;
	};

	function createPieSlices(): PieSlice[] {
		const total = getTotal();
		if (total === 0) {
			return [];
		}

		const slices: PieSlice[] = [];
		let currentAngle = -90;

		for (let i = 0; i < data.data.length; i++) {
			const value = data.data[i] ?? 0;
			const label = data.labels[i] ?? '';
			const percentage = value / total;
			const angle = percentage * 360;
			const defaultColor = defaultColors[i % defaultColors.length] ?? '#3B82F6';
			const color = data.colors?.[i] ?? defaultColor;

			slices.push({
				label,
				value,
				percentage,
				startAngle: currentAngle,
				endAngle: currentAngle + angle,
				color
			});

			currentAngle += angle;
		}

		return slices;
	}

	const slices = $derived(createPieSlices());
	const centerX = $derived(size / 2);
	const centerY = $derived(size / 2);
	const radius = $derived(size / 2 - 20);

	function polarToCartesian(angle: number): { x: number; y: number } {
		const angleInRadians = (angle * Math.PI) / 180;
		return {
			x: centerX + radius * Math.cos(angleInRadians),
			y: centerY + radius * Math.sin(angleInRadians)
		};
	}

	function createPath(slice: (typeof slices)[0]): string {
		const start = polarToCartesian(slice.startAngle);
		const end = polarToCartesian(slice.endAngle);
		const largeArcFlag = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

		return `
			M ${centerX} ${centerY}
			L ${start.x} ${start.y}
			A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
			Z
		`;
	}
</script>

<div class="flex flex-col items-center">
	{#if loading}
		<div
			class="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full"
			style:width="{size}px"
			style:height="{size}px"
		></div>
	{:else}
		<div class="relative">
			<svg width={size} height={size} class="transform transition-transform duration-300">
				{#if slices.length === 0}
					<circle
						cx={centerX}
						cy={centerY}
						r={radius}
						fill="none"
						stroke="#e5e7eb"
						stroke-width="2"
						class="dark:stroke-gray-700"
					/>
					<text
						x={centerX}
						y={centerY}
						text-anchor="middle"
						dominant-baseline="middle"
						class="text-sm fill-gray-500 dark:fill-gray-400"
					>
						データなし
					</text>
				{:else}
					{#each slices as slice (slice.label)}
						<path
							d={createPath(slice)}
							fill={slice.color}
							stroke="white"
							stroke-width="2"
							class="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
						>
							{#if options.showTooltip}
								<title>
									{slice.label}: {formatValue(slice.value)} ({getPercentage(slice.value)})
								</title>
							{/if}
						</path>
					{/each}
				{/if}
			</svg>
		</div>

		{#if options.showLegend && slices.length > 0}
			<div class="mt-4 space-y-2">
				{#each slices as slice (slice.label)}
					<div class="flex items-center gap-2">
						<div
							class="w-3 h-3 rounded-sm flex-shrink-0"
							style:background-color={slice.color}
						></div>
						<span class="text-sm text-gray-700 dark:text-gray-300">
							{slice.label}
						</span>
						<span class="text-sm text-gray-500 dark:text-gray-400 ml-auto">
							{getPercentage(slice.value)}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

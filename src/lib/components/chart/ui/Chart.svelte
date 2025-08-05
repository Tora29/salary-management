<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Chart from 'chart.js/auto';
	import type { ChartConfiguration } from 'chart.js';

	interface Props {
		config: ChartConfiguration;
		height?: string;
		class?: string;
	}

	let { config, height = '300px', class: className = '' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function createChart() {
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// 既存のチャートがあれば破棄
		if (chart) {
			chart.destroy();
		}

		chart = new Chart(ctx, config);
	}

	$effect(() => {
		if (config) {
			createChart();
		}
	});

	onMount(() => {
		createChart();
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div class="w-full {className}" style="height: {height}">
	<canvas bind:this={canvas}></canvas>
</div>

<script lang="ts">
	import type { ChartProps } from '../model/types';

	import Chart from 'chart.js/auto';
	import { onDestroy, onMount } from 'svelte';

	let { config, height = '300px', class: className = '' }: ChartProps = $props();

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

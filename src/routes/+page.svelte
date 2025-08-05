<script lang="ts">
	import DashboardView from '$features/dashboard/ui/DashboardView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<DashboardView
	dashboardData={data.dashboardData}
	salarySlips={data.salarySlips}
	salaryChartData={data.salaryChartData}
	error={data.error}
/>

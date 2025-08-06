<script lang="ts">
	import type { PageData } from './$types';

	import DashboardView from '$features/dashboard/ui/DashboardView.svelte';

	let { data }: { data: PageData } = $props();
</script>

<DashboardView
	dashboardData={data.dashboardData}
	salarySlips={data.salarySlips}
	salaryChartData={data.salaryChartData}
	error={data.error}
/>

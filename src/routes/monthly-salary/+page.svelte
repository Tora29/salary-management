<script lang="ts">
	import MonthlySalaryView from '$features/monthly-salary/ui/MonthlySalaryView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<MonthlySalaryView
	monthlySalaryData={data.monthlySalaryData}
	selectedYear={data.selectedYear}
	selectedMonth={data.selectedMonth}
	error={data.error}
/>

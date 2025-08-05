<script lang="ts">
	import SalarySlipListView from '$features/salary-slip/ui/SalarySlipListView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SalarySlipListView salaryHistory={data.salaryHistory} error={data.error} />

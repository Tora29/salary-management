<script lang="ts">
	import type { PageData } from './$types';

	import SalarySlipListView from '$features/salary-slip/ui/SalarySlipListView.svelte';

	let { data }: { data: PageData } = $props();
</script>

<SalarySlipListView salaryHistory={data.salaryHistory} error={data.error} />

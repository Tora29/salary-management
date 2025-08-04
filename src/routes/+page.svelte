<script lang="ts">
	import DashboardView from '$features/dashboard/ui/DashboardView.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<DashboardView {data} />

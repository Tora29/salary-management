<script lang="ts">
	// Global styles
	import '../app.css';

	// Static assets
	import favicon from '$lib/assets/favicon.svg';

	// Widget imports (application-wide components)
	import { Header } from '$widgets/header';

	// Library component imports
	import ToastContainer from '$lib/components/toast/ui/ToastContainer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Header />
	<main>{@render children?.()}</main>
</div>

<ToastContainer />

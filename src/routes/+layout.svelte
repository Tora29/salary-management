<script lang="ts">
	// Global styles
	// Static assets
	import favicon from '$lib/assets/favicon.svg';
	// Library component imports
	import ToastContainer from '$lib/components/toast/ui/ToastContainer.svelte';

	import '../app.css';

	// Widget imports (application-wide components)
	import { Header } from '$widgets/header';

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

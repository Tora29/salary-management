<script lang="ts">
	import type { FormLayoutProps } from '../model/types';

	const { children, onsubmit }: FormLayoutProps = $props();
</script>

<form {onsubmit} class="space-y-6">
	{@render children()}
</form>

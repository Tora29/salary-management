<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		className?: string;
	}

	const { width = '100%', height = '40px', className = '' }: Props = $props();
</script>

<div
	class="bg-gray-200 dark:bg-gray-700 animate-pulse rounded {className}"
	style:width
	style:height
></div>

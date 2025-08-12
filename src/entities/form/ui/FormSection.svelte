<script lang="ts">
	import type { FormSectionProps } from '../model/types';

	const { children, spacing = 'normal' }: FormSectionProps = $props();

	const spacingClasses = {
		tight: 'space-y-2',
		normal: 'space-y-4',
		loose: 'space-y-6'
	};

	const sectionClass = spacingClasses[spacing];
</script>

<div class={sectionClass}>
	{@render children()}
</div>

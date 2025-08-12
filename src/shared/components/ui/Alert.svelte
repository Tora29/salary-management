<script lang="ts">
	import type { AlertProps } from '../model/types';
	import { AlertCircle, CheckCircle, Info, XCircle, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	const {
		variant = 'info',
		dismissible = false,
		class: className = '',
		children
	}: AlertProps & { children?: Snippet } = $props();

	let dismissed = $state(false);

	const baseClasses = 'relative rounded-lg p-4';

	const variantClasses = {
		info: 'bg-blue-50 text-blue-900 border border-blue-200',
		success: 'bg-green-50 text-green-900 border border-green-200',
		warning: 'bg-yellow-50 text-yellow-900 border border-yellow-200',
		error: 'bg-red-50 text-red-900 border border-red-200'
	};

	const icons = {
		info: Info,
		success: CheckCircle,
		warning: AlertCircle,
		error: XCircle
	};

	const Icon = icons[variant];
	const alertClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

	function dismiss(): void {
		dismissed = true;
	}
</script>

{#if !dismissed}
	<div class={alertClasses} role="alert">
		<div class="flex">
			<div class="flex-shrink-0">
				<Icon class="h-5 w-5" aria-hidden="true" />
			</div>
			<div class="ml-3 flex-1">
				{@render children?.()}
			</div>
			{#if dismissible}
				<button
					type="button"
					class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-black/10 transition-colors"
					onclick={dismiss}
					aria-label="Dismiss"
				>
					<X class="h-5 w-5" />
				</button>
			{/if}
		</div>
	</div>
{/if}

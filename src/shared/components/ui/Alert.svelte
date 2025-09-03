<script lang="ts">
	import type { AlertProps } from '$shared/components/model/types';
	import { CircleAlert, CircleCheck, TriangleAlert, Info, X } from '@lucide/svelte';

	const {
		type = 'info',
		title = '',
		message,
		dismissible = false,
		icon = true,
		onDismiss
	}: AlertProps = $props();

	const typeClasses = {
		error: 'alert-error',
		success: 'alert-success',
		warning: 'alert-warning',
		info: 'alert-info'
	};

	const iconComponents = {
		error: CircleAlert,
		success: CircleCheck,
		warning: TriangleAlert,
		info: Info
	};

	const classes = $derived(`alert ${typeClasses[type]}`);
</script>

<div class={classes} role="alert" aria-live="assertive">
	{#if icon}
		{@const IconComponent = iconComponents[type]}
		<IconComponent size={20} class="alert-icon flex-shrink-0" />
	{/if}
	<div class="alert-content flex-1">
		{#if title}
			<h3 class="alert-title font-semibold">{title}</h3>
		{/if}
		<p class="alert-message">{message}</p>
	</div>
	{#if dismissible}
		<button
			type="button"
			class="alert-dismiss flex-shrink-0 ml-2"
			onclick={onDismiss}
			aria-label="閉じる"
		>
			<X size={16} />
		</button>
	{/if}
</div>

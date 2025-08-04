<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	import { toastStore } from '../model/store';

	import type { ToastMessage } from '../model/types';

	let toasts = $state<ToastMessage[]>([]);

	$effect(() => {
		return toastStore.subscribe((value) => {
			toasts = value;
		});
	});

	function getToastIcon(type: ToastMessage['type']) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
				return 'ℹ';
		}
	}

	function getToastClass(type: ToastMessage['type']) {
		const baseClass = 'toast';
		switch (type) {
			case 'success':
				return `${baseClass} toast-success`;
			case 'error':
				return `${baseClass} toast-error`;
			case 'warning':
				return `${baseClass} toast-warning`;
			case 'info':
				return `${baseClass} toast-info`;
		}
	}
</script>

<div class="toast-container" aria-live="polite" aria-atomic="true">
	{#each toasts as toast (toast.id)}
		<div
			class={getToastClass(toast.type)}
			in:fly={{ x: 300, duration: 300 }}
			out:fade={{ duration: 200 }}
			animate:flip={{ duration: 300 }}
		>
			<div class="toast-icon">
				{getToastIcon(toast.type)}
			</div>
			<div class="toast-content">
				<h4 class="toast-title">{toast.title}</h4>
				{#if toast.message}
					<p class="toast-message">{toast.message}</p>
				{/if}
			</div>
			{#if toast.closable}
				<button
					class="toast-close"
					type="button"
					aria-label="閉じる"
					onclick={() => toastStore.remove(toast.id)}
				>
					✕
				</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-width: 300px;
		max-width: 500px;
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		pointer-events: auto;
		background-color: white;
		border: 1px solid transparent;
	}

	.toast-success {
		background-color: #f0fdf4;
		border-color: #86efac;
		color: #166534;
	}

	.toast-error {
		background-color: #fef2f2;
		border-color: #fca5a5;
		color: #991b1b;
	}

	.toast-warning {
		background-color: #fffbeb;
		border-color: #fde047;
		color: #854d0e;
	}

	.toast-info {
		background-color: #f0f9ff;
		border-color: #93c5fd;
		color: #1e40af;
	}

	.toast-icon {
		flex-shrink: 0;
		width: 1.5rem;
		height: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-weight: bold;
		font-size: 0.875rem;
	}

	.toast-success .toast-icon {
		background-color: #86efac;
		color: #166534;
	}

	.toast-error .toast-icon {
		background-color: #fca5a5;
		color: #991b1b;
	}

	.toast-warning .toast-icon {
		background-color: #fde047;
		color: #854d0e;
	}

	.toast-info .toast-icon {
		background-color: #93c5fd;
		color: #1e40af;
	}

	.toast-content {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.5;
	}

	.toast-message {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		line-height: 1.5;
		opacity: 0.9;
	}

	.toast-close {
		flex-shrink: 0;
		padding: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		opacity: 0.5;
		transition: opacity 0.2s;
		font-size: 1rem;
		line-height: 1;
	}

	.toast-close:hover {
		opacity: 1;
	}

	@media (max-width: 640px) {
		.toast-container {
			left: 1rem;
			right: 1rem;
		}

		.toast {
			min-width: 0;
			max-width: 100%;
		}
	}
</style>

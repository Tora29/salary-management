<script lang="ts">
	import { onMount } from 'svelte';
	import { themes, type Theme, getTheme, setTheme, getThemeDisplayName } from '$shared/utils/theme';
	import { Palette, ChevronDown, Check } from '@lucide/svelte';

	let currentTheme = $state<Theme>('light');
	let isOpen = $state(false);

	onMount(() => {
		currentTheme = getTheme();
	});

	function handleThemeChange(theme: Theme): void {
		currentTheme = theme;
		setTheme(theme);
		isOpen = false;
	}

	function toggleDropdown(): void {
		isOpen = !isOpen;
	}

	// クリック外でドロップダウンを閉じる
	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as HTMLElement;
		if (!target.closest('.theme-selector')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
		return undefined;
	});

	// テーマのプレビューカラーを取得
	function getThemeColors(theme: Theme): { primary: string; secondary: string; accent: string } {
		const themeColors: Record<Theme, { primary: string; secondary: string; accent: string }> = {
			light: { primary: '#3b82f6', secondary: '#6b7280', accent: '#f59e0b' },
			'minimal-red': { primary: '#991930', secondary: '#dae0ec', accent: '#292d31' },
			'dark-orange': { primary: '#f8500a', secondary: '#1f2f40', accent: '#ffa500' },
			'warm-beige': { primary: '#0a1e54', secondary: '#b39a84', accent: '#d97706' },
			'soft-blue': { primary: '#c94d71', secondary: '#b6dcef', accent: '#cbc0eb' },
			'pink-black': { primary: '#dc3485', secondary: '#f69cc7', accent: '#ff1493' },
			'dark-yellow': { primary: '#ffcd00', secondary: '#3d474c', accent: '#ffd700' },
			'purple-dark': { primary: '#60519b', secondary: '#31323e', accent: '#9f7aea' },
			'earth-tone': { primary: '#5d3c3f', secondary: '#967462', accent: '#a6baac' },
			'teal-fresh': { primary: '#00adc1', secondary: '#2d7282', accent: '#14b8a6' },
			'navy-coral': { primary: '#11225b', secondary: '#33b9bb', accent: '#ed356a' }
		};
		return themeColors[theme] || { primary: '#3b82f6', secondary: '#6b7280', accent: '#f59e0b' };
	}
</script>

<div class="theme-selector">
	<button
		class="btn btn-ghost btn-sm"
		onclick={toggleDropdown}
		aria-label="テーマを選択"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<Palette size={20} class="flex-shrink-0" />
		<span class="theme-selector-label">{getThemeDisplayName(currentTheme)}</span>
		<ChevronDown
			size={16}
			class={`theme-selector-arrow flex-shrink-0 ${isOpen ? 'theme-selector-arrow-open' : ''}`}
		/>
	</button>

	{#if isOpen}
		<div class="theme-selector-dropdown">
			<div class="theme-selector-dropdown-inner">
				{#each themes as theme (theme)}
					{@const colors = getThemeColors(theme)}
					<button
						class={`theme-selector-option ${currentTheme === theme ? 'theme-selector-option-active' : ''}`}
						onclick={() => handleThemeChange(theme)}
					>
						<div class="theme-selector-option-colors">
							<span
								class="theme-selector-color"
								style:background-color={colors.primary}
								aria-hidden="true"
							></span>
							<span
								class="theme-selector-color"
								style:background-color={colors.secondary}
								aria-hidden="true"
							></span>
							<span
								class="theme-selector-color"
								style:background-color={colors.accent}
								aria-hidden="true"
							></span>
						</div>
						<span class="theme-selector-option-name">{getThemeDisplayName(theme)}</span>
						{#if currentTheme === theme}
							<Check size={16} class="theme-selector-check flex-shrink-0" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.theme-selector {
		position: relative;
	}

	.theme-selector-label {
		margin: 0 0.5rem;
		font-size: var(--font-size-sm);
	}

	.theme-selector-arrow {
		transition: transform var(--transition-fast) var(--ease-out);
	}

	.theme-selector-arrow-open {
		transform: rotate(180deg);
	}

	.theme-selector-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.5rem;
		background: var(--bg-surface);
		border: var(--border-width-1) solid var(--color-border);
		border-radius: var(--border-radius-lg);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		min-width: 240px;
		max-height: 400px;
		overflow-y: auto;
	}

	.theme-selector-dropdown-inner {
		padding: var(--spacing-2);
	}

	.theme-selector-option {
		display: flex;
		align-items: center;
		width: 100%;
		padding: var(--spacing-2) var(--spacing-3);
		background: transparent;
		border: none;
		border-radius: var(--border-radius-base);
		cursor: pointer;
		transition: background-color var(--transition-fast) var(--ease-out);
		text-align: left;
		gap: var(--spacing-3);
	}

	.theme-selector-option:hover {
		background: var(--color-neutral);
	}

	.theme-selector-option-active {
		background: var(--color-neutral);
		font-weight: var(--font-weight-medium);
	}

	.theme-selector-option-colors {
		display: flex;
		gap: 2px;
	}

	.theme-selector-color {
		width: 16px;
		height: 16px;
		border-radius: var(--border-radius-sm);
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.theme-selector-option-name {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--text-base);
	}

	.theme-selector-check {
		color: var(--color-primary);
		flex-shrink: 0;
	}

	/* レスポンシブ対応 */
	@media (max-width: 640px) {
		.theme-selector-label {
			display: none;
		}

		.theme-selector-dropdown {
			right: auto;
			left: 0;
		}
	}
</style>

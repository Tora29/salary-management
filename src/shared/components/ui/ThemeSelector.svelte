<script lang="ts">
	import { Palette, ChevronDown, Check } from '@lucide/svelte';
	import { onMount } from 'svelte';

	import { themes, type Theme, getTheme, setTheme, getThemeDisplayName } from '$shared/utils/theme';

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
		if (!target.closest('[data-theme-selector]')) {
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

<div class="relative" data-theme-selector>
	<button
		class="btn btn-ghost btn-sm"
		onclick={toggleDropdown}
		aria-label="テーマを選択"
		aria-expanded={isOpen}
		aria-haspopup="true"
	>
		<Palette size={20} class="flex-shrink-0" />
		<span class="mx-2 text-sm max-sm:hidden">{getThemeDisplayName(currentTheme)}</span>
		<ChevronDown
			size={16}
			class={`flex-shrink-0 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
		/>
	</button>

	{#if isOpen}
		<div
			class="absolute top-full right-0 mt-2 bg-surface border border-border rounded-lg shadow-lg z-50 min-w-[240px] max-h-[400px] overflow-y-auto max-sm:left-0 max-sm:right-auto"
		>
			<div class="p-2">
				{#each themes as theme (theme)}
					{@const colors = getThemeColors(theme)}
					<button
						class={`flex items-center w-full px-3 py-2 bg-transparent border-none rounded cursor-pointer transition-colors duration-200 ease-out text-left gap-3 hover:bg-neutral ${currentTheme === theme ? 'bg-neutral font-medium' : ''}`}
						onclick={() => handleThemeChange(theme)}
					>
						<div class="flex gap-0.5">
							<span
								class="w-4 h-4 rounded-sm border border-black/10"
								style:background-color={colors.primary}
								aria-hidden="true"
							></span>
							<span
								class="w-4 h-4 rounded-sm border border-black/10"
								style:background-color={colors.secondary}
								aria-hidden="true"
							></span>
							<span
								class="w-4 h-4 rounded-sm border border-black/10"
								style:background-color={colors.accent}
								aria-hidden="true"
							></span>
						</div>
						<span class="flex-1 text-sm text-base">{getThemeDisplayName(theme)}</span>
						{#if currentTheme === theme}
							<Check size={16} class="text-primary flex-shrink-0" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import { page } from '$app/stores';
	import { Home, FileText, Menu, X, Calendar } from '@lucide/svelte';

	/**
	 * アプリケーション共通ヘッダーコンポーネント
	 *
	 * @description
	 * 給料管理アプリのメインナビゲーションを提供するヘッダー。
	 * レスポンシブデザインに対応し、デスクトップとモバイルで異なるナビゲーション形式を提供する。
	 *
	 * @features
	 * - レスポンシブナビゲーション（デスクトップ/モバイル対応）
	 * - 現在のページのハイライト表示
	 * - アイコン付きナビゲーションメニュー
	 * - モバイルハンバーガーメニュー
	 *
	 * @example
	 * ```svelte
	 * <Header />
	 * ```
	 */

	/** モバイルメニューの開閉状態 */
	let isMobileMenuOpen = $state(false);

	/**
	 * モバイルメニューの開閉を切り替える
	 */
	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	/** ナビゲーションアイテムの設定 */
	const navItems = [
		{ href: '/', label: 'ダッシュボード', icon: Home },
		{ href: '/salary-slips', label: '給料明細', icon: FileText },
		{ href: '/monthly-salary', label: '月別給料', icon: Calendar }
	];
</script>

<header class="bg-white shadow-sm">
	<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- ロゴ/タイトル -->
			<div class="flex items-center">
				<h1 class="text-xl font-bold text-gray-900">給料・資産管理</h1>
			</div>

			<!-- デスクトップメニュー -->
			<div class="hidden md:block">
				<div class="ml-10 flex items-baseline space-x-4">
					{#each navItems as item}
						{@const IconComponent = item.icon}
						<a
							href={item.href}
							class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors {$page
								.url.pathname === item.href
								? 'bg-blue-50 text-blue-700'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<IconComponent size={16} />
							{item.label}
						</a>
					{/each}
				</div>
			</div>

			<!-- モバイルメニューボタン -->
			<div class="md:hidden">
				<button
					type="button"
					onclick={toggleMobileMenu}
					class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
					aria-expanded={isMobileMenuOpen}
				>
					<span class="sr-only">メニューを開く</span>
					{#if isMobileMenuOpen}
						<X size={24} />
					{:else}
						<Menu size={24} />
					{/if}
				</button>
			</div>
		</div>
	</nav>

	<!-- モバイルメニュー -->
	{#if isMobileMenuOpen}
		<div class="md:hidden">
			<div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
				{#each navItems as item}
					{@const IconComponent = item.icon}
					<a
						href={item.href}
						onclick={() => (isMobileMenuOpen = false)}
						class="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors {$page
							.url.pathname === item.href
							? 'bg-blue-50 text-blue-700'
							: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
					>
						<IconComponent size={20} />
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</header>

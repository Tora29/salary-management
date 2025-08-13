<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { createSupabaseBrowserClient } from '$shared/utils/supabase';
	import { themeStore } from '$shared/stores/theme.svelte';
	import ThemeToggle from '$shared/components/ui/ThemeToggle.svelte';
	import UserBadge from '$entities/user/ui/UserBadge.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import { useAuth } from '$features/auth/composable/useAuth.svelte';
	import { Plus, FileText, BarChart3 } from '@lucide/svelte';
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	const { children, data } = $props<{ children: Snippet; data: LayoutData }>();

	// ヘッダーを非表示にするパスを定義
	const hideHeaderPaths = ['/login', '/signup', '/auth/confirm', '/auth/resend-confirmation'];

	// 現在のパスがヘッダー非表示対象かどうかを判定
	const shouldHideHeader = $derived(hideHeaderPaths.includes($page.url.pathname));

	// ダッシュボードページかどうかを判定
	const isDashboard = $derived($page.url.pathname === '/dashboard');

	const auth = useAuth();

	// ダッシュボード用のクイックアクション
	const quickActions = [
		{
			id: 'salary',
			label: '給料明細',
			href: '/salary/import',
			icon: FileText
		},
		{
			id: 'stocks',
			label: '株式登録',
			href: '/stocks/add',
			icon: Plus
		},
		{
			id: 'reports',
			label: 'レポート',
			href: '/reports',
			icon: BarChart3
		}
	];

	async function handleLogout(): Promise<void> {
		await auth.logout();
	}

	onMount(() => {
		if (!browser) {
			return;
		}

		// テーマストアを初期化
		themeStore.init();

		// 認証を初期化
		auth.initialize();

		const supabase = createSupabaseBrowserClient();

		// Supabaseの認証状態変更をリッスン
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, _session) => {
			if (_session?.expires_at !== data.session?.expires_at) {
				// セッションが変更されたらページを再検証
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<div class="app-layout">
	{#if !shouldHideHeader}
		<header class="app-header">
			<div class="header-container">
				<div class="header-left">
					<h1 class="app-title">給料管理システム</h1>
				</div>

				{#if isDashboard}
					<div class="header-center">
						<nav class="quick-actions-nav">
							{#each quickActions as action (action.id)}
								<a
									href={action.href}
									class="quick-action-item"
									title={`${action.label}ページに移動`}
								>
									<action.icon size={16} />
									<span class="quick-action-label">{action.label}</span>
								</a>
							{/each}
						</nav>
					</div>
				{/if}

				<div class="header-right">
					{#if isDashboard && auth.user}
						<div class="dashboard-user-section">
							<UserBadge user={auth.user} />
							<Button variant="secondary" size="sm" onclick={handleLogout}>ログアウト</Button>
						</div>
					{/if}
					<ThemeToggle />
				</div>
			</div>
		</header>
	{/if}

	<main class="app-main" class:full-height={shouldHideHeader}>
		{@render children()}
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-background, #ffffff);
		color: var(--color-text, #1f2937);
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}

	.app-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--color-header-bg, #ffffff);
		border-bottom: 1px solid var(--color-border, #e5e7eb);
		backdrop-filter: blur(10px);
		background-color: rgba(255, 255, 255, 0.9);
	}

	.header-container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0.75rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: auto;
		min-height: 4rem;
		gap: 2rem;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.app-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text, #1f2937);
		margin: 0;
	}

	.header-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.quick-actions-nav {
		display: flex;
		gap: 1rem;
		background: rgba(255, 255, 255, 0.8);
		padding: 0.5rem 1rem;
		border-radius: 12px;
		border: 1px solid var(--color-border, #e5e7eb);
		backdrop-filter: blur(8px);
	}

	.quick-action-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		text-decoration: none;
		color: var(--color-text, #1f2937);
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.quick-action-item:hover {
		background: var(--color-bg-tertiary, #f3f4f6);
		border-color: var(--color-border, #e5e7eb);
		transform: translateY(-1px);
	}

	.quick-action-label {
		font-weight: 500;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.dashboard-user-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.app-main {
		width: 100%;
		max-width: 1280px;
		margin: 0 auto;
		padding: 2rem 1.5rem;
		min-height: 0;
	}

	.app-main.full-height {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 1rem;
	}

	/* ダークモード時のスタイル */
	:global(.dark) .app-layout {
		background: #0a0a0a;
		color: #f3f4f6;
	}

	:global(.dark) .app-header {
		background-color: rgba(10, 10, 10, 0.9);
		border-bottom-color: #374151;
	}

	:global(.dark) .app-title {
		color: #f3f4f6;
	}

	:global(.dark) .quick-actions-nav {
		background: rgba(31, 41, 55, 0.8);
		border-color: #374151;
	}

	:global(.dark) .quick-action-item {
		color: #f3f4f6;
	}

	:global(.dark) .quick-action-item:hover {
		background: rgba(55, 65, 81, 0.6);
		border-color: #4b5563;
	}

	/* レスポンシブ対応 */
	@media (max-width: 1024px) {
		.header-container {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem 1.5rem;
		}

		.header-center {
			order: 3;
		}

		.header-right {
			order: 2;
			width: 100%;
			justify-content: space-between;
		}

		.quick-actions-nav {
			gap: 0.5rem;
			padding: 0.5rem;
		}

		.quick-action-label {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.header-container {
			padding: 0.75rem 1rem;
		}

		.app-title {
			font-size: 1.25rem;
		}

		.quick-actions-nav {
			gap: 0.25rem;
			padding: 0.375rem;
		}

		.quick-action-item {
			padding: 0.375rem;
		}

		.app-main {
			padding: 1.5rem 1rem;
		}
	}
</style>

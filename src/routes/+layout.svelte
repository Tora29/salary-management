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

<div
	class="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300"
>
	{#if !shouldHideHeader}
		<header
			class="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl"
		>
			<div
				class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row justify-between items-center min-h-16 gap-4 lg:gap-8"
			>
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">給料管理システム</h1>
				</div>

				{#if isDashboard}
					<div class="flex-1 flex justify-center order-3 lg:order-2">
						<nav
							class="flex gap-2 sm:gap-4 bg-white/80 dark:bg-gray-800/80 px-2 sm:px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg"
						>
							{#each quickActions as action (action.id)}
								<a
									href={action.href}
									class="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-gray-900 dark:text-gray-100 text-sm font-medium transition-all duration-200 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:-translate-y-0.5"
									title={`${action.label}ページに移動`}
								>
									<action.icon size={16} />
									<span class="hidden sm:inline font-medium">{action.label}</span>
								</a>
							{/each}
						</nav>
					</div>
				{/if}

				<div
					class="flex items-center gap-4 order-2 lg:order-3 w-full lg:w-auto justify-between lg:justify-end"
				>
					{#if isDashboard && auth.user}
						<div class="flex items-center gap-3">
							<UserBadge user={auth.user} />
							<Button variant="secondary" size="sm" onclick={handleLogout}>ログアウト</Button>
						</div>
					{/if}
					<ThemeToggle />
				</div>
			</div>
		</header>
	{/if}

	<main
		class={shouldHideHeader
			? 'flex items-center justify-center min-h-screen p-4'
			: 'w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-0'}
	>
		{@render children()}
	</main>
</div>

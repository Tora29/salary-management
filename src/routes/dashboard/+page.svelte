<script lang="ts">
	import { useAuth } from '$features/auth/composable/useAuth.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import UserBadge from '$entities/user/ui/UserBadge.svelte';
	import { onMount } from 'svelte';

	const auth = useAuth();

	onMount(() => {
		auth.initialize();
	});

	async function handleLogout() {
		await auth.logout();
	}
</script>

<svelte:head>
	<title>ダッシュボード - 給料・資産管理システム</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center py-6">
				<h1 class="text-3xl font-bold text-gray-900">ダッシュボード</h1>
				<div class="flex items-center space-x-4">
					{#if auth.user}
						<UserBadge user={auth.user} />
					{/if}
					<Button variant="secondary" onclick={handleLogout}>ログアウト</Button>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<Card variant="bordered" padding="lg">
				<h2 class="text-2xl font-bold mb-4">ようこそ、{auth.displayName}さん</h2>
				<p class="text-gray-600">
					給料・資産管理システムへようこそ。ここから給料明細のインポートや資産の管理ができます。
				</p>
			</Card>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
				<Card variant="elevated" padding="lg">
					<h3 class="text-xl font-semibold mb-2">給料管理</h3>
					<p class="text-gray-600 mb-4">PDFから給料明細をインポートして管理</p>
					<Button variant="primary">給料明細をインポート</Button>
				</Card>

				<Card variant="elevated" padding="lg">
					<h3 class="text-xl font-semibold mb-2">資産管理</h3>
					<p class="text-gray-600 mb-4">株式ポートフォリオの時価評価と管理</p>
					<Button variant="primary">ポートフォリオを確認</Button>
				</Card>
			</div>
		</div>
	</main>
</div>

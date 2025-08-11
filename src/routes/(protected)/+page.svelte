<script lang="ts">
	import type { PageData } from './$types';

	import { signOut } from '@auth/sveltekit/client';

	const { data }: { data: PageData } = $props();

	async function handleSignOut(): Promise<void> {
		await signOut({ callbackUrl: '/login' });
	}
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between py-6">
				<h1 class="text-2xl font-bold text-gray-900">給料管理システム</h1>
				<div class="flex items-center space-x-4">
					<span class="text-sm text-gray-600">
						{data.session?.user?.name || data.session?.user?.email}
					</span>
					<button
						onclick={handleSignOut}
						class="text-sm text-gray-500 transition-colors hover:text-gray-700"
					>
						ログアウト
					</button>
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<div
				class="flex h-96 items-center justify-center rounded-lg border-4 border-dashed border-gray-200"
			>
				<div class="text-center">
					<h2 class="text-xl font-semibold text-gray-700">ようこそ！</h2>
					<p class="mt-2 text-gray-500">ダッシュボードは現在開発中です</p>
				</div>
			</div>
		</div>
	</main>
</div>

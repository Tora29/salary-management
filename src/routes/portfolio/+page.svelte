<script lang="ts">
	import type { PageData } from './$types';

	import { PortfolioView } from '$features/portfolio';
	import { TrendingUp } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	/**
	 * 株式ポートフォリオ管理ページ
	 *
	 * @description
	 * ユーザーの株式ポートフォリオを管理するためのページ。
	 * 銘柄の追加、編集、削除、および現在価格の確認が可能。
	 */
</script>

<svelte:head>
	<title>株式ポートフォリオ - 給料・資産管理</title>
	<meta
		name="description"
		content="株式ポートフォリオを管理し、保有銘柄の現在価値を確認できます。"
	/>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<div class="flex items-center gap-3">
			<TrendingUp size={32} class="text-blue-600" />
			<h1 class="text-3xl font-bold text-gray-900">株式ポートフォリオ</h1>
		</div>
		<p class="mt-2 text-gray-600">保有株式の管理と現在価値の確認</p>
	</div>

	<PortfolioView initialStocks={data.stocks} error={data.error} />
</div>

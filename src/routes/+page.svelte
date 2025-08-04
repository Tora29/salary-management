<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { DollarSign, TrendingUp, Wallet, ChartBar, RefreshCw } from '@lucide/svelte';

	import DashboardCard from '$lib/components/card/ui/Card.svelte';
	import Table from '$lib/components/table/ui/Table.svelte';

	import { formatCurrency } from '$lib/utils/format';

	import type { Column } from '$lib/components/table/model/types';
	import type { PageData } from './$types';
	import type { Stock } from '$lib/data/types';

	let { data }: { data: PageData } = $props();

	let isLoading = $state(false);

	const stockColumns: Column<Stock>[] = [
		{ key: 'symbol', label: '銘柄コード' },
		{ key: 'name', label: '銘柄名' },
		{ key: 'quantity', label: '保有数' },
		{ key: 'purchasePrice', label: '取得単価' },
		{ key: 'currentPrice', label: '現在値' },
		{ key: 'value', label: '評価額' }
	];

	async function handleRefresh() {
		isLoading = true;
		try {
			await invalidateAll();
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>給料・資産管理ダッシュボード</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">給料・資産管理</h1>
			<button
				type="button"
				onclick={handleRefresh}
				disabled={isLoading}
				class="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
			>
				<RefreshCw class={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
				更新
			</button>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.error}
			<div class="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
				<p class="font-semibold">エラーが発生しました</p>
				<p class="text-sm">{data.error}</p>
			</div>
		{/if}
		<!-- Dashboard Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<DashboardCard
				title="今月の給料"
				value={formatCurrency(data.dashboardData.currentMonthSalary)}
				icon={DollarSign}
			/>
			<DashboardCard
				title="年収累計"
				value={formatCurrency(data.dashboardData.yearlyIncome)}
				subtitle="今年の合計"
				icon={TrendingUp}
			/>
			<DashboardCard
				title="総資産額"
				value={formatCurrency(data.dashboardData.totalAssets)}
				subtitle={`預金: ${formatCurrency(data.dashboardData.depositBalance)}`}
				icon={Wallet}
			/>
			<DashboardCard
				title="株式評価額"
				value={formatCurrency(data.dashboardData.stockValuation)}
				subtitle={`${data.dashboardData.stocks.length}銘柄保有`}
				icon={ChartBar}
			/>
		</div>

		<!-- Stock Portfolio Preview -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">保有株式</h2>
			<Table columns={stockColumns} data={data.dashboardData.stocks} />
		</div>
	</main>

	<!-- Footer -->
	<footer class="mt-auto bg-white">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<p class="text-center text-sm text-gray-500">&copy; 2024 給料・資産管理アプリ</p>
		</div>
	</footer>
</div>

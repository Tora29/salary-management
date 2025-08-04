<script lang="ts">
	import { DollarSign, TrendingUp, Wallet, ChartBar } from '@lucide/svelte';

	import DashboardCard from '$lib/components/card/ui/Card.svelte';
	import Table from '$lib/components/table/ui/Table.svelte';
	import { dummyData } from '$lib/data/dummy';
	import { formatCurrency } from '$lib/utils/format';

	import type { Column } from '$lib/components/table/model/types';
	import type { Stock } from '$lib/data/types';

	const stockColumns: Column<Stock>[] = [
		{ key: 'symbol', label: '銘柄コード' },
		{ key: 'name', label: '銘柄名' },
		{ key: 'quantity', label: '保有数' },
		{ key: 'purchasePrice', label: '取得単価' },
		{ key: 'currentPrice', label: '現在値' },
		{ key: 'value', label: '評価額' }
	];
</script>

<svelte:head>
	<title>給料・資産管理ダッシュボード</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">給料・資産管理</h1>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Dashboard Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<DashboardCard
				title="今月の給料"
				value={formatCurrency(dummyData.currentMonthSalary)}
				icon={DollarSign}
			/>
			<DashboardCard
				title="年収累計"
				value={formatCurrency(dummyData.yearlyIncome)}
				subtitle="今年の合計"
				icon={TrendingUp}
			/>
			<DashboardCard
				title="総資産額"
				value={formatCurrency(dummyData.totalAssets)}
				subtitle={`預金: ${formatCurrency(dummyData.depositBalance)}`}
				icon={Wallet}
			/>
			<DashboardCard
				title="株式評価額"
				value={formatCurrency(dummyData.stockValuation)}
				subtitle={`${dummyData.stocks.length}銘柄保有`}
				icon={ChartBar}
			/>
		</div>

		<!-- Stock Portfolio Preview -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">保有株式</h2>
			<Table columns={stockColumns} data={dummyData.stocks} />
		</div>
	</main>

	<!-- Footer -->
	<footer class="mt-auto bg-white">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<p class="text-center text-sm text-gray-500">&copy; 2024 給料・資産管理アプリ</p>
		</div>
	</footer>
</div>

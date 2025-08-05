<script lang="ts">
	// Svelte core imports
	// Svelte coreのインポートは不要になりました

	// External library imports (Lucide icons)
	import {
		DollarSign,
		TrendingUp,
		Wallet,
		ChartBar,
		RefreshCw,
		FileText,
		ChevronRight
	} from '@lucide/svelte';

	// Project entity imports (domain-specific components)
	import { DashboardCard, StockTable } from '$entities/dashboard';
	import { SalaryChart } from '$entities/salary-chart';

	// Project feature imports (feature components)
	import { SalarySlipDisplay } from '$entities/salary-slip';
	import StockPriceUpdater from '$features/stock-price/ui/StockPriceUpdater.svelte';

	// Library utils and constants
	import { formatCurrency } from '$lib/utils/format';

	// Type imports (grouped together)
	import type { DashboardResponse } from '$entities/dashboard/model';
	import type { ParsedSalaryData } from '$entities/salary-slip/model';
	import type { Stock } from '$entities/dashboard/model';
	import type { SalaryChartData } from '$entities/salary-chart/model';

	interface Props {
		dashboardData: DashboardResponse;
		salarySlips: ParsedSalaryData[];
		salaryChartData: SalaryChartData | null;
		error?: string | null | undefined;
	}

	let {
		dashboardData = $bindable(),
		salarySlips = [],
		salaryChartData = null,
		error = null as string | null
	}: Props = $props();

	let isLoading = $state(false);
	let selectedSalarySlip = $state<ParsedSalaryData | null>(null);

	// 最新の給料明細を自動選択
	$effect(() => {
		if (salarySlips.length > 0 && !selectedSalarySlip) {
			selectedSalarySlip = salarySlips[0] || null;
		}
	});

	async function handleRefresh() {
		isLoading = true;
		// ページ全体をリロードしてデータを再取得
		await invalidateAll();
		isLoading = false;
	}

	function selectSalarySlip(salarySlip: ParsedSalaryData) {
		selectedSalarySlip = salarySlip;
	}

	function handleStockPricesUpdate(updatedStocks: Stock[]) {
		// 株価更新後の処理
		dashboardData.stocks = updatedStocks;
		// 株式評価額の再計算
		dashboardData.stockValuation = updatedStocks.reduce((sum, stock) => sum + stock.value, 0);
		// 総資産額の再計算
		dashboardData.totalAssets = dashboardData.depositBalance + dashboardData.stockValuation;
	}

	// invalidateAllをインポート
	import { invalidateAll } from '$app/navigation';
</script>

<svelte:head>
	<title>給料・資産管理ダッシュボード</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">ダッシュボード</h1>
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
		{#if error}
			<div class="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
				<p class="font-semibold">エラーが発生しました</p>
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		<!-- Dashboard Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<DashboardCard
				title="今月の給料"
				value={formatCurrency(dashboardData.currentMonthSalary)}
				icon={DollarSign}
			/>
			<DashboardCard
				title="年収累計"
				value={formatCurrency(dashboardData.yearlyIncome)}
				subtitle="今年の合計"
				icon={TrendingUp}
			/>
			<DashboardCard
				title="総資産額"
				value={formatCurrency(dashboardData.totalAssets)}
				subtitle={`預金: ${formatCurrency(dashboardData.depositBalance)}`}
				icon={Wallet}
			/>
			<DashboardCard
				title="株式評価額"
				value={formatCurrency(dashboardData.stockValuation)}
				subtitle={`${dashboardData.stocks.length}銘柄保有`}
				icon={ChartBar}
			/>
		</div>

		<!-- Salary Chart -->
		{#if salaryChartData}
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-900">
					<ChartBar size={20} />
					{salaryChartData.year}年 給料推移
				</h2>
				<SalaryChart data={salaryChartData} height="400px" />
			</div>
		{/if}

		<!-- Recent Salary Slips -->
		{#if salarySlips && salarySlips.length > 0}
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-xl font-semibold text-gray-900">
						<FileText size={20} />
						最近の給料明細
					</h2>
					<a
						href="/salary-slips"
						class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
					>
						すべて見る
						<ChevronRight size={16} />
					</a>
				</div>
				<!-- 給料明細リスト -->
				<div class="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each salarySlips.slice(0, 3) as salarySlip (salarySlip.salarySlip.paymentDate)}
						<button
							type="button"
							onclick={() => selectSalarySlip(salarySlip)}
							class="rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50 {selectedSalarySlip
								?.salarySlip.paymentDate === salarySlip.salarySlip.paymentDate
								? 'border-blue-300 bg-blue-50'
								: ''}"
						>
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-gray-900">
										{salarySlip.salarySlip.paymentDate} 支給分
									</p>
									<p class="text-sm text-gray-600">
										{salarySlip.fileName}
									</p>
								</div>
								<p class="text-lg font-semibold text-blue-600">
									¥{salarySlip.salarySlip.netPay.toLocaleString()}
								</p>
							</div>
						</button>
					{/each}
				</div>
				<!-- 選択された給料明細の詳細 -->
				{#if selectedSalarySlip}
					<div class="rounded-lg bg-gray-50 p-6">
						<SalarySlipDisplay salarySlip={selectedSalarySlip.salarySlip} />
					</div>
				{/if}
			</div>
		{/if}

		<!-- Stock Portfolio Preview -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-900">保有株式</h2>
				<StockPriceUpdater
					stocks={dashboardData.stocks}
					onPricesUpdate={handleStockPricesUpdate}
					updateInterval={60000}
				/>
			</div>
			<StockTable stocks={dashboardData.stocks} />
		</div>
	</main>

	<!-- Footer -->
	<footer class="mt-auto bg-white">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<p class="text-center text-sm text-gray-500">&copy; 2024 給料・資産管理アプリ</p>
		</div>
	</footer>
</div>

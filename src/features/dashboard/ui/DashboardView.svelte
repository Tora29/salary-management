<script lang="ts">
	// Svelte core imports
	import { onMount } from 'svelte';

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

	// Project feature imports (feature components)
	import { SalarySlipDisplay } from '$entities/salary-slip';

	// Library utils and constants
	import { formatCurrency } from '$lib/utils/format';
	import { BUSINESS_ERROR_MESSAGES } from '$lib/consts/businessErrorMessages';

	// Type imports (grouped together)
	import type { DashboardResponse } from '$lib/api/types';
	import type { ParsedSalaryData } from '$entities/salary-slip/model';

	interface Props {
		data?: {
			dashboardData?: DashboardResponse;
			error?: string;
		};
	}

	let { data }: Props = $props();

	let dashboardData = $state<DashboardResponse>(
		data?.dashboardData || {
			currentMonthSalary: 0,
			yearlyIncome: 0,
			depositBalance: 0,
			stockValuation: 0,
			stocks: [],
			totalAssets: 0
		}
	);
	let salarySlips = $state<ParsedSalaryData[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(data?.error || null);
	let selectedSalarySlip = $state<ParsedSalaryData | null>(null);

	async function loadData() {
		isLoading = true;
		error = null;

		try {
			// ダッシュボードデータをAPIから取得
			const dashboardResponse = await fetch('/api/dashboard');
			if (!dashboardResponse.ok) {
				throw new Error(`Dashboard API error: ${dashboardResponse.status}`);
			}
			dashboardData = await dashboardResponse.json();

			// 給料明細データをAPIから取得
			const salarySlipsResponse = await fetch('/api/salary-slips');
			if (!salarySlipsResponse.ok) {
				throw new Error(`Salary slips API error: ${salarySlipsResponse.status}`);
			}
			salarySlips = await salarySlipsResponse.json();
		} catch (err) {
			console.error('Error loading dashboard:', err);
			error = BUSINESS_ERROR_MESSAGES.STOCK.FETCH_FAILED;
		} finally {
			isLoading = false;
		}
	}

	async function handleRefresh() {
		await loadData();
	}

	function selectSalarySlip(salarySlip: ParsedSalaryData) {
		selectedSalarySlip = salarySlip;
	}

	onMount(() => {
		// propsでデータが提供されていない場合のみAPIからデータを取得
		if (!data?.dashboardData) {
			loadData();
		}
	});
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
				<div class="grid gap-4 lg:grid-cols-2">
					<!-- 給料明細リスト -->
					<div>
						<div class="space-y-2">
							{#each salarySlips as salarySlip}
								<button
									type="button"
									onclick={() => selectSalarySlip(salarySlip)}
									class="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50 {selectedSalarySlip
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
					</div>
					<!-- 選択された給料明細の詳細 -->
					<div>
						{#if selectedSalarySlip}
							<div class="rounded-lg border border-gray-200 p-4">
								<h3 class="mb-3 text-lg font-semibold text-gray-900">給料明細詳細</h3>
								<SalarySlipDisplay salarySlip={selectedSalarySlip.salarySlip} />
							</div>
						{:else}
							<div
								class="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
							>
								<p class="text-gray-600">給料明細を選択すると詳細が表示されます</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Stock Portfolio Preview -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">保有株式</h2>
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

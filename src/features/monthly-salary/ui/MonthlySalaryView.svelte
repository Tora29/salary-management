<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { DollarSign, TrendingUp, MinusCircle, BarChart3 } from '@lucide/svelte';

	import Card from '$lib/components/card/ui/Card.svelte';
	import { SalarySlipDisplay } from '$entities/salary-slip';

	import { formatCurrency } from '$lib/utils/format';

	import type { MonthlySalaryResponse } from '$features/monthly-salary/api';
	import type { ParsedSalaryData } from '$entities/salary-slip/model';

	interface Props {
		monthlySalaryData: MonthlySalaryResponse;
		selectedYear?: string | null;
		selectedMonth?: string | null;
		error?: string | null | undefined;
	}

	let { monthlySalaryData, error = null }: Props = $props();

	let selectedSalarySlip = $state<ParsedSalaryData | null>(null);


	function handleYearChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const year = target.value;
		const params = new URLSearchParams($page.url.searchParams);
		params.set('year', year);
		goto(`?${params.toString()}`);
	}

	function selectSalarySlip(salarySlip: ParsedSalaryData) {
		selectedSalarySlip = salarySlip;
	}
</script>

<svelte:head>
	<title>月別給料一覧 - 給料・資産管理</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">月別給料一覧</h1>
			<div class="flex items-center gap-4">
				<label for="year-select" class="text-sm font-medium text-gray-700">表示年度:</label>
				<select
					id="year-select"
					value={monthlySalaryData.selectedYear}
					onchange={handleYearChange}
					class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
				>
					{#each monthlySalaryData.availableYears as year}
						<option value={year}>{year}年</option>
					{/each}
				</select>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if error}
			<div class="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
				<p class="font-semibold">エラーが発生しました</p>
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		<!-- 年間統計カード -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			<Card
				title="年間総支給額"
				value={formatCurrency(monthlySalaryData.yearStats.totalNetPay)}
				subtitle="{monthlySalaryData.yearStats.monthCount}ヶ月分"
				icon={DollarSign}
			/>
			<Card
				title="年間総収入"
				value={formatCurrency(monthlySalaryData.yearStats.totalEarnings)}
				subtitle="税引き前"
				icon={TrendingUp}
			/>
			<Card
				title="年間総控除額"
				value={formatCurrency(monthlySalaryData.yearStats.totalDeductions)}
				subtitle="税金・保険料等"
				icon={MinusCircle}
			/>
			<Card
				title="月平均支給額"
				value={formatCurrency(monthlySalaryData.yearStats.averageNetPay)}
				subtitle="手取り平均"
				icon={BarChart3}
			/>
		</div>

		<!-- 月別データ -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-6 text-xl font-semibold text-gray-900">
				{monthlySalaryData.selectedYear}年 月別詳細
			</h2>

			{#if monthlySalaryData.monthlyData.length === 0}
				<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
					<p class="text-lg text-gray-600">選択した年度にデータがありません</p>
					<p class="mt-2 text-sm text-gray-500">他の年度を選択してください</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each monthlySalaryData.monthlyData as monthData}
						<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
							<div class="p-4">
								<div class="mb-4 flex items-center justify-between">
									<h3 class="text-lg font-semibold text-gray-900">
										{monthData.month.replace('-', '年')}月
									</h3>
									<div class="text-right">
										<p class="text-2xl font-bold text-blue-600">
											{formatCurrency(monthData.totalNetPay)}
										</p>
										<p class="text-sm text-gray-500">{monthData.count}件の明細</p>
									</div>
								</div>

								{#if monthData.slips.length > 0}
									<!-- 明細リスト -->
									<div class="mb-6">
										<h4 class="mb-2 text-sm font-medium text-gray-700">給料明細一覧</h4>
										<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
											{#each monthData.slips as slip}
												<button
													type="button"
													onclick={() => selectSalarySlip(slip)}
													class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 {selectedSalarySlip
														?.salarySlip.paymentDate === slip.salarySlip.paymentDate
														? 'border-blue-300 bg-blue-50'
														: ''}"
												>
													<div class="flex items-center justify-between">
														<div>
															<p class="font-medium text-gray-900">
																{slip.salarySlip.paymentDate}
															</p>
															<p class="text-sm text-gray-600">{slip.fileName}</p>
														</div>
														<p class="font-semibold text-blue-600">
															{formatCurrency(slip.salarySlip.netPay)}
														</p>
													</div>
												</button>
											{/each}
										</div>
									</div>

									<!-- 選択された明細の詳細 -->
									{#if selectedSalarySlip}
										<div>
											<h4 class="mb-4 text-sm font-medium text-gray-700">明細詳細</h4>
											<div class="rounded-lg bg-gray-50 p-6">
												<SalarySlipDisplay salarySlip={selectedSalarySlip.salarySlip} />
											</div>
										</div>
									{:else}
										<div
											class="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
										>
											<p class="text-gray-600">明細を選択すると詳細が表示されます</p>
										</div>
									{/if}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

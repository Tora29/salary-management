<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	import { formatCurrency } from '$lib/utils/format';

	import FileDropZone from './FileDropZone.svelte';

	import { SalarySlipDisplay } from '$entities/dashboard';
	import type { ParsedSalaryData } from '$entities/salary-slip/model';
	import { FileText, FileUp } from '@lucide/svelte';

	interface Props {
		salaryHistory: ParsedSalaryData[];
		error?: string | null | undefined;
	}

	let { salaryHistory = [], error = null }: Props = $props();

	let isLoading = $state(false);
	let selectedSalarySlip = $state<ParsedSalaryData | null>(null);
	let parsedSalaryData = $state<ParsedSalaryData | null>(null);
	let uploadError = $state<string | null>(null);
	let isProcessing = $state(false);

	async function reloadSalarySlips() {
		isLoading = true;
		await invalidateAll();
		isLoading = false;
	}

	function handleSlipSelect(slip: ParsedSalaryData) {
		selectedSalarySlip = slip;
	}

	async function handleFileSelect(file: File) {
		isProcessing = true;
		uploadError = null;

		try {
			// 動的インポートで parseSalarySlipPDF を読み込む
			const { parseSalarySlipPDF } = await import('$lib/utils/pdf/parser');
			const parsedResult = await parseSalarySlipPDF(file);
			parsedSalaryData = parsedResult;

			// DBに保存
			const response = await fetch('/api/salary-slips', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					salarySlip: parsedResult.salarySlip,
					fileName: file.name
				})
			});

			const saveResult = await response.json();

			if (!response.ok || !saveResult.success) {
				// 重複エラーの場合は特別な処理
				if (saveResult.duplicate && saveResult.existingSlip) {
					throw new Error(
						`同じ支給日（${saveResult.existingSlip.paymentDate}）の明細が既に存在します: ${saveResult.existingSlip.fileName}`
					);
				}
				throw new Error(saveResult.error || '保存に失敗しました');
			}

			// アップロード成功時にリストを再読み込み
			await reloadSalarySlips();
		} catch (err) {
			console.error('Upload error:', err);
			uploadError = err instanceof Error ? err.message : 'アップロードに失敗しました';
		} finally {
			isProcessing = false;
		}
	}
</script>

<svelte:head>
	<title>給料明細一覧 - 給料・資産管理</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm">
		<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">給料明細管理</h1>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if error}
			<div class="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
				<p class="font-semibold">エラーが発生しました</p>
				<p class="text-sm">{error}</p>
			</div>
		{/if}

		<!-- PDF アップロードセクション -->
		<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
			<div class="mb-4 flex items-center gap-2">
				<FileUp size={24} />
				<h2 class="text-xl font-semibold text-gray-900">PDF アップロード</h2>
			</div>
			<FileDropZone onFileSelect={handleFileSelect} {isProcessing} error={uploadError} />
		</div>

		<!-- 解析結果表示 -->
		{#if parsedSalaryData}
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">解析結果</h2>
				<SalarySlipDisplay salarySlip={parsedSalaryData.salarySlip} />
			</div>
		{/if}

		<!-- 給料明細履歴 -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<div class="mb-6 flex items-center gap-2">
				<FileText size={24} />
				<h2 class="text-xl font-semibold text-gray-900">
					給料明細履歴 ({salaryHistory.length}件)
				</h2>
			</div>

			{#if isLoading}
				<div class="flex items-center justify-center py-12">
					<div class="text-gray-600">読み込み中...</div>
				</div>
			{:else if salaryHistory.length === 0}
				<div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
					<FileText size={48} class="mx-auto mb-4 text-gray-400" />
					<p class="text-lg text-gray-600">給料明細がありません</p>
					<p class="mt-2 text-sm text-gray-500">PDFをアップロードして明細を登録してください</p>
				</div>
			{:else}
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- 明細リスト -->
					<div>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">明細一覧</h3>
						<div class="space-y-3">
							{#each salaryHistory as slip}
								<button
									type="button"
									onclick={() => handleSlipSelect(slip)}
									class="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 {selectedSalarySlip
										?.salarySlip.paymentDate === slip.salarySlip.paymentDate
										? 'border-blue-300 bg-blue-50'
										: ''}"
								>
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<p class="font-semibold text-gray-900">
												{slip.salarySlip.paymentDate}
											</p>
											<p class="text-sm text-gray-600">{slip.fileName}</p>
											<p class="text-xs text-gray-500">
												アップロード: {new Date(slip.uploadedAt).toLocaleDateString()}
											</p>
										</div>
										<div class="text-right">
											<p class="text-lg font-bold text-blue-600">
												{formatCurrency(slip.salarySlip.netPay)}
											</p>
											<p class="text-sm text-gray-500">手取り</p>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- 選択された明細の詳細 -->
					<div>
						<h3 class="mb-4 text-lg font-semibold text-gray-900">明細詳細</h3>
						{#if selectedSalarySlip}
							<div class="rounded-lg border border-gray-200 bg-white p-4">
								<SalarySlipDisplay salarySlip={selectedSalarySlip.salarySlip} />
							</div>
						{:else}
							<div
								class="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
							>
								<p class="text-gray-600">左の一覧から明細を選択してください</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>

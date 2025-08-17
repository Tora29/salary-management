<script lang="ts">
	import type { ExtractedSalaryData } from '$entities/salary/model/types';
	import Button from '$shared/components/ui/Button.svelte';

	interface Props {
		data: ExtractedSalaryData | null;
		onSave: (data: ExtractedSalaryData) => void;
		onCancel?: () => void;
		isLoading?: boolean;
	}

	let { data, onSave, onCancel, isLoading = false }: Props = $props();

	// dataが変更されたときに editedData を更新する
	let editedData = $state<ExtractedSalaryData>({
		paymentDate: '',
		basicSalary: 0,
		overtimeAllowance: 0,
		commutingAllowance: 0,
		healthInsurance: 0,
		pensionInsurance: 0,
		employmentInsurance: 0,
		incomeTax: 0,
		residentTax: 0,
		totalPayment: 0,
		totalDeductions: 0,
		netPayment: 0
	});

	// dataが更新されたら editedData に反映
	$effect(() => {
		console.log('ExtractionResultEditor received data:', data);
		if (data) {
			const newData = {
				paymentDate: data.paymentDate || '',
				basicSalary: data.basicSalary || 0,
				overtimeAllowance: data.overtimeAllowance || 0,
				commutingAllowance: data.commutingAllowance || 0,
				healthInsurance: data.healthInsurance || 0,
				pensionInsurance: data.pensionInsurance || 0,
				employmentInsurance: data.employmentInsurance || 0,
				incomeTax: data.incomeTax || 0,
				residentTax: data.residentTax || 0,
				totalPayment: data.totalPayment || 0,
				totalDeductions: data.totalDeductions || 0,
				netPayment: data.netPayment || 0
			};
			console.log('Setting editedData to:', newData);
			editedData = newData;
		} else {
			console.log('No data received, using default values');
		}
	});

	function calculateTotals() {
		const totalPayment =
			(editedData.basicSalary || 0) +
			(editedData.overtimeAllowance || 0) +
			(editedData.commutingAllowance || 0);

		const totalDeductions =
			(editedData.healthInsurance || 0) +
			(editedData.pensionInsurance || 0) +
			(editedData.employmentInsurance || 0) +
			(editedData.incomeTax || 0) +
			(editedData.residentTax || 0);

		editedData.totalPayment = totalPayment;
		editedData.totalDeductions = totalDeductions;
		editedData.netPayment = totalPayment - totalDeductions;
	}

	function handleSave() {
		calculateTotals();
		onSave(editedData);
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}
</script>

<div class="extraction-result-editor">
	<h3 class="section-title">抽出データの確認・編集</h3>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSave();
		}}
	>
		<div class="form-section">
			<h4>基本情報</h4>
			<div class="form-group">
				<label for="paymentDate">支給年月</label>
				<input
					id="paymentDate"
					type="text"
					bind:value={editedData.paymentDate}
					placeholder="2025年1月"
					class="form-input"
				/>
			</div>
		</div>

		<div class="form-section">
			<h4>支給項目</h4>
			<div class="form-row">
				<div class="form-group">
					<label for="basicSalary">基本給</label>
					<input
						id="basicSalary"
						type="number"
						bind:value={editedData.basicSalary}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="overtimeAllowance">残業手当</label>
					<input
						id="overtimeAllowance"
						type="number"
						bind:value={editedData.overtimeAllowance}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="commutingAllowance">通勤手当</label>
					<input
						id="commutingAllowance"
						type="number"
						bind:value={editedData.commutingAllowance}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
			</div>
		</div>

		<div class="form-section">
			<h4>控除項目</h4>
			<div class="form-row">
				<div class="form-group">
					<label for="healthInsurance">健康保険</label>
					<input
						id="healthInsurance"
						type="number"
						bind:value={editedData.healthInsurance}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="pensionInsurance">厚生年金</label>
					<input
						id="pensionInsurance"
						type="number"
						bind:value={editedData.pensionInsurance}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="employmentInsurance">雇用保険</label>
					<input
						id="employmentInsurance"
						type="number"
						bind:value={editedData.employmentInsurance}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-group">
					<label for="incomeTax">所得税</label>
					<input
						id="incomeTax"
						type="number"
						bind:value={editedData.incomeTax}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
				<div class="form-group">
					<label for="residentTax">住民税</label>
					<input
						id="residentTax"
						type="number"
						bind:value={editedData.residentTax}
						onchange={calculateTotals}
						class="form-input"
					/>
				</div>
			</div>
		</div>

		<div class="form-section totals">
			<h4>合計</h4>
			<div class="total-row">
				<span>総支給額:</span>
				<span class="amount">{formatCurrency(editedData.totalPayment || 0)}</span>
			</div>
			<div class="total-row">
				<span>控除合計:</span>
				<span class="amount">{formatCurrency(editedData.totalDeductions || 0)}</span>
			</div>
			<div class="total-row net-payment">
				<span>差引支給額:</span>
				<span class="amount">{formatCurrency(editedData.netPayment || 0)}</span>
			</div>
		</div>

		<div class="button-group">
			{#if onCancel}
				<Button type="button" variant="secondary" onclick={onCancel} disabled={isLoading}>
					キャンセル
				</Button>
			{/if}
			<Button type="submit" variant="primary" loading={isLoading}>保存</Button>
		</div>
	</form>
</div>

<style>
	.extraction-result-editor {
		background: white;
		border-radius: 0.5rem;
		padding: 1.5rem;
		box-shadow:
			0 1px 3px 0 rgba(0, 0, 0, 0.1),
			0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}

	.form-section {
		margin-bottom: 2rem;
	}

	.form-section h4 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-group label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
	}

	.form-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.15s;
		background-color: white;
		color: #1f2937; /* 濃いグレーで見やすく */
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* ダークモード対応 */
	:global(.dark) .form-input {
		background-color: #374151;
		color: #f3f4f6;
		border-color: #4b5563;
	}

	:global(.dark) .form-input:focus {
		border-color: #60a5fa;
		box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
	}

	/* 数値入力フィールドは右寄せ */
	.form-input[type='number'] {
		text-align: right;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.totals {
		background: #f9fafb;
		padding: 1rem;
		border-radius: 0.375rem;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.875rem;
	}

	.total-row.net-payment {
		border-top: 2px solid #e5e7eb;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		font-weight: 600;
		font-size: 1rem;
	}

	.amount {
		font-weight: 500;
		color: #1f2937;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
</style>

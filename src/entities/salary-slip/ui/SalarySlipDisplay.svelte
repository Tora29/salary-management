<script lang="ts">
	import type { SalarySlipDisplayProps } from '$entities/salary-slip/model';
	import { Clock, DollarSign, FileText } from '@lucide/svelte';

	let { salarySlip }: SalarySlipDisplayProps = $props();

	function formatCurrency(amount: number): string {
		if (typeof amount !== 'number' || isNaN(amount)) {
			return '¥0';
		}
		return `¥${amount.toLocaleString('ja-JP')}`;
	}

	function formatHours(hours: number): string {
		if (hours === 0) return '0:00';
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}:${m.toString().padStart(2, '0')}`;
	}
</script>

<div class="w-full">
	<!-- 差引支給額 -->
	<div
		class="mb-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-center text-white shadow-md"
	>
		<h2 class="mb-2 text-lg font-medium opacity-95">差引支給額</h2>
		<div class="text-5xl leading-none font-bold">{formatCurrency(salarySlip.netPay)}</div>
	</div>

	<!-- 詳細情報 -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- 勤怠 -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3 text-slate-800">
				<Clock size={24} />
				<h3 class="text-lg font-semibold">勤怠</h3>
			</div>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">固定外残業時間</span>
					<span class="font-mono font-medium text-slate-800"
						>{formatHours(salarySlip.attendance.overtimeHours)}</span
					>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">固定外残業時間(60時間超)</span>
					<span class="font-mono font-medium text-slate-800"
						>{formatHours(salarySlip.attendance.overtimeHoursOver60)}</span
					>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">深夜割増時間</span>
					<span class="font-mono font-medium text-slate-800"
						>{formatHours(salarySlip.attendance.lateNightHours)}</span
					>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">有休残日数</span>
					<span class="font-mono font-medium text-slate-800"
						>{salarySlip.attendance.paidLeaveDays}日</span
					>
				</div>
			</div>
		</div>

		<!-- 支給 -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3 text-slate-800">
				<DollarSign size={24} />
				<h3 class="text-lg font-semibold">支給</h3>
			</div>
			<div class="flex flex-col gap-4">
				{#if salarySlip.earnings.baseSalary && salarySlip.earnings.baseSalary > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">基本給(月給)</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.baseSalary)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.fixedOvertimeAllowance && salarySlip.earnings.fixedOvertimeAllowance > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">固定時間外手当</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.fixedOvertimeAllowance)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.overtimePay && salarySlip.earnings.overtimePay > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">残業手当</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.overtimePay)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.overtimePayOver60 && salarySlip.earnings.overtimePayOver60 > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">残業手当(60時間超)</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.overtimePayOver60)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.lateNightPay && salarySlip.earnings.lateNightPay > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">深夜割増額</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.lateNightPay)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.expenseReimbursement && salarySlip.earnings.expenseReimbursement > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">立替経費</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.expenseReimbursement)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.transportationAllowance && salarySlip.earnings.transportationAllowance > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">非課税通勤費</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.transportationAllowance)}</span
						>
					</div>
				{/if}
				{#if salarySlip.earnings.stockPurchaseIncentive && salarySlip.earnings.stockPurchaseIncentive > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">持株会奨励金</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.earnings.stockPurchaseIncentive)}</span
						>
					</div>
				{/if}
				<div
					class="mt-2 flex items-center justify-between border-t border-gray-200 pt-4 text-sm font-semibold"
				>
					<span class="text-slate-800">支給合計</span>
					<span class="font-mono text-slate-800">{formatCurrency(salarySlip.earnings.total)}</span>
				</div>
			</div>
		</div>

		<!-- 控除 -->
		<div class="rounded-xl bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3 text-slate-800">
				<FileText size={24} />
				<h3 class="text-lg font-semibold">控除</h3>
			</div>
			<div class="flex flex-col gap-4">
				{#if salarySlip.deductions.healthInsurance > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">健康保険料</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.healthInsurance)}</span
						>
					</div>
				{/if}
				{#if salarySlip.deductions.welfareInsurance > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">厚生年金保険</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.welfareInsurance)}</span
						>
					</div>
				{/if}
				{#if salarySlip.deductions.employmentInsurance > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">雇用保険料</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.employmentInsurance)}</span
						>
					</div>
				{/if}
				{#if salarySlip.deductions.residentTax > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">住民税</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.residentTax)}</span
						>
					</div>
				{/if}
				{#if salarySlip.deductions.incomeTax > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">所得税</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.incomeTax)}</span
						>
					</div>
				{/if}
				{#if salarySlip.deductions.otherDeductions > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-gray-500">その他控除</span>
						<span class="font-mono font-medium text-slate-800"
							>{formatCurrency(salarySlip.deductions.otherDeductions)}</span
						>
					</div>
				{/if}
				<div
					class="mt-2 flex items-center justify-between border-t border-gray-200 pt-4 text-sm font-semibold"
				>
					<span class="text-slate-800">控除合計</span>
					<span class="font-mono text-slate-800">{formatCurrency(salarySlip.deductions.total)}</span
					>
				</div>
			</div>
		</div>
	</div>
</div>

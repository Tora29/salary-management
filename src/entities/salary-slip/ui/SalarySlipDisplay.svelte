<script lang="ts">
	import { Calendar, DollarSign, Clock, Receipt } from '@lucide/svelte';
	import type { SalarySlip } from '$entities/salary-slip/model';

	interface Props {
		salarySlip: SalarySlip;
	}

	let { salarySlip }: Props = $props();

	function formatCurrency(amount: number): string {
		return `¥${amount.toLocaleString('ja-JP')}`;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatHours(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}:${m.toString().padStart(2, '0')}`;
	}
</script>

<div class="salary-slip">
	<header class="header">
		<div class="company-info">
			<h2 class="company-name">{salarySlip.companyName}</h2>
			<div class="employee-info">
				<span class="employee-name">{salarySlip.employeeName}</span>
				<span class="employee-id">{salarySlip.employeeId}</span>
			</div>
		</div>

		<div class="payment-info">
			<div class="payment-date">
				<Calendar size={16} />
				<span>{formatDate(salarySlip.paymentDate)} 支給</span>
			</div>
			<div class="target-period">
				<span
					>対象期間: {formatDate(salarySlip.targetPeriod.start)} 〜 {formatDate(
						salarySlip.targetPeriod.end
					)}</span
				>
			</div>
		</div>
	</header>

	<div class="net-pay-section">
		<div class="net-pay-label">差引支給額</div>
		<div class="net-pay-amount">{formatCurrency(salarySlip.netPay)}</div>
	</div>

	<div class="details-grid">
		<section class="section attendance-section">
			<h3 class="section-title">
				<Clock size={20} />
				<span>勤怠</span>
			</h3>
			<div class="items">
				<div class="item">
					<span class="label">固定外残業時間</span>
					<span class="value">{formatHours(salarySlip.attendance.overtimeHours)}</span>
				</div>
				<div class="item">
					<span class="label">固定外残業時間(60時間超)</span>
					<span class="value">{formatHours(salarySlip.attendance.overtimeHoursOver60)}</span>
				</div>
				<div class="item">
					<span class="label">深夜割増時間</span>
					<span class="value">{formatHours(salarySlip.attendance.lateNightHours)}</span>
				</div>
				<div class="item">
					<span class="label">有休残日数</span>
					<span class="value">{salarySlip.attendance.paidLeaveDays}日</span>
				</div>
			</div>
		</section>

		<section class="section earnings-section">
			<h3 class="section-title">
				<DollarSign size={20} />
				<span>支給</span>
			</h3>
			<div class="items">
				{#if salarySlip.earnings.baseSalary > 0}
					<div class="item">
						<span class="label">基本給(月給)</span>
						<span class="value">{formatCurrency(salarySlip.earnings.baseSalary)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.fixedOvertimeAllowance > 0}
					<div class="item">
						<span class="label">固定時間外手当</span>
						<span class="value">{formatCurrency(salarySlip.earnings.fixedOvertimeAllowance)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.overtimePay > 0}
					<div class="item">
						<span class="label">残業手当</span>
						<span class="value">{formatCurrency(salarySlip.earnings.overtimePay)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.overtimePayOver60 > 0}
					<div class="item">
						<span class="label">残業手当(60時間超)</span>
						<span class="value">{formatCurrency(salarySlip.earnings.overtimePayOver60)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.lateNightPay > 0}
					<div class="item">
						<span class="label">深夜割増額</span>
						<span class="value">{formatCurrency(salarySlip.earnings.lateNightPay)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.expenseReimbursement > 0}
					<div class="item">
						<span class="label">立替経費</span>
						<span class="value">{formatCurrency(salarySlip.earnings.expenseReimbursement)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.commuterAllowance > 0}
					<div class="item">
						<span class="label">非課税通勤費</span>
						<span class="value">{formatCurrency(salarySlip.earnings.commuterAllowance)}</span>
					</div>
				{/if}
				{#if salarySlip.earnings.stockPurchaseIncentive > 0}
					<div class="item">
						<span class="label">持株会奨励金</span>
						<span class="value">{formatCurrency(salarySlip.earnings.stockPurchaseIncentive)}</span>
					</div>
				{/if}
				<div class="item total">
					<span class="label">支給合計</span>
					<span class="value">{formatCurrency(salarySlip.earnings.total)}</span>
				</div>
			</div>
		</section>

		<section class="section deductions-section">
			<h3 class="section-title">
				<Receipt size={20} />
				<span>控除</span>
			</h3>
			<div class="items">
				{#if salarySlip.deductions.healthInsurance > 0}
					<div class="item">
						<span class="label">健康保険料</span>
						<span class="value">{formatCurrency(salarySlip.deductions.healthInsurance)}</span>
					</div>
				{/if}
				{#if salarySlip.deductions.employeePension > 0}
					<div class="item">
						<span class="label">厚生年金保険</span>
						<span class="value">{formatCurrency(salarySlip.deductions.employeePension)}</span>
					</div>
				{/if}
				{#if salarySlip.deductions.employmentInsurance > 0}
					<div class="item">
						<span class="label">雇用保険料</span>
						<span class="value">{formatCurrency(salarySlip.deductions.employmentInsurance)}</span>
					</div>
				{/if}
				{#if salarySlip.deductions.residentTax > 0}
					<div class="item">
						<span class="label">住民税</span>
						<span class="value">{formatCurrency(salarySlip.deductions.residentTax)}</span>
					</div>
				{/if}
				{#if salarySlip.deductions.incomeTax > 0}
					<div class="item">
						<span class="label">所得税</span>
						<span class="value">{formatCurrency(salarySlip.deductions.incomeTax)}</span>
					</div>
				{/if}
				{#if salarySlip.deductions.stockPurchaseContribution > 0}
					<div class="item">
						<span class="label">持株会拠出金</span>
						<span class="value"
							>{formatCurrency(salarySlip.deductions.stockPurchaseContribution)}</span
						>
					</div>
				{/if}
				<div class="item total">
					<span class="label">控除合計</span>
					<span class="value">{formatCurrency(salarySlip.deductions.total)}</span>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.salary-slip {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.header {
		background: #f8fafc;
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.company-info {
		margin-bottom: 1rem;
	}

	.company-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 0.5rem 0;
	}

	.employee-info {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.employee-name {
		font-size: 1.125rem;
		font-weight: 500;
		color: #334155;
	}

	.employee-id {
		font-size: 0.875rem;
		color: #64748b;
		background: #e2e8f0;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
	}

	.payment-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
	}

	.payment-date,
	.target-period {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.net-pay-section {
		padding: 2rem;
		text-align: center;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: white;
	}

	.net-pay-label {
		font-size: 0.875rem;
		opacity: 0.9;
		margin-bottom: 0.5rem;
	}

	.net-pay-amount {
		font-size: 2.5rem;
		font-weight: 700;
	}

	.details-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		padding: 1.5rem;
	}

	@media (min-width: 768px) {
		.details-grid {
			grid-template-columns: 1fr 1fr;
		}

		.attendance-section {
			grid-column: span 2;
		}
	}

	@media (min-width: 1024px) {
		.details-grid {
			grid-template-columns: 1fr 1fr 1fr;
		}

		.attendance-section {
			grid-column: span 1;
		}
	}

	.section {
		background: #f8fafc;
		border-radius: 8px;
		padding: 1.25rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 1rem 0;
	}

	.items {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.item.total {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #e2e8f0;
		font-weight: 600;
	}

	.label {
		color: #64748b;
	}

	.value {
		color: #1e293b;
		font-weight: 500;
	}

	.item.total .label,
	.item.total .value {
		color: #1e293b;
	}
</style>

import type { SalarySlip } from '$entities/salary-slip/model';

export interface SalarySlipDisplayProps {
	/** 表示する給料明細データ */
	salarySlip: SalarySlip;
}

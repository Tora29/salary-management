export interface SalarySlip {
	companyName: string;
	employeeName: string;
	employeeId: string;
	paymentDate: string;
	targetPeriod: {
		start: string;
		end: string;
	};
	netPay: number;
	attendance: {
		overtimeHours: number;
		overtimeHoursOver60: number;
		lateNightHours: number;
		paidLeaveDays: number;
	};
	earnings: {
		baseSalary: number;
		overtimePay: number; // 通常の残業手当
		overtimePayOver60: number; // 60時間超残業手当
		lateNightPay: number; // 深夜割増額
		fixedOvertimeAllowance: number; // 固定時間外手当
		expenseReimbursement: number; // 立替経費
		transportationAllowance: number; // 通勤手当
		stockPurchaseIncentive: number; // 持株会奨励金
		total: number;
	};
	deductions: {
		healthInsurance: number;
		welfareInsurance: number;
		employmentInsurance: number;
		incomeTax: number;
		residentTax: number;
		otherDeductions: number;
		total: number;
	};
	remarks?: string;
}

export interface ParsedSalaryData {
	salarySlip: SalarySlip;
	rawText: string;
	fileName: string;
	uploadedAt: string;
}

export interface SalarySlipDisplayProps {
	/** 表示する給料明細データ */
	salarySlip: SalarySlip;
}

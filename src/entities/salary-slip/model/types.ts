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
		fixedOvertimeAllowance: number;
		overtimePay: number;
		overtimePayOver60: number;
		lateNightPay: number;
		expenseReimbursement: number;
		commuterAllowance: number;
		stockPurchaseIncentive: number;
		total: number;
	};
	deductions: {
		healthInsurance: number;
		employeePension: number;
		employmentInsurance: number;
		residentTax: number;
		incomeTax: number;
		stockPurchaseContribution: number;
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

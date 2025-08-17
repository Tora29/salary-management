export interface Salary {
	id: string;
	profileId: string;
	yearMonth: string;
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	isBonus: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface SalaryComparison {
	current: number;
	previous: number;
	change: number;
	changePercentage: number;
}

export interface MonthlySalaryData {
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	previousMonthComparison: SalaryComparison | null;
}

export interface YearlyTrendData {
	month: string;
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	isBonus: boolean;
}

// PDF Import related types
export interface SalarySlip {
	id: string;
	userId: string;

	// 支給情報
	paymentDate: Date;
	basicSalary: number;
	overtimeAllowance?: number;
	commutingAllowance?: number;
	otherAllowances?: Array<{ name: string; amount: number }>;

	// 控除情報
	healthInsurance: number;
	pensionInsurance: number;
	employmentInsurance: number;
	incomeTax: number;
	residentTax: number;
	otherDeductions?: Array<{ name: string; amount: number }>;

	// 合計
	totalPayment: number;
	totalDeductions: number;
	netPayment: number;

	// メタデータ
	pdfFileUrl?: string;
	extractionConfidence?: number;
	extractionMethod?: 'auto' | 'manual' | 'template';

	createdAt: Date;
	updatedAt: Date;
}

export interface ExtractedSalaryData {
	// 支給情報
	paymentDate?: string;
	basicSalary?: number;
	overtimeAllowance?: number;
	commutingAllowance?: number;
	otherAllowances?: Array<{ name: string; amount: number }>;

	// 控除情報
	healthInsurance?: number;
	pensionInsurance?: number;
	employmentInsurance?: number;
	incomeTax?: number;
	residentTax?: number;
	otherDeductions?: Array<{ name: string; amount: number }>;

	// 合計
	totalPayment?: number;
	totalDeductions?: number;
	netPayment?: number;
}

export interface PdfUploadResult {
	success: boolean;
	fileId?: string;
	previewUrl?: string;
	error?: string;
}

export interface PdfExtractionResult {
	success: boolean;
	extractedData?: ExtractedSalaryData;
	confidence?: number;
	errors?: string[];
}

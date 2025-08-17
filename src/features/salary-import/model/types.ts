export interface ImportStep {
	id: 'upload' | 'preview' | 'edit' | 'complete';
	label: string;
	isCompleted: boolean;
}

export interface PdfImportState {
	currentStep: 'upload' | 'preview' | 'edit' | 'complete';
	selectedFile: File | null;
	fileId: string | null;
	previewUrl: string | null;
	extractedData: ExtractedData | null;
	isLoading: boolean;
	error: string | null;
}

export interface ExtractedData {
	paymentDate?: string;
	basicSalary?: number;
	overtimeAllowance?: number;
	commutingAllowance?: number;
	otherAllowances?: Array<{ name: string; amount: number }>;
	healthInsurance?: number;
	pensionInsurance?: number;
	employmentInsurance?: number;
	incomeTax?: number;
	residentTax?: number;
	otherDeductions?: Array<{ name: string; amount: number }>;
	totalPayment?: number;
	totalDeductions?: number;
	netPayment?: number;
	confidence?: number;
}

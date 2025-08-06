import { extractSalaryData, parseSalarySlipPDF } from '$lib/utils/pdf/parser';

import { describe, expect, it, vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
	getDocument: vi.fn(),
	GlobalWorkerOptions: {
		workerSrc: ''
	},
	version: '5.4.54'
}));

describe('PDF Parser', () => {
	describe('extractSalaryData', () => {
		it('給料明細のテキストから正しくデータを抽出できる', () => {
			const sampleText = `
        イグニション・ポイント フォース株式会社
        川上　虎己
        IGPF2400008
        2025(令和07)年07月25日支給分 給与明細
        差引支給額: 429,677
        対象期間: 07月01日 〜 07月31日
        
        勤怠
        固定外残業時間 15:00
        固定外残業時間(60時間超) 19:00
        深夜割増時間 14:00
        有休残日数 12.5
        
        支給
        基本給(月給) 326,767
        固定時間外手当 114,900
        残業手当 38,294
        残業手当(60時間超) 58,206
        深夜割増額 19,402
        立替経費 3,278
        非課税通勤費 9,620
        持株会奨励金 1,500
        合計 571,967
        
        控除
        健康保険料 20,900
        厚生年金保険 40,260
        雇用保険料 3,120
        住民税 17,600
        所得税 28,910
        持株会拠出金 31,500
        合計 142,290
      `;

			const result = extractSalaryData(sampleText);

			expect(result.companyName).toBe('イグニション・ポイント フォース株式会社');
			expect(result.employeeName).toBe('川上　虎己');
			expect(result.employeeId).toBe('IGPF2400008');
			expect(result.paymentDate).toBe('2025-07-25');
			expect(result.netPay).toBe(429677);

			expect(result.targetPeriod).toEqual({
				start: '2025-07-01',
				end: '2025-07-31'
			});

			expect(result.attendance).toEqual({
				overtimeHours: 15,
				overtimeHoursOver60: 19,
				lateNightHours: 14,
				paidLeaveDays: 12.5
			});

			expect(result.earnings).toEqual({
				baseSalary: 326767,
				overtimePay: 38294, // 通常の残業手当
				overtimePayOver60: 58206, // 60時間超残業手当
				lateNightPay: 19402, // 深夜割増額
				fixedOvertimeAllowance: 114900, // 固定時間外手当
				expenseReimbursement: 3278, // 立替経費
				transportationAllowance: 9620, // 通勤手当
				stockPurchaseIncentive: 1500, // 持株会奨励金
				total: 571967
			});

			expect(result.deductions).toEqual({
				healthInsurance: 20900,
				welfareInsurance: 40260, // employeePension → welfareInsurance
				employmentInsurance: 3120,
				incomeTax: 28910,
				residentTax: 17600,
				otherDeductions: 31500, // stockPurchaseContribution → otherDeductions
				total: 142290
			});
		});

		it('不正なテキストの場合はエラーをスローする', () => {
			const invalidText = 'これは給料明細ではありません';

			expect(() => extractSalaryData(invalidText)).toThrow(
				'給料明細のフォーマットが認識できません'
			);
		});
	});

	describe('parseSalarySlipPDF', () => {
		it('PDFファイルから給料明細データを抽出できる', async () => {
			const mockFile = new File(['dummy pdf content'], 'test.pdf', { type: 'application/pdf' });
			const mockTextContent = {
				items: [
					{ str: 'イグニション・ポイント フォース株式会社' },
					{ str: '川上　虎己' },
					{ str: 'IGPF2400008' },
					{ str: '2025(令和07)年07月25日支給分 給与明細' },
					{ str: '差引支給額: 429,677' }
				]
			};

			const { getDocument } = await import('pdfjs-dist');
			const mockPdfDocument = {
				numPages: 1,
				getPage: vi.fn().mockResolvedValue({
					getTextContent: vi.fn().mockResolvedValue(mockTextContent)
				})
			};

			vi.mocked(getDocument).mockReturnValue({
				promise: Promise.resolve(mockPdfDocument)
			} as any);

			const result = await parseSalarySlipPDF(mockFile);

			expect(result.fileName).toBe('test.pdf');
			expect(result.salarySlip).toBeDefined();
			expect(result.rawText).toContain('イグニション・ポイント フォース株式会社');
		});

		it('PDFファイル以外の場合はエラーをスローする', async () => {
			const notPdfFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

			await expect(parseSalarySlipPDF(notPdfFile)).rejects.toThrow('PDFファイルを選択してください');
		});
	});
});

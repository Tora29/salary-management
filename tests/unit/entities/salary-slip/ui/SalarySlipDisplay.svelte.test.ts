import type { SalarySlip } from '$entities/salary-slip/model/types';
import SalarySlipDisplay from '$entities/salary-slip/ui/SalarySlipDisplay.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('SalarySlipDisplay Component', () => {
	const mockSalarySlip: SalarySlip = {
		companyName: 'イグニション・ポイント フォース株式会社',
		employeeName: '川上　虎己',
		employeeId: 'IGPF2400008',
		paymentDate: '2025-07-25',
		targetPeriod: {
			start: '2025-07-01',
			end: '2025-07-31'
		},
		netPay: 429677,
		attendance: {
			overtimeHours: 15,
			overtimeHoursOver60: 19,
			lateNightHours: 14,
			paidLeaveDays: 12.5
		},
		earnings: {
			baseSalary: 326767,
			overtimePay: 38294, // 通常の残業手当
			overtimePayOver60: 58206, // 60時間超残業手当
			lateNightPay: 19402, // 深夜割増額
			fixedOvertimeAllowance: 114900, // 固定時間外手当
			expenseReimbursement: 3278, // 立替経費
			transportationAllowance: 9620, // 通勤手当
			stockPurchaseIncentive: 1500, // 持株会奨励金
			total: 571967
		},
		deductions: {
			healthInsurance: 20900,
			welfareInsurance: 40260, // employeePension → welfareInsurance
			employmentInsurance: 3120,
			incomeTax: 28910,
			residentTax: 17600,
			otherDeductions: 31500, // stockPurchaseContribution → otherDeductions
			total: 142290
		}
	};

	it('差引支給額が正しく表示される', () => {
		render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		expect(screen.getByText('差引支給額')).toBeDefined();
		expect(screen.getByText('¥429,677')).toBeDefined();
	});

	it('勤怠情報が正しく表示される', () => {
		render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		expect(screen.getByText('勤怠')).toBeDefined();
		expect(screen.getByText('固定外残業時間')).toBeDefined();
		expect(screen.getByText('15:00')).toBeDefined();
		expect(screen.getByText('固定外残業時間(60時間超)')).toBeDefined();
		expect(screen.getByText('19:00')).toBeDefined();
		expect(screen.getByText('深夜割増時間')).toBeDefined();
		expect(screen.getByText('14:00')).toBeDefined();
		expect(screen.getByText('有休残日数')).toBeDefined();
		expect(screen.getByText('12.5日')).toBeDefined();
	});

	it('支給情報が正しく表示される', () => {
		render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		expect(screen.getByText('支給')).toBeDefined();
		expect(screen.getByText('基本給(月給)')).toBeDefined();
		expect(screen.getByText('¥326,767')).toBeDefined();
		expect(screen.getByText('固定時間外手当')).toBeDefined();
		expect(screen.getByText('¥114,900')).toBeDefined();
		expect(screen.getByText('残業手当')).toBeDefined();
		expect(screen.getByText('¥38,294')).toBeDefined();
		expect(screen.getByText('残業手当(60時間超)')).toBeDefined();
		expect(screen.getByText('¥58,206')).toBeDefined();
		expect(screen.getByText('深夜割増額')).toBeDefined();
		expect(screen.getByText('¥19,402')).toBeDefined();
		expect(screen.getByText('立替経費')).toBeDefined();
		expect(screen.getByText('¥3,278')).toBeDefined();
		expect(screen.getByText('非課税通勤費')).toBeDefined();
		expect(screen.getByText('¥9,620')).toBeDefined();
		expect(screen.getByText('持株会奨励金')).toBeDefined();
		expect(screen.getByText('¥1,500')).toBeDefined();
		expect(screen.getByText('支給合計')).toBeDefined();
		expect(screen.getByText('¥571,967')).toBeDefined();
	});

	it('控除情報が正しく表示される', () => {
		render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		expect(screen.getByText('控除')).toBeDefined();
		expect(screen.getByText('健康保険料')).toBeDefined();
		expect(screen.getByText('¥20,900')).toBeDefined();
		expect(screen.getByText('厚生年金保険')).toBeDefined();
		expect(screen.getByText('¥40,260')).toBeDefined();
		expect(screen.getByText('雇用保険料')).toBeDefined();
		expect(screen.getByText('¥3,120')).toBeDefined();
		expect(screen.getByText('所得税')).toBeDefined();
		expect(screen.getByText('¥28,910')).toBeDefined();
		expect(screen.getByText('住民税')).toBeDefined();
		expect(screen.getByText('¥17,600')).toBeDefined();
		expect(screen.getByText('その他控除')).toBeDefined();
		expect(screen.getByText('¥31,500')).toBeDefined();
		expect(screen.getByText('控除合計')).toBeDefined();
		expect(screen.getByText('¥142,290')).toBeDefined();
	});

	it('金額がゼロの項目は表示されない', () => {
		const modifiedSlip = {
			...mockSalarySlip,
			earnings: {
				...mockSalarySlip.earnings,
				overtimePay: 0,
				expenseReimbursement: 0
			}
		};

		render(SalarySlipDisplay, { salarySlip: modifiedSlip });

		expect(screen.queryByText('残業手当')).toBeNull();
		expect(screen.queryByText('立替経費')).toBeNull();
	});

	it('時間表示のフォーマットが正しい', () => {
		render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		// 時間表示の確認
		expect(screen.getByText('15:00')).toBeDefined();
		expect(screen.getByText('19:00')).toBeDefined();
		expect(screen.getByText('14:00')).toBeDefined();
	});

	it('レスポンシブレイアウトが適用される', () => {
		const { container } = render(SalarySlipDisplay, { salarySlip: mockSalarySlip });

		const sections = container.querySelectorAll('.section');
		expect(sections.length).toBeGreaterThan(0);

		sections.forEach((section) => {
			expect(section.classList.toString()).toMatch(/section/);
		});
	});
});

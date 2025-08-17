import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const data = await request.json();

		// Use existing Supabase client from locals
		const supabase = locals.supabase;

		// Parse payment date
		let paymentDate: Date | null = null;
		if (data.paymentDate) {
			const match = data.paymentDate.match(/(\d{4})年(\d{1,2})月/);
			if (match) {
				paymentDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1);
			}
		}

		// Prepare data for insertion
		const salarySlipData = {
			user_id: session.user.id,
			payment_date: paymentDate || new Date(),
			basic_salary: data.basicSalary || 0,
			overtime_allowance: data.overtimeAllowance || null,
			commuting_allowance: data.commutingAllowance || null,
			other_allowances: data.otherAllowances || null,
			health_insurance: data.healthInsurance || 0,
			pension_insurance: data.pensionInsurance || 0,
			employment_insurance: data.employmentInsurance || 0,
			income_tax: data.incomeTax || 0,
			resident_tax: data.residentTax || 0,
			other_deductions: data.otherDeductions || null,
			total_payment: data.totalPayment || 0,
			total_deductions: data.totalDeductions || 0,
			net_payment: data.netPayment || 0,
			pdf_file_url: data.pdfFileId ? `/api/pdf/preview/${data.pdfFileId}` : null,
			extraction_confidence: data.confidence || null,
			extraction_method: data.pdfFileId ? 'auto' : 'manual'
		};

		// Insert into database
		const { data: insertedData, error: insertError } = await supabase
			.from('salary_slips')
			.insert(salarySlipData)
			.select()
			.single();

		if (insertError) {
			console.error('Insert error:', insertError);
			return json({ success: false, error: 'Failed to save salary slip' }, { status: 500 });
		}

		return json({
			success: true,
			salaryId: insertedData.id,
			message: 'Salary slip saved successfully'
		});
	} catch (error) {
		console.error('Save error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

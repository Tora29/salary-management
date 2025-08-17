import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ExtractedSalaryData } from '$entities/salary/model/types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { fileId } = await request.json();
		console.log('Simple extract request for fileId:', fileId);

		if (!fileId) {
			return json({ success: false, error: 'File ID is required' }, { status: 400 });
		}

		// Use existing Supabase client from locals
		const supabase = locals.supabase;

		// Download file from Supabase Storage
		console.log('Downloading file from Supabase:', fileId);
		const { data: fileData, error: downloadError } = await supabase.storage
			.from('pdf-uploads')
			.download(fileId);

		if (downloadError || !fileData) {
			console.error('Download error:', downloadError);
			return json(
				{
					success: false,
					error: `Failed to download PDF file: ${downloadError?.message || 'Unknown error'}`,
					details: downloadError
				},
				{ status: 500 }
			);
		}

		console.log('File downloaded successfully, size:', fileData.size);

		// For now, return mock data to test the flow
		// This will be replaced with actual PDF parsing
		const mockExtractedData: ExtractedSalaryData = {
			basicSalary: 300000,
			overtimeAllowance: 50000,
			commutingAllowance: 10000,
			healthInsurance: 15000,
			pensionInsurance: 30000,
			employmentInsurance: 2000,
			incomeTax: 10000,
			residentTax: 15000,
			totalPayment: 360000,
			totalDeductions: 72000,
			netPayment: 288000,
			paymentDate: '2025年1月'
		};

		console.log('Returning mock data for testing');

		return json({
			success: true,
			extractedData: mockExtractedData,
			confidence: 0.8,
			message: 'Mock data returned for testing'
		});
	} catch (error) {
		console.error('Simple extraction error:', error);
		return json(
			{
				success: false,
				error: 'Extraction failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

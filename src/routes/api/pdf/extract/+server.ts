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
		console.log('Extract request for fileId:', fileId);

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
			console.error('FileId:', fileId);
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

		// Parse PDF
		try {
			const pdfParse = (await import('pdf-parse')).default;
			const buffer = await fileData.arrayBuffer();
			const uint8Array = new Uint8Array(buffer);
			const nodeBuffer = Buffer.from(uint8Array);
			console.log('Parsing PDF, buffer size:', nodeBuffer.length);
			const pdfData = await pdfParse(nodeBuffer);
			const text = pdfData.text;
			console.log('PDF text extracted, length:', text.length);

			// Extract data using patterns
			const extractedData = extractDataFromText(text);

			// Calculate confidence
			const confidence = calculateConfidence(extractedData);

			return json({
				success: true,
				extractedData,
				confidence
			});
		} catch (parseError) {
			console.error('PDF parse error:', parseError);
			return json(
				{
					success: false,
					error: 'Failed to parse PDF',
					details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('PDF extraction error:', error);
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

function extractDataFromText(text: string): ExtractedSalaryData {
	const patterns = {
		basicSalary: /基本給[：:]\s*([0-9,]+)/,
		overtimeAllowance: /残業手当[：:]\s*([0-9,]+)/,
		commutingAllowance: /通勤手当[：:]\s*([0-9,]+)/,
		healthInsurance: /健康保険[：:]\s*([0-9,]+)/,
		pensionInsurance: /厚生年金[：:]\s*([0-9,]+)/,
		employmentInsurance: /雇用保険[：:]\s*([0-9,]+)/,
		incomeTax: /所得税[：:]\s*([0-9,]+)/,
		residentTax: /住民税[：:]\s*([0-9,]+)/,
		totalPayment: /総支給額[：:]\s*([0-9,]+)/,
		totalDeductions: /控除合計[：:]\s*([0-9,]+)/,
		netPayment: /差引支給額[：:]\s*([0-9,]+)/,
		paymentDate: /支給年月[：:]\s*(\d{4}年\d{1,2}月)/
	};

	const data: Partial<ExtractedSalaryData> = {};

	for (const [key, pattern] of Object.entries(patterns)) {
		const match = text.match(pattern);
		if (match && match[1]) {
			if (key === 'paymentDate') {
				(data as any)[key] = match[1];
			} else {
				(data as any)[key] = parseAmount(match[1]);
			}
		}
	}

	// Calculate missing totals
	if (!data.totalPayment && data.basicSalary) {
		data.totalPayment =
			(data.basicSalary || 0) + (data.overtimeAllowance || 0) + (data.commutingAllowance || 0);
	}

	if (!data.totalDeductions && data.healthInsurance) {
		data.totalDeductions =
			(data.healthInsurance || 0) +
			(data.pensionInsurance || 0) +
			(data.employmentInsurance || 0) +
			(data.incomeTax || 0) +
			(data.residentTax || 0);
	}

	if (!data.netPayment && data.totalPayment && data.totalDeductions) {
		data.netPayment = data.totalPayment - data.totalDeductions;
	}

	return data as ExtractedSalaryData;
}

function parseAmount(str: string): number {
	return parseInt(str.replace(/,/g, ''), 10);
}

function calculateConfidence(data: ExtractedSalaryData): number {
	const requiredFields = ['basicSalary', 'totalPayment', 'netPayment', 'paymentDate'];

	const presentFields = requiredFields.filter(
		(field) => data[field as keyof ExtractedSalaryData] != null
	);

	return presentFields.length / requiredFields.length;
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ExtractedSalaryData } from '$entities/salary/model/types';
import { PdfReader } from 'pdfreader';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { fileId } = await request.json();
		console.log('PDFReader extract request for fileId:', fileId);

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

		// Parse PDF using pdfreader
		try {
			const buffer = await fileData.arrayBuffer();
			const uint8Array = new Uint8Array(buffer);
			const nodeBuffer = Buffer.from(uint8Array);

			// Extract text using pdfreader
			const extractedText = await extractPdfText(nodeBuffer);
			console.log('PDF text extracted, length:', extractedText.length);
			console.log('Sample text:', extractedText.substring(0, 500));

			// Extract data using patterns
			const extractedData = extractDataFromText(extractedText);

			// Calculate confidence
			const confidence = calculateConfidence(extractedData);

			console.log('Returning extracted data:', {
				success: true,
				extractedData,
				confidence
			});

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

function extractPdfText(buffer: Buffer): Promise<string> {
	return new Promise((resolve, reject) => {
		const pdfReader = new PdfReader();
		let text = '';
		let currentPage = 0;

		pdfReader.parseBuffer(buffer, (err: any, item: any) => {
			if (err) {
				reject(err);
			} else if (!item) {
				// End of file
				resolve(text);
			} else if (item.page) {
				// New page
				currentPage = item.page;
				if (currentPage > 1) {
					text += '\n\n';
				}
			} else if (item.text) {
				// Text item
				text += item.text + ' ';
			}
		});
	});
}

function extractDataFromText(text: string): ExtractedSalaryData {
	console.log('Extracting data from text (first 1000 chars):', text.substring(0, 1000));

	// 改行や空白を正規化
	const normalizedText = text.replace(/\s+/g, ' ');

	// More flexible patterns to match various formats
	// パターンをより柔軟にし、スペースや区切り文字がなくてもマッチするように
	const patterns = {
		basicSalary: /基本給[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		overtimeAllowance: /(?:残業|時間外|超過勤務)[手当]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		commutingAllowance: /(?:通勤|交通)[手当]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		healthInsurance: /健康保険[料]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		pensionInsurance: /厚生年金[保険料]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		employmentInsurance: /雇用保険[料]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		incomeTax: /所得税[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		residentTax: /住民税[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		totalPayment: /(?:総支給[額]*|支給合計|支給額計|総支給)[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		totalDeductions: /(?:控除合計|控除額計|総控除|控除計)[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		netPayment: /(?:差引支給[額]*|手取[り額]*|差引額|実支給額)[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		paymentDate:
			/(?:支給年月[日]*|支払年月[日]*|給与年月|年月)[：:＝=\s]*?(\d{4}[年\s\/\-]\d{1,2}[月\s\/\-])/
	};

	const data: Partial<ExtractedSalaryData> = {};

	// 正規化されたテキストと元のテキストの両方で試す
	for (const [key, pattern] of Object.entries(patterns)) {
		let match = normalizedText.match(pattern) || text.match(pattern);
		if (match && match[1]) {
			console.log(`Matched ${key}:`, match[1]);
			if (key === 'paymentDate') {
				// 日付フォーマットを正規化
				const dateStr = match[1].replace(/[\s\/\-]/g, '');
				(data as any)[key] = dateStr;
			} else {
				(data as any)[key] = parseAmount(match[1]);
			}
		} else {
			console.log(`No match for ${key}`);
		}
	}

	// If no data was extracted, try alternative patterns
	if (Object.keys(data).length === 0) {
		console.log('No matches found with primary patterns, trying alternatives...');

		// Try to find any number patterns
		const numberPattern = /([0-9,]+)円/g;
		const numbers = [];
		let match;
		while ((match = numberPattern.exec(text)) !== null) {
			if (match[1]) {
				numbers.push(parseAmount(match[1]));
			}
		}

		if (numbers.length > 0) {
			console.log('Found numbers:', numbers);
			// Heuristic: largest number is likely total payment
			const sortedNumbers = numbers.sort((a, b) => b - a);
			if (sortedNumbers[0] !== undefined) {
				data.totalPayment = sortedNumbers[0];
			}
			if (sortedNumbers.length > 1 && sortedNumbers[1] !== undefined) {
				data.netPayment = sortedNumbers[1];
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

	console.log('Extracted data:', data);
	return data as ExtractedSalaryData;
}

function parseAmount(str: string): number {
	// 全角数字と全角カンマも処理
	const normalized = str
		.replace(/，/g, ',') // 全角カンマを半角に
		.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)) // 全角数字を半角に
		.replace(/,/g, '') // カンマを削除
		.replace(/[^0-9]/g, ''); // 数字以外を削除
	const result = parseInt(normalized, 10) || 0;
	console.log(`Parsed amount: "${str}" -> ${result}`);
	return result;
}

function calculateConfidence(data: ExtractedSalaryData): number {
	const requiredFields = ['basicSalary', 'totalPayment', 'netPayment', 'paymentDate'];

	const presentFields = requiredFields.filter(
		(field) => data[field as keyof ExtractedSalaryData] != null
	);

	return presentFields.length / requiredFields.length;
}

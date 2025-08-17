import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PdfReader } from 'pdfreader';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { fileId } = await request.json();
		console.log('Debug extract for fileId:', fileId);

		if (!fileId) {
			return json({ success: false, error: 'File ID is required' }, { status: 400 });
		}

		const supabase = locals.supabase;

		// Download file from Supabase Storage
		const { data: fileData, error: downloadError } = await supabase.storage
			.from('pdf-uploads')
			.download(fileId);

		if (downloadError || !fileData) {
			return json(
				{
					success: false,
					error: 'Failed to download PDF file'
				},
				{ status: 500 }
			);
		}

		// Parse PDF using pdfreader
		const buffer = await fileData.arrayBuffer();
		const uint8Array = new Uint8Array(buffer);
		const nodeBuffer = Buffer.from(uint8Array);

		// Extract text using pdfreader
		const extractedText = await extractPdfText(nodeBuffer);

		// デバッグ用：最初の2000文字を返す
		return json({
			success: true,
			text: extractedText.substring(0, 2000),
			fullLength: extractedText.length,
			patterns: testPatterns(extractedText)
		});
	} catch (error) {
		console.error('Debug extraction error:', error);
		return json(
			{
				success: false,
				error: 'Debug extraction failed',
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

function testPatterns(text: string): Record<string, any> {
	const patterns = {
		basicSalary: /基本給[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		totalPayment: /(?:総支給[額]*|支給合計|支給額計|総支給)[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		commutingAllowance: /(?:通勤|交通)[手当]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		pensionInsurance: /厚生年金[保険料]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		overtimeAllowance: /(?:残業|時間外|超過勤務)[手当]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		healthInsurance: /健康保険[料]*[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/,
		netPayment: /(?:差引支給[額]*|手取[り額]*|差引額|実支給額)[：:＝=\s]*?([0-9,，０-９]+)[円\s]?/
	};

	const results: Record<string, any> = {};

	for (const [key, pattern] of Object.entries(patterns)) {
		const match = text.match(pattern);
		if (match) {
			results[key] = {
				found: true,
				value: match[1],
				fullMatch: match[0]
			};
		} else {
			results[key] = {
				found: false
			};
		}
	}

	return results;
}

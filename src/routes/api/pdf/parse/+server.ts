import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const buffer = await request.arrayBuffer();

		// Dynamic import for server-side only
		const pdfParse = (await import('pdf-parse')).default;

		// Parse PDF
		const data = await pdfParse(Buffer.from(buffer));

		return json({
			success: true,
			text: data.text,
			pages: data.numpages,
			info: data.info
		});
	} catch (error) {
		console.error('PDF parse error:', error);
		return json({ success: false, error: 'Failed to parse PDF' }, { status: 500 });
	}
};

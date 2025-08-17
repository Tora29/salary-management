import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PDFパースのテストエンドポイント
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// pdf-parseモジュールが正しくインポートできるかテスト
		try {
			const pdfParse = (await import('pdf-parse')).default;
			return json({
				success: true,
				message: 'pdf-parse module loaded successfully',
				moduleType: typeof pdfParse
			});
		} catch (moduleError) {
			console.error('Module import error:', moduleError);
			return json(
				{
					success: false,
					error: 'Failed to import pdf-parse module',
					details: moduleError instanceof Error ? moduleError.message : 'Unknown error'
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Test endpoint error:', error);
		return json(
			{
				success: false,
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

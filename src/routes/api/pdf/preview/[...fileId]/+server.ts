import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user) {
			throw error(401, 'Unauthorized');
		}

		// fileIdは文字列として渡される（[...fileId]でもSvelteKitは文字列として扱う）
		// URLデコードを適用
		const fileId = decodeURIComponent(params.fileId);
		console.log('Decoded fileId:', fileId);
		console.log('Raw params.fileId:', params.fileId);

		// Use existing Supabase client from locals
		const supabase = locals.supabase;

		// Check if user owns the file
		if (!fileId.startsWith(session.user.id)) {
			console.error('Forbidden: fileId does not start with user ID');
			console.error('FileId:', fileId);
			console.error('User ID:', session.user.id);
			throw error(403, 'Forbidden');
		}

		// Download file from Supabase Storage
		console.log('Attempting to download file:', fileId);
		const { data, error: downloadError } = await supabase.storage
			.from('pdf-uploads')
			.download(fileId);

		if (downloadError || !data) {
			console.error('Download error:', downloadError);
			console.error('FileId:', fileId);
			throw error(404, `File not found: ${downloadError?.message || 'Unknown error'}`);
		}

		console.log('File downloaded successfully, size:', data.size);

		// Return the PDF file
		const arrayBuffer = await data.arrayBuffer();
		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Cache-Control': 'private, max-age=3600'
			}
		});
	} catch (err) {
		console.error('Preview error:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Internal server error');
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('PDF upload endpoint called');
	try {
		const session = await locals.auth();
		console.log('Session:', session?.user?.id);
		if (!session?.user) {
			console.error('No session found');
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		console.log('File received:', file?.name, file?.size, file?.type);

		if (!file) {
			console.error('No file in formData');
			return json({ success: false, error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (file.type !== 'application/pdf') {
			return json(
				{ success: false, error: 'Invalid file type. Only PDF files are allowed.' },
				{ status: 400 }
			);
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			return json({ success: false, error: 'File size exceeds 10MB limit' }, { status: 400 });
		}

		// Use existing Supabase client from locals
		const supabase = locals.supabase;

		// Generate unique file name
		const fileExt = file.name.split('.').pop();
		const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

		// Upload to Supabase Storage
		console.log('Uploading to Supabase Storage:', fileName);
		const arrayBuffer = await file.arrayBuffer();
		const { error } = await supabase.storage.from('pdf-uploads').upload(fileName, arrayBuffer, {
			contentType: file.type,
			upsert: false
		});

		if (error) {
			console.error('Storage upload error:', error);
			// Return more detailed error message
			return json(
				{
					success: false,
					error: `Failed to upload file: ${error.message || 'Unknown error'}`,
					details: error
				},
				{ status: 500 }
			);
		}

		// For private bucket, we don't get a public URL
		// Instead, we'll use the fileId to fetch through our API
		console.log('Upload successful, returning fileId:', fileName);
		return json({
			success: true,
			fileId: fileName,
			previewUrl: null // Will use API endpoint for preview
		});
	} catch (error) {
		console.error('PDF upload error:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};

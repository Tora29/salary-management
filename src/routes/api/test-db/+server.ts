import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$shared/lib/prisma';

export const GET: RequestHandler = async () => {
	try {
		// データベース接続テスト
		const userCount = await prisma.user.count();
		
		return json({
			success: true,
			message: 'Database connection successful',
			userCount
		});
	} catch (error) {
		console.error('Database test error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
};
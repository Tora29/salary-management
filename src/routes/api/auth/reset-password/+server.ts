/**
 * パスワードリセットAPIエンドポイント
 * POST /api/auth/reset-password
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getServerSupabaseClient } from '$shared/lib/server-supabase';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();
		
		if (!email) {
			return json(
				{ error: 'メールアドレスが必要です' },
				{ status: 400 }
			);
		}

		const supabase = getServerSupabaseClient();
		const origin = new URL(request.url).origin;
		
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${origin}/reset-password`
		});

		if (error) {
			return json(
				{ error: 'パスワードリセットメールの送信に失敗しました' },
				{ status: 500 }
			);
		}

		return json(
			{ success: true, message: 'パスワードリセットメールを送信しました' },
			{ status: 200 }
		);
	} catch {
		return json(
			{ error: 'サーバーエラーが発生しました' },
			{ status: 500 }
		);
	}
};
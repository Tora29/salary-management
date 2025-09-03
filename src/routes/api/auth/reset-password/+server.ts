/**
 * パスワードリセットAPIエンドポイント
 * POST /api/auth/reset-password
 */

import { json } from '@sveltejs/kit';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { createSupabaseClient } from '$shared/lib/supabase';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: ERROR_MESSAGES.EMAIL_REQUIRED }, { status: 400 });
		}

		const supabase = createSupabaseClient({ isServer: true });
		const origin = new URL(request.url).origin;

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${origin}/reset-password`
		});

		if (error) {
			return json({ error: ERROR_MESSAGES.PASSWORD_RESET_EMAIL_FAILED }, { status: 500 });
		}

		return json(
			{ success: true, message: ERROR_MESSAGES.PASSWORD_RESET_EMAIL_SENT },
			{ status: 200 }
		);
	} catch {
		return json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, { status: 500 });
	}
};

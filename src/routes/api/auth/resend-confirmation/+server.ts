import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { validateEmail } from '$shared/validation/auth';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	try {
		const { email } = await request.json();

		// バリデーション
		if (!email || !validateEmail(email)) {
			return json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
		}

		// Supabaseクライアントを作成
		const supabase = createSupabaseServerClient(event);

		// メール再送信
		const { error } = await supabase.auth.resend({
			type: 'signup',
			email: email.toLowerCase().trim()
		});

		if (error) {
			console.error('Resend confirmation error:', error);
			return json(
				{ error: 'メールの送信に失敗しました。しばらく待ってから再度お試しください。' },
				{ status: 400 }
			);
		}

		return json({
			success: true,
			message: '確認メールを再送信しました。メールをご確認ください。'
		});
	} catch (error) {
		console.error('Resend confirmation error:', error);
		return json({ error: ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR }, { status: 500 });
	}
};

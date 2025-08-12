import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { validateEmail, validatePassword } from '$shared/validation/auth';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

export const POST: RequestHandler = async (event) => {
	const { request } = event;
	try {
		const { name, email, password } = await request.json();

		// バリデーション
		if (!name || !name.trim()) {
			return json({ error: '名前を入力してください' }, { status: 400 });
		}

		if (name.trim().length < 2) {
			return json({ error: '名前は2文字以上で入力してください' }, { status: 400 });
		}

		if (!email || !validateEmail(email)) {
			return json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
		}

		const passwordValidation = validatePassword(password);
		if (!passwordValidation.isValid) {
			return json({ error: passwordValidation.error }, { status: 400 });
		}

		// Supabaseクライアントを作成
		const supabase = createSupabaseServerClient(event);

		// Supabase Authでユーザー登録
		const { data, error } = await supabase.auth.signUp({
			email: email.toLowerCase().trim(),
			password,
			options: {
				data: {
					name: name.trim()
				}
			}
		});

		if (error) {
			// メールアドレスが既に登録されている場合
			if (error.message.includes('already registered')) {
				return json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
			}
			console.error('Supabase signup error:', error);
			return json(
				{ error: error.message || ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR },
				{ status: 400 }
			);
		}

		if (!data.user) {
			return json({ error: 'ユーザー登録に失敗しました' }, { status: 500 });
		}

		// Supabaseではデフォルトでメール確認が必要
		// メール確認が必要な場合（通常のケース）
		return json({
			success: true,
			message: '確認メールを送信しました。メールをご確認ください。',
			requiresConfirmation: true,
			user: {
				id: data.user.id,
				email: data.user.email,
				name: name.trim()
			}
		});
	} catch (error) {
		console.error('Signup error:', error);
		return json({ error: ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR }, { status: 500 });
	}
};

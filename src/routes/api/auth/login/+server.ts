import { json, type RequestHandler } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { loginSchema } from '$shared/validation/auth';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

export const POST: RequestHandler = async (event) => {
	try {
		const body = await event.request.json();

		// バリデーション
		const validationResult = loginSchema.safeParse(body);
		if (!validationResult.success) {
			return json(
				{
					success: false,
					message: ERROR_MESSAGES.COMMON.INVALID_FORMAT
				},
				{ status: 400 }
			);
		}

		const { email, password } = validationResult.data;
		// rememberMeフラグは将来のセッション管理で使用予定

		// Supabaseクライアントを作成
		const supabase = createSupabaseServerClient(event);

		// ログイン処理
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			console.error('Supabase auth error:', error);

			// エラーコードに応じたメッセージ
			let message: string = ERROR_MESSAGES.BUSINESS.AUTH.INVALID_CREDENTIALS;

			if (error.message?.includes('Email not confirmed')) {
				message = ERROR_MESSAGES.BUSINESS.AUTH.EMAIL_NOT_VERIFIED;
			} else if (error.status === 429) {
				message = ERROR_MESSAGES.BUSINESS.AUTH.ACCOUNT_LOCKED;
			}

			return json(
				{
					success: false,
					message
				},
				{ status: 401 }
			);
		}

		if (!data.user || !data.session) {
			return json(
				{
					success: false,
					message: ERROR_MESSAGES.BUSINESS.AUTH.INVALID_CREDENTIALS
				},
				{ status: 401 }
			);
		}

		// セッションクッキーの設定（Supabaseが自動管理）
		// rememberMeフラグは将来のセッション管理で使用予定

		// レスポンス
		return json({
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email ?? '',
				createdAt: data.user.created_at,
				profile: null // TODO: プロフィール情報の取得
			},
			session: {
				id: data.session.access_token,
				userId: data.user.id,
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresAt: data.session.expires_at ? new Date(data.session.expires_at).getTime() : 0,
				createdAt: new Date().toISOString(),
				lastActivity: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error('Login error:', error);
		return json(
			{
				success: false,
				message: ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR
			},
			{ status: 500 }
		);
	}
};

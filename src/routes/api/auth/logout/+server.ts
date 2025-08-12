import { json, type RequestHandler } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

export const POST: RequestHandler = async (event) => {
	try {
		const supabase = createSupabaseServerClient(event);

		// ログアウト処理
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error('Logout error:', error);
			return json(
				{
					success: false,
					message: ERROR_MESSAGES.COMMON.OPERATION_FAILED
				},
				{ status: 500 }
			);
		}

		// セッションクッキーをクリア
		event.cookies.delete('sb-auth-token', { path: '/' });
		event.cookies.delete('sb-refresh-token', { path: '/' });

		return json({
			success: true,
			message: 'ログアウトしました'
		});
	} catch (error) {
		console.error('Logout error:', error);
		return json(
			{
				success: false,
				message: ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR
			},
			{ status: 500 }
		);
	}
};

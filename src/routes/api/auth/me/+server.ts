import { json, type RequestHandler } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

export const GET: RequestHandler = async (event) => {
	try {
		const supabase = createSupabaseServerClient(event);

		// 現在のユーザー情報を取得
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();

		if (error || !user) {
			return json(
				{
					success: false,
					message: ERROR_MESSAGES.BUSINESS.AUTH.LOGIN_REQUIRED
				},
				{ status: 401 }
			);
		}

		// TODO: データベースからプロフィール情報を取得
		const profile = null;

		return json({
			success: true,
			user: {
				id: user.id,
				email: user.email!,
				createdAt: user.created_at,
				profile
			}
		});
	} catch (error) {
		console.error('Get user error:', error);
		return json(
			{
				success: false,
				message: ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR
			},
			{ status: 500 }
		);
	}
};

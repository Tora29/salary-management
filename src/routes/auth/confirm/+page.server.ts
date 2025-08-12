import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');

	if (token_hash && type) {
		const { data, error } = await locals.supabase.auth.verifyOtp({
			token_hash,
			type: type as 'signup' | 'recovery' | 'invite'
		});

		if (!error && data.session) {
			// メール認証成功 - セッションが確立されたのでリダイレクト
			throw redirect(303, '/dashboard?verified=true');
		}
	}

	// エラーまたは不正なパラメータの場合
	return {
		error: 'メール認証に失敗しました。リンクが無効または期限切れの可能性があります。'
	};
};

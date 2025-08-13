import type { LayoutServerLoad } from './$types';
// import { redirect } from '@sveltejs/kit';
// import { createSupabaseServerClient } from '$shared/utils/supabase';
// import { AUTH_ROUTES } from '$entities/auth/api/constants';

export const load: LayoutServerLoad = async (_event) => {
	// 一時的に認証チェックを無効化（開発時のみ）
	/*
	const supabase = createSupabaseServerClient(event);

	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw redirect(303, `${AUTH_ROUTES.LOGIN}?returnTo=${encodeURIComponent(event.url.pathname)}`);
	}

	return {
		user: {
			id: user.id,
			email: user.email ?? '',
			createdAt: user.created_at
		}
	};
	*/

	// モックユーザーデータを返す
	return {
		user: {
			id: 'mock-user-id',
			email: 'test@example.com',
			createdAt: new Date().toISOString()
		}
	};
};

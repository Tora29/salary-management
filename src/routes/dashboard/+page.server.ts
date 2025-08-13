import type { PageServerLoad } from './$types';
// import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// 一時的に認証チェックを無効化（開発時のみ）
	/*
	if (!locals.session) {
		throw redirect(303, '/login');
	}
	*/

	return {
		session: locals.session || null
	};
};

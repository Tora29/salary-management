import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// 既にログイン済みの場合はダッシュボードへリダイレクト
	if (locals.session) {
		throw redirect(303, '/dashboard');
	}

	return {};
};

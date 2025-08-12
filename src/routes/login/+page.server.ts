import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// 既にログインしている場合はダッシュボードにリダイレクト
	if (locals.session) {
		throw redirect(303, '/dashboard');
	}

	return {};
};
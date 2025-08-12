import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$shared/utils/supabase';
import { AUTH_ROUTES } from '$entities/auth/api/constants';

export const load: LayoutServerLoad = async (event) => {
	const supabase = createSupabaseServerClient(event);

	// すでにログインしている場合はダッシュボードへリダイレクト
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (user) {
		const returnTo = event.url.searchParams.get('returnTo') || AUTH_ROUTES.DASHBOARD;
		throw redirect(303, returnTo);
	}

	return {};
};

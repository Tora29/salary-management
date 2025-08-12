import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// セッション情報をページデータに渡す
	return {
		session: locals.session
	};
};
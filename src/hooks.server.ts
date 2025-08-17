import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$shared/utils/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	// Supabaseクライアントをlocalsに設定
	event.locals.supabase = createSupabaseServerClient(event);

	// セッションの取得
	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	event.locals.session = session;

	// auth関数をlocalsに追加
	event.locals.auth = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	// レスポンスを返す
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	return response;
};

import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';

export function createSupabaseBrowserClient(): SupabaseClient {
	return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			flowType: 'pkce',
			autoRefreshToken: true,
			detectSessionInUrl: true,
			persistSession: true
		}
	});
}

export function createSupabaseServerClient(event: RequestEvent): SupabaseClient {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => {
				return event.cookies.getAll();
			},
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/'
					});
				});
			}
		}
	});
}

export function getSupabaseClient(event?: RequestEvent): SupabaseClient {
	if (isBrowser() || !event) {
		return createSupabaseBrowserClient();
	}
	return createSupabaseServerClient(event);
}

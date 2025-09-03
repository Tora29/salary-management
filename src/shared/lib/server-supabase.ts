import { createClient } from '@supabase/supabase-js';

// サーバーサイド用のSupabaseクライアント
export function getServerSupabaseClient(): ReturnType<typeof createClient> {
	// .envファイルの値を直接使用
	const url = 'https://audmlwmanbwacwxgttgc.supabase.co';
	const key =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZG1sd21hbmJ3YWN3eGd0dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjgwMzMsImV4cCI6MjA3MDUwNDAzM30.5fmXccUbRQyvmeZ4GGSaM65u_pzQeanpkS2CjMCkRf0';

	return createClient(url, key, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});
}

export type SupabaseClient = ReturnType<typeof getServerSupabaseClient>;

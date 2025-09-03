import { createClient } from '@supabase/supabase-js';

// 環境変数を安全に取得する関数
function getSupabaseConfig(): { url: string; key: string; isDemo: boolean } {
	// Vite経由で環境変数を取得
	const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
	const key = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

	if (!url || !key) {
		console.error(
			'環境変数が見つかりません。.envファイルのPUBLIC_SUPABASE_URLとPUBLIC_SUPABASE_ANON_KEYを確認してください'
		);
		// .envファイルの値を直接使用（開発時用）
		return {
			url: 'https://audmlwmanbwacwxgttgc.supabase.co',
			key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZG1sd21hbmJ3YWN3eGd0dGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MjgwMzMsImV4cCI6MjA3MDUwNDAzM30.5fmXccUbRQyvmeZ4GGSaM65u_pzQeanpkS2CjMCkRf0',
			isDemo: false
		};
	}

	return {
		url,
		key,
		isDemo: false
	};
}

const config = getSupabaseConfig();

export const supabase = createClient(config.url, config.key, {
	auth: {
		persistSession: !config.isDemo,
		autoRefreshToken: !config.isDemo,
		detectSessionInUrl: !config.isDemo
	}
});

export type SupabaseClient = typeof supabase;

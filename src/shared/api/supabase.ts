import { createClient } from '@supabase/supabase-js';

// デモ用のダミー値
const DEMO_SUPABASE_URL = 'https://dummy.supabase.co';
const DEMO_SUPABASE_KEY = 'dummy-key';

// 環境変数を安全に取得する関数
function getSupabaseConfig() {
	// まずimport.meta.envから環境変数を取得
	const url = import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '';
	const key =
		import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

	if (!url || !key) {
		console.warn('Supabase環境変数が設定されていません。デモモードで動作します。');
		return {
			url: DEMO_SUPABASE_URL,
			key: DEMO_SUPABASE_KEY,
			isDemo: true
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

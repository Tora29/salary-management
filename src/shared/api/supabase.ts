/**
 * Supabase クライアントの初期化
 * アプリケーション全体で使用するSupabaseクライアントを提供
 */

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Supabase クライアント
 * 環境変数から接続情報を取得して初期化
 */
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
		flowType: 'pkce'
	}
});

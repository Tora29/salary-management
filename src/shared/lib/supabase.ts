import { createClient } from '@supabase/supabase-js';

import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Supabaseクライアントの設定オプション
 */
export interface SupabaseOptions {
	/**
	 * サーバーサイドモード（セッション永続化を無効化）
	 */
	isServer?: boolean;
}

/**
 * Supabaseクライアントを作成
 *
 * @param options - オプション設定
 * @returns Supabaseクライアント
 */
export function createSupabaseClient(options: SupabaseOptions = {}): SupabaseClientType {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
		throw new Error(
			'Supabase環境変数が設定されていません。.envファイルにPUBLIC_SUPABASE_URLとPUBLIC_SUPABASE_ANON_KEYを設定してください。'
		);
	}

	const { isServer = false } = options;

	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			persistSession: !isServer,
			autoRefreshToken: !isServer,
			detectSessionInUrl: !isServer
		}
	});
}

/**
 * クライアントサイド用Supabaseクライアント（シングルトン）
 */
export const supabase = createSupabaseClient();

/**
 * サーバーサイド用Supabaseクライアントを取得
 *
 * @deprecated createSupabaseClient({ isServer: true }) を使用してください
 * @returns Supabaseクライアント
 */
export function getServerSupabaseClient(): SupabaseClientType {
	return createSupabaseClient({ isServer: true });
}

/**
 * Supabaseクライアントの型
 */
export type SupabaseClient = SupabaseClientType;

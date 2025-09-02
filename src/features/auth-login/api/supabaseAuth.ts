import { supabase } from '$shared/api/supabase';
import type { LoginFormData, LoginResult } from '../model/loginSchema';
import type { AuthError } from '@supabase/supabase-js';

/**
 * Supabaseを使用したメール/パスワード認証
 */
export async function signInWithEmail(credentials: LoginFormData): Promise<LoginResult> {
	try {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: credentials.email,
			password: credentials.password
		});

		if (error) {
			return handleAuthError(error);
		}

		if (!data.user) {
			return {
				success: false,
				error: '認証に失敗しました'
			};
		}

		return {
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email || ''
			}
		};
	} catch (error) {
		console.error('Login error:', error);
		return {
			success: false,
			error: 'ログイン処理中にエラーが発生しました'
		};
	}
}

/**
 * 認証エラーのハンドリング
 */
function handleAuthError(error: AuthError): LoginResult {
	const errorMessages: Record<string, string> = {
		'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
		'Email not confirmed': 'メールアドレスの確認が完了していません',
		'User not found': 'ユーザーが見つかりません',
		'Too many requests': 'ログイン試行回数が多すぎます。しばらくしてから再度お試しください'
	};

	const message = errorMessages[error.message] || `認証エラー: ${error.message}`;

	return {
		success: false,
		error: message
	};
}

/**
 * 現在のセッションを取得
 */
export async function getCurrentSession() {
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return session;
}

/**
 * ログアウト
 */
export async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('Logout error:', error);
		throw new Error('ログアウトに失敗しました');
	}
}

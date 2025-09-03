import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { supabase } from '$shared/lib/supabase';

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
				error: ERROR_MESSAGES.LOGIN_FAILED
			};
		}

		return {
			success: true,
			user: {
				id: data.user.id,
				email: data.user.email || ''
			}
		};
	} catch {
		return {
			success: false,
			error: ERROR_MESSAGES.LOGIN_FAILED
		};
	}
}

/**
 * 認証エラーのハンドリング
 */
function handleAuthError(error: AuthError): LoginResult {
	const errorMessages: Record<string, string> = {
		'Invalid login credentials': ERROR_MESSAGES.INVALID_CREDENTIALS,
		'Email not confirmed': ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
		'User not found': ERROR_MESSAGES.INVALID_CREDENTIALS,
		'Too many requests': ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
	};

	const message = errorMessages[error.message] || ERROR_MESSAGES.LOGIN_FAILED;

	return {
		success: false,
		error: message
	};
}

/**
 * 現在のセッションを取得
 */
export async function getCurrentSession(): Promise<
	Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
> {
	const {
		data: { session }
	} = await supabase.auth.getSession();
	return session;
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
	const { error } = await supabase.auth.signOut();
	if (error) {
		throw new Error(ERROR_MESSAGES.LOGOUT_FAILED);
	}
}

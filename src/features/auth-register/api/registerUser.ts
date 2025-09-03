/**
 * ユーザー登録APIクライアント
 * Supabase Authとの連携を行う
 */

import type { RegisterRequest, RegisterResponse, RegisterErrorResponse } from '../model/types';
import { AUTH_ENDPOINTS } from '$shared/consts/apiEndpoints';
import { ERROR_MESSAGES } from '$shared/consts/errorMessages';

/**
 * ユーザー登録APIを呼び出す
 * @param data 登録データ
 * @returns 登録結果
 */
export async function registerUser(
	data: RegisterRequest
): Promise<RegisterResponse | RegisterErrorResponse> {
	try {
		const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		const result = await response.json();

		if (!response.ok) {
			// エラーレスポンスの処理
			return {
				error: result.error || 'Registration failed',
				code: result.code || 'SERVER_ERROR',
				details: result.details
			} as RegisterErrorResponse;
		}

		return result as RegisterResponse;
	} catch {
		// ネットワークエラーなどの処理
		return {
			error: ERROR_MESSAGES.NETWORK_ERROR,
			code: 'SERVER_ERROR'
		} as RegisterErrorResponse;
	}
}

/**
 * メールアドレスの重複チェック（将来的な実装用）
 * @param email チェックするメールアドレス
 * @returns 使用可能かどうか
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
	try {
		const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
		const result = await response.json();
		return result.available;
	} catch {
		// エラーの場合は安全側に倒す（使用不可とする）
		return false;
	}
}

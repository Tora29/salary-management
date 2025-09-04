/**
 * パスワードリセット申請API
 * Supabase Authを使用したパスワードリセットメール送信
 */

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';
import { supabase } from '$shared/lib/supabase';

import type { ForgotPasswordResult } from '../model/forgotPasswordSchema';

/**
 * パスワードリセットメールを送信する
 *
 * @param email - リセット対象のメールアドレス
 * @returns 送信結果
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/reset-password`
		});

		// レート制限エラーの場合は明示的にエラーを返す
		if (error && error.message.toLowerCase().includes('rate')) {
			return {
				success: false,
				error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
			};
		}

		// その他のエラーも成功として扱う（セキュリティ対策：メール存在確認を防ぐ）
		// ユーザーには常に成功メッセージを表示
		return {
			success: true,
			message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT
		};
	} catch (err) {
		// ネットワークエラーなど
		console.error('Password reset request error:', err);
		return {
			success: false,
			error: ERROR_MESSAGES.NETWORK_ERROR
		};
	}
}

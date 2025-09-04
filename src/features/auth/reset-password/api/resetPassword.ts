/**
 * パスワードリセット実行API
 * Supabase Authを使用したトークン検証とパスワード更新
 */

import { supabase } from '$shared/api/supabase';
import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';

import type { ResetPasswordResult } from '../model/resetPasswordSchema';

/**
 * リセットトークンを検証する
 *
 * @returns 検証結果
 */
export async function verifyResetToken(): Promise<ResetPasswordResult> {
	try {
		const { data, error } = await supabase.auth.getSession();

		if (error || !data.session) {
			return {
				success: false,
				error: ERROR_MESSAGES.TOKEN_EXPIRED || 'トークンが無効または期限切れです'
			};
		}

		// セッションが存在する場合はトークンが有効
		return {
			success: true
		};
	} catch (err) {
		console.error('Token verification error:', err);
		return {
			success: false,
			error: ERROR_MESSAGES.NETWORK_ERROR
		};
	}
}

/**
 * パスワードを更新する
 *
 * @param newPassword - 新しいパスワード
 * @returns 更新結果
 */
export async function updatePassword(newPassword: string): Promise<ResetPasswordResult> {
	try {
		// パスワード更新
		const { error } = await supabase.auth.updateUser({
			password: newPassword
		});

		if (error) {
			// トークン期限切れ
			if (
				error.message.toLowerCase().includes('expired') ||
				error.message.toLowerCase().includes('invalid')
			) {
				return {
					success: false,
					error: ERROR_MESSAGES.TOKEN_EXPIRED || 'トークンが無効または期限切れです'
				};
			}

			// その他のエラー
			return {
				success: false,
				error: error.message || ERROR_MESSAGES.PASSWORD_RESET_FAILED
			};
		}

		// 更新成功後、自動的にサインアウト（再ログインを促す）
		await supabase.auth.signOut();

		return {
			success: true,
			message: SUCCESS_MESSAGES.PASSWORD_RESET_COMPLETE
		};
	} catch (err) {
		console.error('Password update error:', err);
		return {
			success: false,
			error: ERROR_MESSAGES.NETWORK_ERROR
		};
	}
}

/**
 * パスワードリセット申請のcomposable
 * Svelte 5 Runesを使用したリアクティブな状態管理
 */

import { z } from 'zod';

import { requestPasswordReset } from '../api/forgotPassword';
import { forgotPasswordSchema } from '../model/forgotPasswordSchema';

import type { ValidationErrors } from '../model/forgotPasswordSchema';

/**
 * パスワードリセット申請のフック
 */
export function useForgotPassword(): {
	isLoading: boolean;
	isSuccess: boolean;
	error: string | null;
	validationErrors: ValidationErrors;
	sendResetEmail: (email: string) => Promise<void>;
	validateForm: (email: string) => boolean;
	clearError: () => void;
	clearSuccess: () => void;
} {
	// リアクティブな状態
	let isLoading = $state(false);
	let isSuccess = $state(false);
	let error = $state<string | null>(null);
	let validationErrors = $state<ValidationErrors>({});

	/**
	 * フォームバリデーション
	 */
	function validateForm(email: string): boolean {
		try {
			forgotPasswordSchema.parse({ email });
			validationErrors = {};
			return true;
		} catch (err) {
			if (err instanceof z.ZodError) {
				const errors: ValidationErrors = {};
				err.errors.forEach((e) => {
					if (e.path[0]) {
						errors[e.path[0] as keyof ValidationErrors] = e.message;
					}
				});
				validationErrors = errors;
			}
			return false;
		}
	}

	/**
	 * リセットメール送信
	 */
	async function sendResetEmail(email: string): Promise<void> {
		// バリデーション
		if (!validateForm(email)) {
			return;
		}

		// 状態をリセット
		isLoading = true;
		error = null;
		isSuccess = false;

		try {
			const result = await requestPasswordReset(email);

			if (result.success) {
				isSuccess = true;
			} else {
				error = result.error || '送信に失敗しました。';
			}
		} catch (err) {
			console.error('Send reset email error:', err);
			error = 'メール送信中にエラーが発生しました。';
		} finally {
			isLoading = false;
		}
	}

	/**
	 * エラーをクリア
	 */
	function clearError(): void {
		error = null;
		validationErrors = {};
	}

	/**
	 * 成功状態をクリア
	 */
	function clearSuccess(): void {
		isSuccess = false;
	}

	return {
		// 状態
		get isLoading() {
			return isLoading;
		},
		get isSuccess() {
			return isSuccess;
		},
		get error() {
			return error;
		},
		get validationErrors() {
			return validationErrors;
		},
		// メソッド
		sendResetEmail,
		validateForm,
		clearError,
		clearSuccess
	};
}

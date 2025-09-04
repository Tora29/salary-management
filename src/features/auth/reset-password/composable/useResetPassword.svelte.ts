/**
 * パスワードリセット実行のcomposable
 * Svelte 5 Runesを使用したリアクティブな状態管理
 */

import { z } from 'zod';

import { goto } from '$app/navigation';

import { ROUTE_WITH_PARAMS } from '$shared/consts/routes';
import { REGEX_PATTERNS } from '$shared/consts/validationRules';

import { updatePassword } from '../api/resetPassword';
import { resetPasswordSchema } from '../model/resetPasswordSchema';

import type { ValidationErrors, PasswordStrength } from '../model/resetPasswordSchema';

/**
 * パスワードリセットのフック
 */
export function useResetPassword(): {
	isLoading: boolean;
	error: string | null;
	validationErrors: ValidationErrors;
	passwordStrength: PasswordStrength;
	resetPassword: (password: string, confirmPassword: string) => Promise<void>;
	validateForm: (password: string, confirmPassword: string) => boolean;
	calculatePasswordStrength: (password: string) => PasswordStrength;
	updatePasswordStrength: (password: string) => void;
	clearError: () => void;
} {
	// リアクティブな状態
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let validationErrors = $state<ValidationErrors>({});
	let passwordStrength = $state<PasswordStrength>({
		score: 0,
		message: '弱い',
		color: 'gray'
	});

	/**
	 * パスワード強度を計算
	 */
	function calculatePasswordStrength(password: string): PasswordStrength {
		if (!password) {
			return {
				score: 0,
				message: '',
				color: 'gray'
			};
		}

		let score = 0;
		let message = '弱い';
		let color: 'red' | 'yellow' | 'green' | 'gray' = 'red';

		// 長さによるスコア
		if (password.length >= 8) {
			score += 1;
		}
		if (password.length >= 12) {
			score += 1;
		}
		if (password.length >= 16) {
			score += 1;
		}

		// 文字種によるスコア
		if (REGEX_PATTERNS.PASSWORD_UPPERCASE.test(password)) {
			score += 1;
		}
		if (REGEX_PATTERNS.PASSWORD_LOWERCASE.test(password)) {
			score += 1;
		}
		if (REGEX_PATTERNS.PASSWORD_NUMBER.test(password)) {
			score += 1;
		}
		if (REGEX_PATTERNS.PASSWORD_SPECIAL.test(password)) {
			score += 1;
		}

		// スコアに応じたメッセージと色
		if (score >= 6) {
			message = '非常に強い';
			color = 'green';
		} else if (score >= 5) {
			message = '強い';
			color = 'green';
		} else if (score >= 4) {
			message = '普通';
			color = 'yellow';
		} else if (score >= 3) {
			message = 'やや弱い';
			color = 'yellow';
		} else {
			message = '弱い';
			color = 'red';
		}

		return {
			score,
			message,
			color
		};
	}

	/**
	 * パスワード強度を更新
	 */
	function updatePasswordStrength(password: string): void {
		passwordStrength = calculatePasswordStrength(password);
	}

	/**
	 * フォームバリデーション
	 */
	function validateForm(password: string, confirmPassword: string): boolean {
		try {
			resetPasswordSchema.parse({ password, confirmPassword });
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
	 * パスワードリセット実行
	 */
	async function resetPassword(password: string, confirmPassword: string): Promise<void> {
		// バリデーション
		if (!validateForm(password, confirmPassword)) {
			return;
		}

		// 状態をリセット
		isLoading = true;
		error = null;

		try {
			const result = await updatePassword(password);

			if (result.success) {
				// 成功時はログイン画面へリダイレクト
				await goto(ROUTE_WITH_PARAMS.LOGIN_RESET);
			} else {
				error = result.error || 'パスワードのリセットに失敗しました。';
			}
		} catch (err) {
			console.error('Password reset error:', err);
			error = 'パスワードリセット中にエラーが発生しました。';
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

	return {
		// 状態
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get validationErrors() {
			return validationErrors;
		},
		get passwordStrength() {
			return passwordStrength;
		},
		// メソッド
		resetPassword,
		validateForm,
		calculatePasswordStrength,
		updatePasswordStrength,
		clearError
	};
}

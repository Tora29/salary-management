import { goto } from '$app/navigation';
import { z } from 'zod';
import { signInWithEmail } from '../api/supabaseAuth';
import { loginSchema } from '../model/loginSchema';
import type { LoginFormData, LoginResult, ValidationErrors } from '../model/loginSchema';

/**
 * ログイン機能のコンポーザブル
 */
export function useLogin() {
	// Svelte 5 Runesを使用したリアクティブな状態管理
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let validationErrors = $state<ValidationErrors>({});

	/**
	 * フォームのバリデーション
	 */
	function validateForm(data: LoginFormData): boolean {
		validationErrors = {};
		error = null;

		try {
			loginSchema.parse(data);
			return true;
		} catch (e) {
			if (e instanceof z.ZodError) {
				const errors: ValidationErrors = {};
				e.errors.forEach((err) => {
					const field = err.path[0] as keyof ValidationErrors;
					if (!errors[field]) {
						errors[field] = err.message;
					}
				});
				validationErrors = errors;
			}
			return false;
		}
	}

	/**
	 * ログイン実行
	 */
	async function login(email: string, password: string): Promise<LoginResult> {
		// バリデーション
		const formData: LoginFormData = { email, password };
		if (!validateForm(formData)) {
			return {
				success: false,
				error: 'フォームにエラーがあります'
			};
		}

		isLoading = true;
		error = null;

		try {
			const result = await signInWithEmail(formData);

			if (result.success) {
				// ログイン成功時はダッシュボードへリダイレクト
				await goto('/dashboard');
			} else {
				error = result.error || '認証に失敗しました';
			}

			return result;
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : '予期しないエラーが発生しました';
			error = errorMessage;
			return {
				success: false,
				error: errorMessage
			};
		} finally {
			isLoading = false;
		}
	}

	/**
	 * エラーをクリア
	 */
	function clearError() {
		error = null;
	}

	/**
	 * バリデーションエラーをクリア
	 */
	function clearValidationErrors() {
		validationErrors = {};
	}

	// getterを使用してリアクティブな値へのアクセスを提供
	return {
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get validationErrors() {
			return validationErrors;
		},
		login,
		clearError,
		clearValidationErrors,
		validateForm
	};
}

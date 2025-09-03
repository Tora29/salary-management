/**
 * ユーザー登録ロジックのコンポーザブル
 * Svelte 5 Runesを使用した状態管理
 */

import { z } from 'zod';

import { goto } from '$app/navigation';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { ROUTE_WITH_PARAMS } from '$shared/consts/routes';
import { LENGTH_LIMITS, REGEX_PATTERNS } from '$shared/consts/validationRules';

import { registerUser } from '../api/registerUser';
import { registerSchema } from '../model/registerSchema';

import type { RegisterFormData, FormErrors } from '../model/types';

/**
 * 登録フォームのコンポーザブル
 */
export function useRegister(): {
	readonly formData: RegisterFormData;
	readonly errors: FormErrors;
	readonly isSubmitting: boolean;
	readonly serverError: string | null;
	readonly isSuccess: boolean;
	readonly isValid: boolean;
	validateField: (field: keyof RegisterFormData) => void;
	handleSubmit: () => Promise<void>;
	clearErrors: () => void;
} {
	// リアクティブな状態管理
	const formData = $state<RegisterFormData>({
		email: '',
		password: '',
		confirmPassword: '',
		agreedToTerms: false
	});

	let errors = $state<FormErrors>({});
	let isSubmitting = $state(false);
	let serverError = $state<string | null>(null);
	let isSuccess = $state(false);

	// 派生状態：フォームが有効かどうか
	const isValid = $derived(
		!(!formData.email || !formData.password || !formData.confirmPassword) &&
			formData.agreedToTerms &&
			Object.keys(errors).length === 0
	);

	// パスワード一致チェック（リアクティブ）
	$effect(() => {
		if (formData.password && formData.confirmPassword) {
			if (formData.password !== formData.confirmPassword) {
				errors.confirmPassword = ERROR_MESSAGES.PASSWORD_MISMATCH;
			} else {
				// エラーをクリア
				if (errors.confirmPassword) {
					const newErrors = { ...errors };
					delete newErrors.confirmPassword;
					errors = newErrors;
				}
			}
		}
	});

	/**
	 * フィールドレベルのバリデーション
	 */
	function validateField(field: keyof RegisterFormData): void {
		try {
			// 個別フィールドのバリデーション
			switch (field) {
				case 'email':
					z.string().email(ERROR_MESSAGES.EMAIL_INVALID).parse(formData.email);
					// エラーをクリア
					if (errors.email) {
						const newErrors = { ...errors };
						delete newErrors.email;
						errors = newErrors;
					}
					break;

				case 'password':
					z.string()
						.min(LENGTH_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
						.regex(REGEX_PATTERNS.PASSWORD_UPPERCASE, ERROR_MESSAGES.PASSWORD_NO_UPPERCASE)
						.regex(REGEX_PATTERNS.PASSWORD_LOWERCASE, ERROR_MESSAGES.PASSWORD_NO_LOWERCASE)
						.regex(REGEX_PATTERNS.PASSWORD_NUMBER, ERROR_MESSAGES.PASSWORD_NO_NUMBER)
						.parse(formData.password);
					// エラーをクリア
					if (errors.password) {
						const newErrors = { ...errors };
						delete newErrors.password;
						errors = newErrors;
					}
					break;

				case 'confirmPassword':
					// パスワード一致チェックはeffectで処理
					break;

				case 'agreedToTerms':
					if (!formData.agreedToTerms) {
						errors.agreedToTerms = ERROR_MESSAGES.TERMS_REQUIRED;
					} else {
						// エラーをクリア
						if (errors.agreedToTerms) {
							const newErrors = { ...errors };
							delete newErrors.agreedToTerms;
							errors = newErrors;
						}
					}
					break;
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				errors[field] = error.errors[0]?.message || ERROR_MESSAGES.INVALID_INPUT;
			}
		}
	}

	/**
	 * フォーム送信処理
	 */
	async function handleSubmit(): Promise<void> {
		// サーバーエラーをクリア
		serverError = null;

		// 全体バリデーション
		try {
			registerSchema.parse(formData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const newErrors: FormErrors = {};
				error.errors.forEach((err) => {
					const path = err.path[0] as keyof RegisterFormData;
					if (path) {
						newErrors[path] = err.message;
					}
				});
				errors = newErrors;
				return;
			}
		}

		// 送信処理
		isSubmitting = true;

		try {
			const result = await registerUser({
				email: formData.email,
				password: formData.password,
				agreedToTerms: formData.agreedToTerms
			});

			if ('error' in result) {
				// エラーレスポンスの処理
				switch (result.code) {
					case 'EMAIL_EXISTS':
						errors.email = result.error;
						break;
					case 'PASSWORD_WEAK':
						errors.password = result.error;
						break;
					case 'VALIDATION_ERROR':
						if (result.details) {
							errors = result.details as FormErrors;
						} else {
							serverError = result.error;
						}
						break;
					default:
						serverError = result.error;
				}
			} else {
				// 成功時
				isSuccess = true;
				// ログイン画面へ遷移
				goto(ROUTE_WITH_PARAMS.LOGIN_REGISTERED);
			}
		} catch {
			serverError = ERROR_MESSAGES.RETRY;
		} finally {
			isSubmitting = false;
		}
	}

	/**
	 * エラーをクリア
	 */
	function clearErrors(): void {
		errors = {};
		serverError = null;
		isSuccess = false;
	}

	// 公開API
	return {
		get formData() {
			return formData;
		},
		get errors() {
			return errors;
		},
		get isSubmitting() {
			return isSubmitting;
		},
		get serverError() {
			return serverError;
		},
		get isSuccess() {
			return isSuccess;
		},
		get isValid() {
			return isValid;
		},
		validateField,
		handleSubmit,
		clearErrors
	};
}

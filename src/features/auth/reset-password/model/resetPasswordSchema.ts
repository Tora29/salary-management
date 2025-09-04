/**
 * パスワードリセットの型定義とバリデーションスキーマ
 * Features層：ビジネスロジックの型定義
 */

import { z } from 'zod';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { LENGTH_LIMITS, REGEX_PATTERNS } from '$shared/consts/validationRules';

import type { PasswordStrength } from '$entities/auth/model/password-reset';

/**
 * パスワードリセットのバリデーションスキーマ
 */
export const resetPasswordSchema = z
	.object({
		password: z
			.string()
			.min(LENGTH_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
			.max(LENGTH_LIMITS.PASSWORD_MAX, ERROR_MESSAGES.FIELD_TOO_LONG)
			.refine(
				(val) => REGEX_PATTERNS.PASSWORD_UPPERCASE.test(val),
				'パスワードには大文字を含めてください'
			)
			.refine(
				(val) => REGEX_PATTERNS.PASSWORD_LOWERCASE.test(val),
				'パスワードには小文字を含めてください'
			)
			.refine(
				(val) => REGEX_PATTERNS.PASSWORD_NUMBER.test(val),
				'パスワードには数字を含めてください'
			),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: ERROR_MESSAGES.PASSWORD_MISMATCH,
		path: ['confirmPassword']
	});

/**
 * フォームデータ型
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * バリデーションエラー型
 */
export type ValidationErrors = Partial<Record<keyof ResetPasswordFormData, string>>;

/**
 * API応答型
 */
export interface ResetPasswordResult {
	success: boolean;
	message?: string;
	error?: string;
}

// PasswordStrength型を再エクスポート
export type { PasswordStrength };

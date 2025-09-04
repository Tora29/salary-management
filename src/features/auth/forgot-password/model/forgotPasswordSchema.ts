/**
 * パスワードリセット申請の型定義とバリデーションスキーマ
 * Features層：ビジネスロジックの型定義
 */

import { z } from 'zod';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { LENGTH_LIMITS } from '$shared/consts/validationRules';

/**
 * パスワードリセット申請のバリデーションスキーマ
 */
export const forgotPasswordSchema = z.object({
	email: z
		.string()
		.min(LENGTH_LIMITS.EMAIL_MIN, ERROR_MESSAGES.EMAIL_REQUIRED)
		.max(LENGTH_LIMITS.EMAIL_MAX, ERROR_MESSAGES.FIELD_TOO_LONG)
		.email(ERROR_MESSAGES.EMAIL_INVALID)
});

/**
 * フォームデータ型
 */
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * バリデーションエラー型
 */
export type ValidationErrors = Partial<Record<keyof ForgotPasswordFormData, string>>;

/**
 * API応答型
 */
export interface ForgotPasswordResult {
	success: boolean;
	message?: string;
	error?: string;
}

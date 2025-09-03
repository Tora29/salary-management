import { z } from 'zod';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { LENGTH_LIMITS } from '$shared/consts/validationRules';

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
	email: z
		.string()
		.min(LENGTH_LIMITS.EMAIL_MIN, ERROR_MESSAGES.EMAIL_REQUIRED)
		.email(ERROR_MESSAGES.EMAIL_INVALID),
	password: z.string().min(LENGTH_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
});

/**
 * ログインフォームのデータ型
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * ログイン結果
 */
export interface LoginResult {
	success: boolean;
	error?: string;
	user?: {
		id: string;
		email: string;
	};
}

/**
 * バリデーションエラー
 */
export interface ValidationErrors {
	email?: string;
	password?: string;
}

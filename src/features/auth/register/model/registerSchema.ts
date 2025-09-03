/**
 * 登録フォームのバリデーションスキーマ
 */

import { z } from 'zod';

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { LENGTH_LIMITS, REGEX_PATTERNS } from '$shared/consts/validationRules';

/**
 * メールアドレスのバリデーションスキーマ
 */
export const emailSchema = z
	.string()
	.min(LENGTH_LIMITS.EMAIL_MIN, ERROR_MESSAGES.EMAIL_REQUIRED)
	.email(ERROR_MESSAGES.EMAIL_INVALID);

/**
 * パスワードのバリデーションスキーマ
 */
export const passwordSchema = z
	.string()
	.min(LENGTH_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.PASSWORD_TOO_SHORT)
	.regex(REGEX_PATTERNS.PASSWORD_UPPERCASE, ERROR_MESSAGES.PASSWORD_NO_UPPERCASE)
	.regex(REGEX_PATTERNS.PASSWORD_LOWERCASE, ERROR_MESSAGES.PASSWORD_NO_LOWERCASE)
	.regex(REGEX_PATTERNS.PASSWORD_NUMBER, ERROR_MESSAGES.PASSWORD_NO_NUMBER);

/**
 * 登録フォーム全体のバリデーションスキーマ
 */
export const registerSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: z.string().min(LENGTH_LIMITS.EMAIL_MIN, ERROR_MESSAGES.PASSWORD_REQUIRED),
		agreedToTerms: z
			.boolean()
			.refine((val) => val === true, { message: ERROR_MESSAGES.TERMS_REQUIRED })
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: ERROR_MESSAGES.PASSWORD_MISMATCH,
		path: ['confirmPassword']
	});

/**
 * サーバーサイド用のバリデーションスキーマ（確認パスワード不要）
 */
export const registerRequestSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	agreedToTerms: z.boolean().refine((val) => val === true, {
		message: ERROR_MESSAGES.TERMS_REQUIRED
	})
});

/**
 * バリデーションスキーマの型エクスポート
 */
export type RegisterSchema = z.infer<typeof registerSchema>;
/**
 * サーバーサイド用登録データの型
 */
export type RegisterRequestSchema = z.infer<typeof registerRequestSchema>;

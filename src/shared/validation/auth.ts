import { z } from 'zod';
import { ERROR_MESSAGES } from '../consts/error-messages';

export const emailSchema = z
	.string()
	.min(1, ERROR_MESSAGES.COMMON.REQUIRED_FIELD)
	.email(ERROR_MESSAGES.COMMON.INVALID_EMAIL);

export const passwordSchema = z
	.string()
	.min(1, ERROR_MESSAGES.COMMON.REQUIRED_FIELD)
	.min(8, ERROR_MESSAGES.BUSINESS.PASSWORD.MIN_LENGTH)
	.max(100, ERROR_MESSAGES.BUSINESS.PASSWORD.MAX_LENGTH);

export const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	rememberMe: z.boolean().optional().default(false)
});

export const signupSchema = z
	.object({
		email: emailSchema,
		password: passwordSchema,
		confirmPassword: passwordSchema
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'パスワードが一致しません',
		path: ['confirmPassword']
	});

export const resetPasswordSchema = z.object({
	email: emailSchema
});

export const updatePasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: passwordSchema
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'パスワードが一致しません',
		path: ['confirmPassword']
	});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

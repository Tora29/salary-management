/**
 * メールアドレスの形式を検証
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

import { ERROR_MESSAGES } from '$shared/consts/errorMessages';
import { LENGTH_LIMITS } from '$shared/consts/validationRules';

/**
 * パスワードの強度を検証
 */
export function validatePassword(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < LENGTH_LIMITS.PASSWORD_MIN) {
		errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * 必須フィールドの検証
 */
export function validateRequired(value: string): string | null {
	if (!value || value.trim() === '') {
		return ERROR_MESSAGES.REQUIRED_FIELDS;
	}
	return null;
}

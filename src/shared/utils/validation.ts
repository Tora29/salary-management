/**
 * メールアドレスの形式を検証
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * パスワードの強度を検証
 */
export function validatePassword(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < 6) {
		errors.push('パスワードは6文字以上である必要があります');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * 必須フィールドの検証
 */
export function validateRequired(value: string, fieldName: string): string | null {
	if (!value || value.trim() === '') {
		return `${fieldName}は必須項目です`;
	}
	return null;
}

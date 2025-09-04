/**
 * パスワードリセット関連の型定義
 * Entities層：UIコンポーネントのProps型を定義
 */

/**
 * パスワード強度の型定義
 */
export interface PasswordStrength {
	score: number; // 0-7
	message: string;
	color: 'red' | 'yellow' | 'green' | 'gray';
}

/**
 * ForgotPasswordCardコンポーネントのProps型
 */
export interface ForgotPasswordCardProps {
	email?: string;
	emailError?: string;
	onSubmit: () => void;
	loading?: boolean;
}

/**
 * ResetPasswordCardコンポーネントのProps型
 */
export interface ResetPasswordCardProps {
	password?: string;
	confirmPassword?: string;
	passwordError?: string;
	confirmPasswordError?: string;
	passwordStrength?: PasswordStrength;
	onPasswordChange: (password: string) => void;
	onSubmit: () => void;
	loading?: boolean;
}

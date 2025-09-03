/**
 * 新規登録カードコンポーネントのプロパティ
 */
export interface RegistrationCardProps {
	email: string;
	password: string;
	confirmPassword: string;
	agreedToTerms: boolean;
	emailError?: string | undefined;
	passwordError?: string | undefined;
	confirmPasswordError?: string | undefined;
	agreedToTermsError?: string | undefined;
	onSubmit: () => void;
	onEmailBlur?: () => void;
	onPasswordBlur?: () => void;
	onConfirmPasswordBlur?: () => void;
	loading?: boolean;
}

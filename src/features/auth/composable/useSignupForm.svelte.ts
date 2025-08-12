import { validateEmail, validatePassword } from '$shared/validation/auth';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';
import { signup } from '../api/auth-client';

interface SignupFormData {
	name: string;
	email: string;
	password: string;
	passwordConfirm: string;
	agreeTerms: boolean;
}

interface SignupFormErrors {
	name: string;
	email: string;
	password: string;
	passwordConfirm: string;
	agreeTerms: string;
}

export function useSignupForm(): {
	get formData(): SignupFormData;
	get errors(): SignupFormErrors;
	get isSubmitting(): boolean;
	get authError(): string | null;
	validateField: (field: keyof SignupFormData) => void;
	submit: () => Promise<void>;
	clearError: () => void;
} {
	const formData = $state<SignupFormData>({
		name: '',
		email: '',
		password: '',
		passwordConfirm: '',
		agreeTerms: false
	});

	const errors = $state<SignupFormErrors>({
		name: '',
		email: '',
		password: '',
		passwordConfirm: '',
		agreeTerms: ''
	});

	let isSubmitting = $state(false);
	let authError = $state<string | null>(null);

	function validateField(field: keyof SignupFormData): void {
		authError = null;

		switch (field) {
			case 'name':
				if (!formData.name.trim()) {
					errors.name = '名前を入力してください';
				} else if (formData.name.trim().length < 2) {
					errors.name = '名前は2文字以上で入力してください';
				} else {
					errors.name = '';
				}
				break;

			case 'email':
				if (!formData.email) {
					errors.email = 'メールアドレスを入力してください';
				} else if (!validateEmail(formData.email)) {
					errors.email = '有効なメールアドレスを入力してください';
				} else {
					errors.email = '';
				}
				break;

			case 'password': {
				const passwordValidation = validatePassword(formData.password);
				if (!passwordValidation.isValid) {
					errors.password = passwordValidation.error || '';
				} else {
					errors.password = '';
				}
				// パスワード確認も再検証
				if (formData.passwordConfirm) {
					validateField('passwordConfirm');
				}
				break;
			}

			case 'passwordConfirm':
				if (!formData.passwordConfirm) {
					errors.passwordConfirm = 'パスワード（確認）を入力してください';
				} else if (formData.password !== formData.passwordConfirm) {
					errors.passwordConfirm = 'パスワードが一致しません';
				} else {
					errors.passwordConfirm = '';
				}
				break;

			case 'agreeTerms':
				if (!formData.agreeTerms) {
					errors.agreeTerms = '利用規約に同意してください';
				} else {
					errors.agreeTerms = '';
				}
				break;
		}
	}

	function validateAllFields(): boolean {
		validateField('name');
		validateField('email');
		validateField('password');
		validateField('passwordConfirm');
		validateField('agreeTerms');

		return !Object.values(errors).some((error) => error !== '');
	}

	async function submit(): Promise<void> {
		if (!validateAllFields()) {
			return;
		}

		isSubmitting = true;
		authError = null;

		try {
			const response = await signup({
				name: formData.name.trim(),
				email: formData.email.toLowerCase().trim(),
				password: formData.password
			});

			if (!response.success) {
				authError = response.error || ERROR_MESSAGES.API.INTERNAL_SERVER_ERROR;
				return;
			}

			// メール確認が必要な場合
			if (response.requiresConfirmation) {
				window.location.href = '/login?confirmation=true';
				return;
			}

			// 登録成功後、自動的にログイン画面へリダイレクト
			window.location.href = '/login?registered=true';
		} catch (error) {
			console.error('Signup error:', error);
			authError = ERROR_MESSAGES.API.NETWORK_ERROR;
		} finally {
			isSubmitting = false;
		}
	}

	function clearError(): void {
		authError = null;
	}

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
		get authError() {
			return authError;
		},
		validateField,
		submit,
		clearError
	};
}

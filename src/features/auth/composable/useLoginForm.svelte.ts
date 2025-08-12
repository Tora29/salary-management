import { loginSchema } from '$shared/validation/auth';
import type { LoginFormData } from '../model/types';
import { useAuth } from './useAuth.svelte';
import { z } from 'zod';

export function useLoginForm(): {
	get formData(): LoginFormData;
	get errors(): Partial<Record<keyof LoginFormData, string>>;
	get isSubmitting(): boolean;
	get authError(): string | null;
	validateField: (field: keyof LoginFormData) => boolean;
	validateForm: () => boolean;
	submit: () => Promise<boolean>;
	reset: () => void;
} {
	const auth = useAuth();

	let formData = $state<LoginFormData>({
		email: '',
		password: '',
		rememberMe: false
	});

	let errors = $state<Partial<Record<keyof LoginFormData, string>>>({});
	let isSubmitting = $state(false);

	function validateField(field: keyof LoginFormData): boolean {
		try {
			const fieldSchema = loginSchema.shape[field];
			if (fieldSchema) {
				fieldSchema.parse(formData[field]);
				delete errors[field];
				return true;
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				errors[field] = error.errors?.[0]?.message || 'バリデーションエラー';
			} else {
				errors[field] = 'バリデーションエラー';
			}
			return false;
		}
		return true;
	}

	function validateForm(): boolean {
		try {
			loginSchema.parse(formData);
			errors = {};
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				error.errors.forEach((err) => {
					const field = err.path[0] as keyof LoginFormData;
					errors[field] = err.message;
				});
			}
			return false;
		}
	}

	async function submit(): Promise<boolean> {
		if (!validateForm()) {
			return false;
		}

		isSubmitting = true;
		try {
			const success = await auth.login(formData);
			if (success) {
				// リセット
				formData = {
					email: '',
					password: '',
					rememberMe: false
				};
				errors = {};
			}
			return success;
		} finally {
			isSubmitting = false;
		}
	}

	function reset(): void {
		formData = {
			email: '',
			password: '',
			rememberMe: false
		};
		errors = {};
		auth.clearError();
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
			return auth.error;
		},
		validateField,
		validateForm,
		submit,
		reset
	};
}

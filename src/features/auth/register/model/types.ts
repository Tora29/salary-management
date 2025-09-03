/**
 * ユーザー登録機能の型定義
 * このファイルは型定義のみを含みます（FSDルール準拠）
 */

/**
 * 登録フォームのデータ型
 */
export interface RegisterFormData {
	email: string;
	password: string;
	confirmPassword: string;
	agreedToTerms: boolean;
}

/**
 * 登録APIリクエスト型
 */
export interface RegisterRequest {
	email: string;
	password: string;
	agreedToTerms: boolean;
}

/**
 * 登録APIレスポンス型（成功時）
 */
export interface RegisterResponse {
	success: boolean;
	message: string;
	userId: string;
}

/**
 * 登録APIエラーレスポンス型
 */
export interface RegisterErrorResponse {
	error: string;
	code: 'VALIDATION_ERROR' | 'EMAIL_EXISTS' | 'PASSWORD_WEAK' | 'SERVER_ERROR';
	details?: Record<string, string>;
}

/**
 * フォームエラー型
 */
export type FormErrors = Partial<Record<keyof RegisterFormData, string>>;

/**
 * 登録状態型
 */
export interface RegisterState {
	formData: RegisterFormData;
	errors: FormErrors;
	isSubmitting: boolean;
	serverError: string | null;
}

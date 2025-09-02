import { z } from 'zod';

/**
 * ログインフォームのバリデーションスキーマ
 */
export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'メールアドレスは必須です')
		.email('有効なメールアドレスを入力してください'),
	password: z
		.string()
		.min(1, 'パスワードは必須です')
		.min(6, 'パスワードは6文字以上である必要があります')
});

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

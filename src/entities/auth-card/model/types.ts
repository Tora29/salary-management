/**
 * ユーザー認証情報
 */
export interface UserCredentials {
	email: string;
	password: string;
}

/**
 * ユーザー情報
 */
export interface User {
	id: string;
	email: string;
	created_at: string;
	updated_at?: string;
}

/**
 * ユーザーセッション
 */
export interface UserSession {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: User;
}

/**
 * 認証エラー
 */
export interface AuthError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

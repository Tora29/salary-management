// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AdapterUser } from '@auth/core/adapters';
import type { DefaultSession } from '@auth/core/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/**
			 * ユーザーセッション情報
			 * Auth.jsによって自動的に設定される
			 */
			session: {
				user: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
					stats?: {
						salarySlipCount: number;
						stockCount: number;
						assetCount: number;
					};
				};
				expires: string;
			} | null;

			/**
			 * 認証済みユーザー情報（簡易アクセス用）
			 */
			user: {
				id: string;
				name?: string | null;
				email?: string | null;
				image?: string | null;
				stats?: {
					salarySlipCount: number;
					stockCount: number;
					assetCount: number;
				};
			} | null;

			/**
			 * セッション取得関数（Auth.js提供）
			 */
			getSession?: () => Promise<{
				user: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
					stats?: {
						salarySlipCount: number;
						stockCount: number;
						assetCount: number;
					};
				};
				expires: string;
			} | null>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Auth.jsの型を拡張してプロジェクト固有の情報を追加
declare module '@auth/core/types' {
	/**
	 * セッション情報の型拡張
	 */
	interface Session extends DefaultSession {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			stats?: {
				salarySlipCount: number;
				stockCount: number;
				assetCount: number;
			};
		};
	}

	/**
	 * ユーザー情報の型拡張
	 */
	interface User extends AdapterUser {
		id: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		emailVerified?: Date | null;
		stats?: {
			salarySlipCount: number;
			stockCount: number;
			assetCount: number;
		};
	}
}

// JWT型の拡張
declare module '@auth/core/jwt' {
	interface JWT {
		uid?: string;
	}
}

export {};

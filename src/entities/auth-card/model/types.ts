/**
 * 認証カード関連の型定義
 * このファイルは型定義のみを含みます（FSDルール準拠）
 */

import type { Snippet } from 'svelte';

/**
 * 認証カードの基本プロパティ
 */
export interface AuthCardProps {
	title: string;
	children: Snippet;
	footer?: Snippet;
	class?: string;
}

/**
 * 登録カードのプロパティ
 */
export interface RegistrationCardProps extends AuthCardProps {
	submitButtonText?: string;
	isSubmitting?: boolean;
}

import type { HTMLInputAttributes } from 'svelte/elements';

export interface InputProps extends HTMLInputAttributes {
	/** エラーメッセージ */
	error?: string | undefined;
	/** 入力値 */
	value?: string | number;
	/** 無効状態 */
	disabled?: boolean;
}

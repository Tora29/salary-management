import type { HTMLInputAttributes } from 'svelte/elements';

export interface InputProps extends Omit<HTMLInputAttributes, 'value' | 'disabled'> {
	/** エラーメッセージ */
	error?: string | undefined;
	/** 入力値 */
	value?: string | number | undefined;
	/** 無効状態 */
	disabled?: boolean | null | undefined;
}

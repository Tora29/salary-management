import type { HTMLButtonAttributes } from 'svelte/elements';

export interface ButtonProps extends HTMLButtonAttributes {
	/** ボタンのバリアント */
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
	/** ボタンのサイズ */
	size?: 'sm' | 'md' | 'lg';
	/** 無効状態 */
	disabled?: boolean;
	/** 子要素 */
	children?: import('svelte').Snippet;
}

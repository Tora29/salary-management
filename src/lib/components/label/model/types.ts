import type { HTMLLabelAttributes } from 'svelte/elements';

export interface LabelProps extends HTMLLabelAttributes {
	/** 必須項目の表示 */
	required?: boolean;
	/** 子要素 */
	children?: import('svelte').Snippet;
}

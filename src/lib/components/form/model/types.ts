import type { HTMLFormAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

/**
 * Formコンポーネントのプロパティ定義
 * @interface FormProps
 * @description フォーム全体を管理する汎用コンポーネント
 */
export interface FormProps extends HTMLFormAttributes {
	/** フォーム送信時のコールバック */
	onSubmit?: (event: Event) => void;
	/** 子要素 */
	children?: Snippet;
	/** レイアウトのギャップサイズ */
	gap?: 'sm' | 'md' | 'lg';
}

import type { Snippet } from 'svelte';

/**
 * FormGridコンポーネントのプロパティ定義
 * @interface FormGridProps
 * @description フォーム内のフィールドをグリッドレイアウトで配置する
 */
export interface FormGridProps {
	/** グリッドの列数（デスクトップ） */
	cols?: 1 | 2 | 3 | 4;
	/** グリッドのギャップサイズ */
	gap?: 'sm' | 'md' | 'lg';
	/** 子要素 */
	children?: Snippet;
	/** 追加のクラス名 */
	class?: string;
}

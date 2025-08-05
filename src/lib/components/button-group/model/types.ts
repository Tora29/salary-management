import type { Snippet } from 'svelte';

/**
 * ButtonGroupコンポーネントのプロパティ定義
 * @interface ButtonGroupProps
 * @description 複数のボタンをグループ化してレイアウトを管理する
 */
export interface ButtonGroupProps {
	/** ボタンの配置位置 */
	align?: 'start' | 'center' | 'end' | 'between';
	/** ボタン間のギャップサイズ */
	gap?: 'sm' | 'md' | 'lg';
	/** 子要素 */
	children?: Snippet;
	/** 追加のクラス名 */
	class?: string;
}

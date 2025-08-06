import type { Snippet } from 'svelte';

/**
 * FormFieldコンポーネントのプロパティ定義
 * @interface FormFieldProps
 * @description フォームフィールドをラップし、ラベル・入力欄・エラーメッセージを統合管理する
 */
export interface FormFieldProps {
	/** フィールドのラベル */
	label: string;
	/** 必須項目の表示 */
	required?: boolean;
	/** エラーメッセージ */
	error?: string | undefined;
	/** フィールドのID（アクセシビリティ用） */
	id: string;
	/** フィールドの値 */
	value?: string | number;
	/** 入力タイプ */
	type?: string;
	/** プレースホルダー */
	placeholder?: string;
	/** 無効化フラグ */
	disabled?: boolean | null | undefined;
	/** 最小値 */
	min?: string | number;
	/** 最大値 */
	max?: string | number;
	/** ステップ値 */
	step?: string | number;
	/** 入力イベントハンドラー */
	oninput?: (event: Event) => void;
	/** ブラーイベントハンドラー */
	onblur?: (event: Event) => void;
	/** カスタム入力コンポーネント（指定しない場合はデフォルトのInputを使用） */
	children?: Snippet;
}

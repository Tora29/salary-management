import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

/**
 * FormFieldコンポーネントのプロパティ定義
 * @interface FormFieldProps
 * @description フォームフィールドをラップし、ラベル・入力欄・エラーメッセージを統合管理する
 */
export interface FormFieldProps extends HTMLInputAttributes {
	/** フィールドのラベル */
	label: string;
	/** 必須項目の表示 */
	required?: boolean;
	/** エラーメッセージ */
	error?: string | undefined;
	/** フィールドのID（アクセシビリティ用） */
	id: string;
	/** カスタム入力コンポーネント（指定しない場合はデフォルトのInputを使用） */
	children?: Snippet;
}

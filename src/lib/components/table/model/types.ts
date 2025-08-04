/**
 * テーブルの列定義を表すインターフェース
 * @template T - テーブルデータの型
 * @example
 * ```typescript
 * const columns: Column<User>[] = [
 *   { key: 'name', label: '名前' },
 *   { key: 'email', label: 'メールアドレス' }
 * ];
 * ```
 */
export interface Column<T = any> {
	/** データオブジェクトのプロパティキー */
	key: keyof T;
	/** テーブルヘッダーに表示される列名 */
	label: string;
}

/**
 * Tableコンポーネントのプロパティ定義
 * @template T - テーブルに表示するデータの型
 */
export interface TableProps<T> {
	/** テーブルの列定義配列 */
	columns: Column<T>[];
	/** 表示するデータの配列 */
	data: T[];
	/** データが空の場合に表示するメッセージ（デフォルト: 'データがありません'） */
	emptyMessage?: string;
}

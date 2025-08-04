export const COMPONENT_ERROR_MSG = {
	// フォーム関連
	REQUIRED_FIELD: '必須項目です。',
	MIN_LENGTH: (min: number) => `${min}文字以上で入力してください。`,
	MAX_LENGTH: (max: number) => `${max}文字以内で入力してください。`,
	INVALID_FORMAT: '形式が正しくありません。',
	INVALID_VALUE: '値が正しくありません。',

	// 数値入力関連
	NUMBER_REQUIRED: '数値を入力してください。',
	MIN_VALUE: (min: number) => `${min}以上の値を入力してください。`,
	MAX_VALUE: (max: number) => `${max}以下の値を入力してください。`,
	POSITIVE_NUMBER_REQUIRED: '正の数を入力してください。',
	INTEGER_REQUIRED: '整数を入力してください。',

	// 日付関連
	INVALID_DATE: '日付が正しくありません。',
	DATE_REQUIRED: '日付を選択してください。',
	FUTURE_DATE_NOT_ALLOWED: '未来の日付は選択できません。',
	PAST_DATE_NOT_ALLOWED: '過去の日付は選択できません。',
	DATE_RANGE_INVALID: '開始日は終了日より前である必要があります。',

	// ファイル関連
	FILE_REQUIRED: 'ファイルを選択してください。',
	FILE_SIZE_TOO_LARGE: (maxSize: string) => `ファイルサイズは${maxSize}以下にしてください。`,
	INVALID_FILE_TYPE: (allowedTypes: string[]) =>
		`ファイル形式は${allowedTypes.join(', ')}のみ許可されています。`,
	FILE_UPLOAD_ERROR: 'ファイルのアップロード中にエラーが発生しました。',

	// 選択系コンポーネント
	SELECTION_REQUIRED: '選択してください。',
	INVALID_SELECTION: '無効な選択です。',

	// パスワード関連
	PASSWORD_MISMATCH: 'パスワードが一致しません。',
	PASSWORD_TOO_SHORT: (min: number) => `パスワードは${min}文字以上で設定してください。`,
	PASSWORD_COMPLEXITY: '大文字、小文字、数字、記号を含めてください。',

	// メールアドレス関連
	INVALID_EMAIL_FORMAT: 'メールアドレスの形式が正しくありません。',
	EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に使用されています。',

	// 電話番号関連
	INVALID_PHONE_FORMAT: '電話番号の形式が正しくありません。',

	// URL関連
	INVALID_URL_FORMAT: 'URLの形式が正しくありません。',

	// 検索・フィルタ関連
	NO_RESULTS_FOUND: '検索結果が見つかりませんでした。',
	SEARCH_ERROR: '検索中にエラーが発生しました。',

	// データグリッド・テーブル関連
	NO_DATA_AVAILABLE: 'データがありません。',
	LOADING_ERROR: '読み込み中にエラーが発生しました。',

	// ページネーション関連
	INVALID_PAGE_NUMBER: '無効なページ番号です。',

	// アクセシビリティ関連
	FIELD_ERROR: (fieldName: string) => `${fieldName}にエラーがあります。`,

	// 汎用メッセージ
	OPERATION_FAILED: '操作に失敗しました。',
	RETRY_LATER: 'しばらくしてから再度お試しください。',
	CONTACT_SUPPORT: 'サポートにお問い合わせください。'
} as const;

export type ComponentErrorKey = keyof typeof COMPONENT_ERROR_MSG;

// 動的メッセージ生成用のヘルパー関数の型
export type DynamicErrorMessage<T extends unknown[] = unknown[]> = (...args: T) => string;

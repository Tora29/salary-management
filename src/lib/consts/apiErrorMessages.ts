export const API_ERROR_MSG = {
	// 共通エラー
	NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
	TIMEOUT: 'タイムアウトしました。しばらくしてから再度お試しください。',
	UNEXPECTED_ERROR: '予期しないエラーが発生しました。',
	SERVER_ERROR: 'サーバーエラーが発生しました。しばらくしてから再度お試しください。',

	// HTTPステータスコード関連
	BAD_REQUEST: 'リクエストが正しくありません。',
	UNAUTHORIZED: '認証が必要です。ログインしてください。',
	FORBIDDEN: 'アクセス権限がありません。',
	NOT_FOUND: 'リソースが見つかりません。',
	METHOD_NOT_ALLOWED: '許可されていないメソッドです。',
	CONFLICT: 'リクエストが競合しています。',
	UNPROCESSABLE_ENTITY: '入力内容に誤りがあります。',
	TOO_MANY_REQUESTS: 'リクエストが多すぎます。しばらくしてから再度お試しください。',

	// データ関連
	INVALID_DATA_FORMAT: 'データの形式が正しくありません。',
	MISSING_REQUIRED_FIELD: '必須項目が入力されていません。',
	DATA_NOT_FOUND: 'データが見つかりません。',
	DUPLICATE_DATA: '既に同じデータが存在します。',

	// ファイルアップロード関連
	FILE_SIZE_EXCEEDED: 'ファイルサイズが上限を超えています。',
	INVALID_FILE_TYPE: 'サポートされていないファイル形式です。',
	FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました。',

	// 認証・認可関連
	SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください。',
	INVALID_CREDENTIALS: 'ユーザー名またはパスワードが正しくありません。',
	ACCOUNT_LOCKED: 'アカウントがロックされています。管理者にお問い合わせください。',
	EMAIL_NOT_VERIFIED: 'メールアドレスの確認が完了していません。',

	// CRUD操作関連
	CREATE_FAILED: 'データの作成に失敗しました。',
	UPDATE_FAILED: 'データの更新に失敗しました。',
	DELETE_FAILED: 'データの削除に失敗しました。',
	FETCH_FAILED: 'データの取得に失敗しました。',

	// バリデーション関連
	VALIDATION_ERROR: '入力内容にエラーがあります。',
	INVALID_EMAIL: 'メールアドレスの形式が正しくありません。',
	INVALID_PASSWORD: 'パスワードの形式が正しくありません。',
	PASSWORD_TOO_WEAK: 'パスワードが弱すぎます。より強力なパスワードを設定してください。',

	// エクスポート関連
	EXPORT_FAILED: 'データのエクスポートに失敗しました。',
	EXPORT_FORMAT_NOT_SUPPORTED: 'サポートされていないエクスポート形式です。'
} as const;

export type ApiErrorKey = keyof typeof API_ERROR_MSG;

/**
 * エラーメッセージ定数定義
 * アプリケーション全体で使用するエラーメッセージを一元管理
 */

export const ERROR_MESSAGES = {
	// 汎用
	UNKNOWN: '予期しないエラーが発生しました',
	RETRY: 'エラーが発生しました。もう一度お試しください',
	CONTACT_SUPPORT: 'エラーが発生しました。サポートにお問い合わせください',

	// ネットワーク・API
	NETWORK_ERROR: 'ネットワークエラーが発生しました',
	TIMEOUT: 'リクエストがタイムアウトしました',
	CONNECTION_FAILED: '接続に失敗しました',
	BAD_REQUEST: 'リクエストが不正です',
	UNAUTHORIZED: '認証が必要です',
	FORBIDDEN: 'アクセスが拒否されました',
	NOT_FOUND: 'リソースが見つかりません',
	CONFLICT: 'データの競合が発生しました',
	INTERNAL_SERVER_ERROR: 'サーバーエラーが発生しました',
	SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',

	// 認証・ログイン
	LOGIN_FAILED: '認証に失敗しました',
	LOGOUT_FAILED: 'ログアウトに失敗しました',
	INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
	TOKEN_EXPIRED: 'セッションの有効期限が切れました',
	EMAIL_NOT_VERIFIED: 'メールアドレスが確認されていません',
	ACCOUNT_LOCKED: 'アカウントがロックされています',
	PASSWORD_RESET_FAILED: 'パスワードのリセットに失敗しました',
	SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',

	// 登録
	EMAIL_EXISTS: 'このメールアドレスは既に登録されています',
	REGISTRATION_FAILED: '登録に失敗しました',
	VERIFICATION_FAILED: 'メール確認に失敗しました',

	// フォーム・バリデーション
	FORM_HAS_ERRORS: 'フォームにエラーがあります',
	INVALID_INPUT: '入力内容が正しくありません',
	REQUIRED_FIELDS: '必須項目を入力してください',
	SUBMIT_FAILED: '送信に失敗しました',

	// メールアドレス
	EMAIL_REQUIRED: 'メールアドレスを入力してください',
	EMAIL_INVALID: '有効なメールアドレスを入力してください',
	EMAIL_TOO_LONG: 'メールアドレスが長すぎます',

	// パスワード
	PASSWORD_REQUIRED: 'パスワードを入力してください',
	PASSWORD_TOO_SHORT: 'パスワードは8文字以上必要です',
	PASSWORD_TOO_LONG: 'パスワードは128文字以内で入力してください',
	PASSWORD_TOO_WEAK: 'パスワードが弱すぎます',
	PASSWORD_NO_UPPERCASE: '大文字を1文字以上含めてください',
	PASSWORD_NO_LOWERCASE: '小文字を1文字以上含めてください',
	PASSWORD_NO_NUMBER: '数字を1文字以上含めてください',
	PASSWORD_NO_SPECIAL: '特殊文字を1文字以上含めてください',
	PASSWORD_MISMATCH: 'パスワードが一致しません',
	PASSWORD_SAME_AS_OLD: '新しいパスワードは現在のパスワードと異なるものにしてください',
	PASSWORD_RESET_EMAIL_SENT: 'パスワードリセットメールを送信しました',
	PASSWORD_RESET_EMAIL_FAILED: 'パスワードリセットメールの送信に失敗しました',

	// 名前
	NAME_REQUIRED: '名前を入力してください',
	NAME_TOO_SHORT: '名前は2文字以上必要です',
	NAME_TOO_LONG: '名前は50文字以内で入力してください',
	NAME_INVALID_CHARS: '使用できない文字が含まれています',

	// 電話番号
	PHONE_REQUIRED: '電話番号を入力してください',
	PHONE_INVALID: '有効な電話番号を入力してください',

	// 日付
	DATE_REQUIRED: '日付を選択してください',
	DATE_INVALID: '有効な日付を入力してください',
	DATE_PAST: '過去の日付は選択できません',
	DATE_FUTURE: '未来の日付は選択できません',
	DATE_RANGE_INVALID: '日付の範囲が正しくありません',

	// 数値
	NUMBER_REQUIRED: '数値を入力してください',
	NUMBER_INVALID: '有効な数値を入力してください',
	NUMBER_TOO_SMALL: '値が小さすぎます',
	NUMBER_TOO_LARGE: '値が大きすぎます',
	NUMBER_NEGATIVE: '負の値は入力できません',

	// ファイル
	FILE_REQUIRED: 'ファイルを選択してください',
	FILE_TOO_LARGE: 'ファイルサイズが大きすぎます',
	FILE_INVALID_TYPE: 'このファイル形式はサポートされていません',
	FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',

	// 利用規約
	TERMS_REQUIRED: '利用規約に同意してください',
	PRIVACY_REQUIRED: 'プライバシーポリシーに同意してください',

	// データ操作
	DATA_LOAD_FAILED: 'データの読み込みに失敗しました',
	DATA_SAVE_FAILED: 'データの保存に失敗しました',
	DATA_DELETE_FAILED: 'データの削除に失敗しました',
	DATA_UPDATE_FAILED: 'データの更新に失敗しました',
	DATA_NOT_FOUND: 'データが見つかりません',
	DATA_INVALID_FORMAT: 'データ形式が正しくありません',

	// 権限・アクセス制御
	PERMISSION_DENIED: 'この操作を実行する権限がありません',
	ACCOUNT_SUSPENDED: 'アカウントが停止されています',
	FEATURE_DISABLED: 'この機能は現在利用できません',
	OPERATION_NOT_ALLOWED: 'この操作は許可されていません',
	RATE_LIMIT_EXCEEDED: 'リクエスト回数が多すぎます。しばらくしてから再度お試しください',

	// 給与管理
	SALARY_INVALID_AMOUNT: '給与額が正しくありません',
	SALARY_INVALID_DATE: '給与日が正しくありません',
	SALARY_DUPLICATE_ENTRY: 'この月の給与は既に登録されています',
	SALARY_PDF_PARSE_FAILED: '給与明細PDFの解析に失敗しました',
	SALARY_PDF_FORMAT_UNSUPPORTED: 'このPDF形式はサポートされていません',
	SALARY_CALCULATION_ERROR: '計算エラーが発生しました',

	// 株式ポートフォリオ
	PORTFOLIO_SYMBOL_NOT_FOUND: '銘柄コードが見つかりません',
	PORTFOLIO_INVALID_QUANTITY: '株数が正しくありません',
	PORTFOLIO_INVALID_PRICE: '価格が正しくありません',
	PORTFOLIO_MARKET_DATA_UNAVAILABLE: '市場データを取得できません',
	PORTFOLIO_TRADE_FAILED: '取引の記録に失敗しました',
	PORTFOLIO_INSUFFICIENT_SHARES: '売却株数が保有株数を超えています'
} as const;

/**
 * エラーコード定義（APIレスポンス用）
 */
export const ERROR_CODES = {
	// 認証関連
	AUTH_FAILED: 'AUTH_FAILED',
	EMAIL_EXISTS: 'EMAIL_EXISTS',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
	TOKEN_EXPIRED: 'TOKEN_EXPIRED',

	// バリデーション関連
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	INVALID_INPUT: 'INVALID_INPUT',
	REQUIRED_FIELD: 'REQUIRED_FIELD',
	PASSWORD_WEAK: 'PASSWORD_WEAK',

	// システム関連
	INTERNAL_ERROR: 'INTERNAL_ERROR',
	SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

	// データ関連
	NOT_FOUND: 'NOT_FOUND',
	DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
	DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR'
} as const;

// 型定義
/**
 * エラーメッセージの型
 */
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
/**
 * エラーコードの型
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

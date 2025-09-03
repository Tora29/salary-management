/**
 * バリデーションルール定数定義
 * アプリケーション全体で使用するバリデーションルールを一元管理
 */

/**
 * 文字数制限
 */
export const LENGTH_LIMITS = {
	// メールアドレス
	EMAIL_MIN: 1,
	EMAIL_MAX: 255,

	// パスワード
	PASSWORD_MIN: 8,
	PASSWORD_MAX: 128,
	PASSWORD_LOGIN_MIN: 6, // ログイン時の最小文字数（既存ユーザー向け）

	// 名前
	NAME_MIN: 2,
	NAME_MAX: 50,

	// 電話番号
	PHONE_MIN: 10,
	PHONE_MAX: 15,

	// テキストエリア
	TEXTAREA_MAX: 1000,

	// ファイル名
	FILENAME_MAX: 255
} as const;

/**
 * 正規表現パターン
 */
export const REGEX_PATTERNS = {
	// メールアドレス（基本的なパターン）
	EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

	// パスワード要件
	PASSWORD_UPPERCASE: /[A-Z]/,
	PASSWORD_LOWERCASE: /[a-z]/,
	PASSWORD_NUMBER: /[0-9]/,
	PASSWORD_SPECIAL: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,

	// 電話番号（日本）
	PHONE_JP: /^0\d{9,10}$/,
	PHONE_MOBILE_JP: /^0[789]0\d{8}$/,

	// 郵便番号（日本）
	POSTAL_CODE_JP: /^\d{3}-?\d{4}$/,

	// 英数字のみ
	ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

	// ひらがなのみ
	HIRAGANA: /^[ぁ-ん]+$/,

	// カタカナのみ
	KATAKANA: /^[ァ-ヶー]+$/,

	// URL
	URL: /^https?:\/\/.+$/,

	// 株式銘柄コード（日本）
	STOCK_CODE_JP: /^\d{4}$/
} as const;

/**
 * 数値制限
 */
export const NUMBER_LIMITS = {
	// 金額
	AMOUNT_MIN: 0,
	AMOUNT_MAX: 999999999999, // 9999億9999万9999円

	// パーセンテージ
	PERCENTAGE_MIN: 0,
	PERCENTAGE_MAX: 100,

	// 株数
	STOCK_QUANTITY_MIN: 1,
	STOCK_QUANTITY_MAX: 999999999,

	// ページネーション
	PAGE_SIZE_DEFAULT: 20,
	PAGE_SIZE_MAX: 100
} as const;

/**
 * ファイルサイズ制限（バイト単位）
 */
export const FILE_SIZE_LIMITS = {
	// 画像
	IMAGE_MAX: 5 * 1024 * 1024, // 5MB
	AVATAR_MAX: 2 * 1024 * 1024, // 2MB

	// PDF
	PDF_MAX: 10 * 1024 * 1024, // 10MB

	// CSV
	CSV_MAX: 5 * 1024 * 1024, // 5MB

	// 一般的なドキュメント
	DOCUMENT_MAX: 20 * 1024 * 1024 // 20MB
} as const;

/**
 * 許可するファイルタイプ
 */
export const ALLOWED_FILE_TYPES = {
	IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
	PDF: ['.pdf'],
	CSV: ['.csv'],
	EXCEL: ['.xlsx', '.xls'],
	DOCUMENT: ['.pdf', '.doc', '.docx', '.txt']
} as const;

/**
 * 許可するMIMEタイプ
 */
export const ALLOWED_MIME_TYPES = {
	IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
	PDF: ['application/pdf'],
	CSV: ['text/csv', 'application/csv'],
	EXCEL: [
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-excel'
	]
} as const;

// 型定義
export type LengthLimit = typeof LENGTH_LIMITS;
export type RegexPattern = typeof REGEX_PATTERNS;
export type NumberLimit = typeof NUMBER_LIMITS;
export type FileSizeLimit = typeof FILE_SIZE_LIMITS;
export type AllowedFileType = typeof ALLOWED_FILE_TYPES;
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES;

/**
 * ビジネスロジック系のエラーメッセージを一元管理
 * UI表示用のエラーメッセージを定義
 */
export const BUSINESS_ERROR_MESSAGES = {
	// 給料明細関連
	SALARY_SLIP: {
		// 保存・取得エラー
		SAVE_FAILED: '給料明細の保存に失敗しました',
		FETCH_FAILED: '給料明細の取得に失敗しました',
		LOAD_FAILED: '給料明細の読み込みに失敗しました',

		// 重複・バリデーションエラー
		DUPLICATE_EXISTS: 'この支給日の給料明細は既に登録されています',
		INVALID_DATA: '給料明細のデータが不正です',

		// PDF処理エラー
		PDF_READ_FAILED: 'PDFの読み込みに失敗しました',
		PDF_PARSE_FAILED: 'PDF の解析に失敗しました',

		// DB保存エラー
		DB_SAVE_FAILED: 'DBへの保存に失敗しました'
	},

	// 月別給料データ関連
	MONTHLY_SALARY: {
		LOAD_FAILED: '月別給料データの読み込みに失敗しました'
	},

	// 株式・資産関連
	STOCK: {
		FETCH_FAILED: 'データの取得に失敗しました'
	},

	// 共通エラー
	COMMON: {
		GENERAL_ERROR: 'エラーが発生しました',
		UNKNOWN_ERROR: '予期しないエラーが発生しました',
		OPERATION_FAILED: '操作に失敗しました'
	}
} as const;

/**
 * ビジネスエラーメッセージの型定義
 */
export type BusinessErrorMessageKey = keyof typeof BUSINESS_ERROR_MESSAGES;
export type SalarySlipErrorKey = keyof typeof BUSINESS_ERROR_MESSAGES.SALARY_SLIP;
export type MonthlySalaryErrorKey = keyof typeof BUSINESS_ERROR_MESSAGES.MONTHLY_SALARY;
export type StockErrorKey = keyof typeof BUSINESS_ERROR_MESSAGES.STOCK;
export type CommonErrorKey = keyof typeof BUSINESS_ERROR_MESSAGES.COMMON;

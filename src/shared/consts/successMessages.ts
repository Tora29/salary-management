/**
 * 成功メッセージ定数定義
 * アプリケーション全体で使用する成功メッセージを一元管理
 */

export const SUCCESS_MESSAGES = {
	// 認証関連
	REGISTRATION_COMPLETE: '登録が完了しました。確認メールをご確認ください。',
	LOGIN_SUCCESS: 'ログインしました',
	LOGOUT_SUCCESS: 'ログアウトしました',
	PASSWORD_RESET_EMAIL_SENT: 'パスワードリセット用のメールを送信しました',
	PASSWORD_RESET_SUCCESS: 'パスワードがリセットされました',
	EMAIL_VERIFIED: 'メールアドレスの確認が完了しました。ログインしてください。',

	// データ操作
	DATA_SAVED: 'データを保存しました',
	DATA_UPDATED: 'データを更新しました',
	DATA_DELETED: 'データを削除しました',

	// 給与管理
	SALARY_REGISTERED: '給与情報を登録しました',
	SALARY_UPDATED: '給与情報を更新しました',
	SALARY_DELETED: '給与情報を削除しました',
	PDF_IMPORTED: '給与明細PDFを取り込みました',

	// 株式ポートフォリオ
	PORTFOLIO_ADDED: '銘柄を追加しました',
	PORTFOLIO_UPDATED: 'ポートフォリオを更新しました',
	TRADE_RECORDED: '取引を記録しました',

	// 設定
	SETTINGS_UPDATED: '設定を更新しました',
	PROFILE_UPDATED: 'プロフィールを更新しました'
} as const;

/**
 * 成功メッセージの型
 */
export type SuccessMessage = (typeof SUCCESS_MESSAGES)[keyof typeof SUCCESS_MESSAGES];

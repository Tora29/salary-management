export const COMMON_ERROR_MESSAGES = {
	// 汎用
	UNKNOWN_ERROR: 'エラーが発生しました',
	TRY_AGAIN_LATER: 'しばらくしてから再度お試しください',
	CONTACT_SUPPORT: 'この問題が続く場合は、サポートにお問い合わせください',

	// バリデーション
	REQUIRED_FIELD: '必須項目です',
	INVALID_FORMAT: '形式が正しくありません',
	INVALID_EMAIL: '有効なメールアドレスを入力してください',
	INVALID_LENGTH: '文字数が正しくありません',

	// 操作関連
	SAVE_SUCCESS: '保存しました',
	DELETE_SUCCESS: '削除しました',
	UPDATE_SUCCESS: '更新しました',
	OPERATION_FAILED: '操作に失敗しました'
} as const;

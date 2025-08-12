export const BUSINESS_ERROR_MESSAGES = {
	// 認証関連
	AUTH: {
		INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
		SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',
		ACCOUNT_LOCKED: 'アカウントがロックされています。15分後に再試行してください',
		PASSWORD_TOO_WEAK: 'パスワードが弱すぎます。より強力なパスワードを設定してください',
		EMAIL_NOT_VERIFIED: 'メールアドレスの確認が完了していません',
		USER_NOT_FOUND: 'ユーザーが見つかりません',
		ALREADY_LOGGED_IN: '既にログインしています',
		LOGIN_REQUIRED: 'ログインが必要です'
	},

	// パスワード関連
	PASSWORD: {
		MIN_LENGTH: 'パスワードは8文字以上である必要があります',
		MAX_LENGTH: 'パスワードは100文字以内である必要があります',
		REQUIRE_UPPERCASE: '大文字を1文字以上含めてください',
		REQUIRE_LOWERCASE: '小文字を1文字以上含めてください',
		REQUIRE_NUMBER: '数字を1文字以上含めてください',
		REQUIRE_SPECIAL: '特殊文字を1文字以上含めてください',
		RESET_TOKEN_EXPIRED: 'パスワードリセットトークンの有効期限が切れました',
		RESET_EMAIL_SENT: 'パスワードリセット用のメールを送信しました'
	},

	// ユーザー関連
	USER: {
		EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
		PROFILE_UPDATE_FAILED: 'プロフィールの更新に失敗しました',
		INVALID_USER_DATA: 'ユーザーデータが不正です'
	}
} as const;

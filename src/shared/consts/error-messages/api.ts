export const API_ERROR_MESSAGES = {
	// HTTPステータス関連
	BAD_REQUEST: 'リクエストが不正です',
	UNAUTHORIZED: '認証が必要です',
	FORBIDDEN: 'アクセス権限がありません',
	NOT_FOUND: 'リソースが見つかりません',
	TOO_MANY_REQUESTS: 'リクエスト数が上限に達しました。しばらくお待ちください',
	INTERNAL_SERVER_ERROR: 'サーバーエラーが発生しました',
	SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',

	// ネットワーク関連
	NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
	TIMEOUT: 'タイムアウトしました。もう一度お試しください',

	// API固有
	INVALID_RESPONSE: 'サーバーからの応答が不正です',
	API_KEY_INVALID: 'APIキーが無効です'
} as const;

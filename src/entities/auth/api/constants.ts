export const AUTH_CONSTANTS = {
	SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7日間
	SESSION_DURATION_REMEMBER: 30 * 24 * 60 * 60 * 1000, // 30日間
	MAX_LOGIN_ATTEMPTS: 5,
	LOCKOUT_DURATION: 15 * 60 * 1000, // 15分間
	PASSWORD_MIN_LENGTH: 8,
	PASSWORD_MAX_LENGTH: 100,
	SESSION_REFRESH_INTERVAL: 5 * 60 * 1000, // 5分ごと
	INACTIVITY_TIMEOUT: 30 * 60 * 1000 // 30分間の非アクティブでタイムアウト
} as const;

export const AUTH_ROUTES = {
	LOGIN: '/login',
	SIGNUP: '/signup',
	DASHBOARD: '/dashboard',
	FORGOT_PASSWORD: '/forgot-password',
	RESET_PASSWORD: '/reset-password',
	PROFILE: '/profile'
} as const;

export const AUTH_COOKIE_NAMES = {
	SESSION: 'sb-auth-token',
	REFRESH: 'sb-refresh-token',
	CSRF: 'csrf-token'
} as const;

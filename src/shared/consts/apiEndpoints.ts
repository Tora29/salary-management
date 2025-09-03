/**
 * APIエンドポイント定数定義
 * アプリケーション全体で使用するAPIエンドポイントを一元管理
 */

/**
 * API基本設定
 */
export const API_BASE = {
	// 内部API
	INTERNAL: '/api',

	// 外部API（必要に応じて設定）
	EXTERNAL: import.meta.env.VITE_PUBLIC_EXTERNAL_API_URL || '',

	// Supabase URL（環境変数から取得）
	SUPABASE: import.meta.env.VITE_PUBLIC_SUPABASE_URL || ''
} as const;

/**
 * 認証関連エンドポイント
 */
export const AUTH_ENDPOINTS = {
	// ユーザー認証
	LOGIN: `${API_BASE.INTERNAL}/auth/login`,
	LOGOUT: `${API_BASE.INTERNAL}/auth/logout`,
	REGISTER: `${API_BASE.INTERNAL}/auth/register`,
	REFRESH: `${API_BASE.INTERNAL}/auth/refresh`,

	// パスワード管理
	FORGOT_PASSWORD: `${API_BASE.INTERNAL}/auth/forgot-password`,
	RESET_PASSWORD: `${API_BASE.INTERNAL}/auth/reset-password`,
	CHANGE_PASSWORD: `${API_BASE.INTERNAL}/auth/change-password`,

	// メール確認
	VERIFY_EMAIL: `${API_BASE.INTERNAL}/auth/verify-email`,
	RESEND_VERIFICATION: `${API_BASE.INTERNAL}/auth/resend-verification`,

	// セッション管理
	SESSION: `${API_BASE.INTERNAL}/auth/session`,
	VALIDATE_TOKEN: `${API_BASE.INTERNAL}/auth/validate-token`
} as const;

/**
 * ユーザー関連エンドポイント
 */
export const USER_ENDPOINTS = {
	// プロフィール
	PROFILE: `${API_BASE.INTERNAL}/user/profile`,
	UPDATE_PROFILE: `${API_BASE.INTERNAL}/user/profile`,
	UPLOAD_AVATAR: `${API_BASE.INTERNAL}/user/avatar`,

	// 設定
	SETTINGS: `${API_BASE.INTERNAL}/user/settings`,
	UPDATE_SETTINGS: `${API_BASE.INTERNAL}/user/settings`,

	// アカウント管理
	DELETE_ACCOUNT: `${API_BASE.INTERNAL}/user/delete`,
	EXPORT_DATA: `${API_BASE.INTERNAL}/user/export`
} as const;

/**
 * 給与管理関連エンドポイント
 */
export const SALARY_ENDPOINTS = {
	// CRUD操作
	LIST: `${API_BASE.INTERNAL}/salary`,
	GET: (id: string) => `${API_BASE.INTERNAL}/salary/${id}`,
	CREATE: `${API_BASE.INTERNAL}/salary`,
	UPDATE: (id: string) => `${API_BASE.INTERNAL}/salary/${id}`,
	DELETE: (id: string) => `${API_BASE.INTERNAL}/salary/${id}`,

	// インポート/エクスポート
	IMPORT_PDF: `${API_BASE.INTERNAL}/salary/import/pdf`,
	IMPORT_CSV: `${API_BASE.INTERNAL}/salary/import/csv`,
	EXPORT_CSV: `${API_BASE.INTERNAL}/salary/export/csv`,
	EXPORT_PDF: `${API_BASE.INTERNAL}/salary/export/pdf`,

	// 集計
	SUMMARY: `${API_BASE.INTERNAL}/salary/summary`,
	ANNUAL_REPORT: `${API_BASE.INTERNAL}/salary/report/annual`,
	MONTHLY_REPORT: `${API_BASE.INTERNAL}/salary/report/monthly`
} as const;

/**
 * 株式ポートフォリオ関連エンドポイント
 */
export const PORTFOLIO_ENDPOINTS = {
	// CRUD操作
	LIST: `${API_BASE.INTERNAL}/portfolio`,
	GET: (id: string) => `${API_BASE.INTERNAL}/portfolio/${id}`,
	CREATE: `${API_BASE.INTERNAL}/portfolio`,
	UPDATE: (id: string) => `${API_BASE.INTERNAL}/portfolio/${id}`,
	DELETE: (id: string) => `${API_BASE.INTERNAL}/portfolio/${id}`,

	// 取引
	TRADE: `${API_BASE.INTERNAL}/portfolio/trade`,
	TRADE_HISTORY: `${API_BASE.INTERNAL}/portfolio/trade/history`,

	// 市場データ
	MARKET_DATA: `${API_BASE.INTERNAL}/portfolio/market`,
	STOCK_PRICE: (code: string) => `${API_BASE.INTERNAL}/portfolio/market/${code}`,

	// レポート
	VALUATION: `${API_BASE.INTERNAL}/portfolio/valuation`,
	PERFORMANCE: `${API_BASE.INTERNAL}/portfolio/performance`,
	DIVIDEND: `${API_BASE.INTERNAL}/portfolio/dividend`
} as const;

/**
 * 管理者向けエンドポイント
 */
export const ADMIN_ENDPOINTS = {
	// ユーザー管理
	USERS_LIST: `${API_BASE.INTERNAL}/admin/users`,
	USER_DETAIL: (id: string) => `${API_BASE.INTERNAL}/admin/users/${id}`,
	USER_UPDATE: (id: string) => `${API_BASE.INTERNAL}/admin/users/${id}`,
	USER_DELETE: (id: string) => `${API_BASE.INTERNAL}/admin/users/${id}`,

	// システム設定
	SYSTEM_SETTINGS: `${API_BASE.INTERNAL}/admin/settings`,
	UPDATE_SETTINGS: `${API_BASE.INTERNAL}/admin/settings`,

	// ログ
	ACTIVITY_LOGS: `${API_BASE.INTERNAL}/admin/logs`,
	ERROR_LOGS: `${API_BASE.INTERNAL}/admin/logs/errors`
} as const;

/**
 * HTTPメソッド
 */
export const HTTP_METHODS = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE',
	OPTIONS: 'OPTIONS',
	HEAD: 'HEAD'
} as const;

/**
 * リクエストヘッダー
 */
export const REQUEST_HEADERS = {
	CONTENT_TYPE_JSON: 'application/json',
	CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded',
	CONTENT_TYPE_MULTIPART: 'multipart/form-data',
	ACCEPT_JSON: 'application/json',
	AUTHORIZATION: (token: string) => `Bearer ${token}`
} as const;

// 型定義
export type ApiBase = typeof API_BASE;
export type AuthEndpoint = (typeof AUTH_ENDPOINTS)[keyof typeof AUTH_ENDPOINTS];
export type UserEndpoint = (typeof USER_ENDPOINTS)[keyof typeof USER_ENDPOINTS];
export type SalaryEndpoint = typeof SALARY_ENDPOINTS;
export type PortfolioEndpoint = typeof PORTFOLIO_ENDPOINTS;
export type AdminEndpoint = typeof ADMIN_ENDPOINTS;
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

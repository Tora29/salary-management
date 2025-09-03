/**
 * ルーティングパス定数定義
 * アプリケーション全体で使用するルーティングパスを一元管理
 */

/**
 * ページルート
 */
export const ROUTES = {
	// ホーム
	HOME: '/',

	// 認証関連
	LOGIN: '/login',
	REGISTER: '/register',
	FORGOT_PASSWORD: '/forgot-password',
	RESET_PASSWORD: '/reset-password',
	TERMS: '/terms',
	PRIVACY: '/privacy',

	// 認証後のページ
	DASHBOARD: '/dashboard',
	PROFILE: '/profile',
	SETTINGS: '/settings',

	// 給与管理
	SALARY: '/salary',
	SALARY_LIST: '/salary/list',
	SALARY_DETAIL: '/salary/[id]',
	SALARY_ADD: '/salary/add',
	SALARY_EDIT: '/salary/[id]/edit',
	SALARY_IMPORT: '/salary/import',

	// 株式ポートフォリオ
	PORTFOLIO: '/portfolio',
	PORTFOLIO_LIST: '/portfolio/list',
	PORTFOLIO_DETAIL: '/portfolio/[id]',
	PORTFOLIO_ADD: '/portfolio/add',
	PORTFOLIO_TRADE: '/portfolio/trade',

	// レポート
	REPORTS: '/reports',
	REPORTS_ANNUAL: '/reports/annual',
	REPORTS_MONTHLY: '/reports/monthly',
	REPORTS_TAX: '/reports/tax',

	// 管理者向け
	ADMIN: '/admin',
	ADMIN_USERS: '/admin/users',
	ADMIN_SETTINGS: '/admin/settings'
} as const;

/**
 * クエリパラメータ付きルート生成ヘルパー
 */
export const ROUTE_WITH_PARAMS = {
	LOGIN_WITH_MESSAGE: (message: string) => `${ROUTES.LOGIN}?message=${encodeURIComponent(message)}`,
	LOGIN_REGISTERED: `${ROUTES.LOGIN}?registered=true`,
	LOGIN_CONFIRMED: `${ROUTES.LOGIN}?confirmed=true`,
	LOGIN_RESET: `${ROUTES.LOGIN}?reset=true`,

	SALARY_DETAIL: (id: string) => `/salary/${id}`,
	SALARY_EDIT: (id: string) => `/salary/${id}/edit`,

	PORTFOLIO_DETAIL: (id: string) => `/portfolio/${id}`,

	RESET_PASSWORD_WITH_TOKEN: (token: string) => `${ROUTES.RESET_PASSWORD}?token=${token}`
} as const;

/**
 * 外部URL
 */
export const EXTERNAL_URLS = {
	SUPPORT: 'https://support.example.com',
	DOCUMENTATION: 'https://docs.example.com',
	GITHUB: 'https://github.com/example/salary-management',
	COMPANY_WEBSITE: 'https://example.com'
} as const;

/**
 * リダイレクト設定
 */
export const REDIRECTS = {
	// ログイン後のデフォルトリダイレクト先
	AFTER_LOGIN: ROUTES.DASHBOARD,

	// 登録後のリダイレクト先
	AFTER_REGISTER: ROUTE_WITH_PARAMS.LOGIN_REGISTERED,

	// ログアウト後のリダイレクト先
	AFTER_LOGOUT: ROUTES.LOGIN,

	// 未認証時のリダイレクト先
	UNAUTHORIZED: ROUTES.LOGIN,

	// エラー時のリダイレクト先
	ERROR: ROUTES.HOME
} as const;

// 型定義
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
export type RouteWithParams = typeof ROUTE_WITH_PARAMS;
export type ExternalUrl = (typeof EXTERNAL_URLS)[keyof typeof EXTERNAL_URLS];
export type Redirect = (typeof REDIRECTS)[keyof typeof REDIRECTS];

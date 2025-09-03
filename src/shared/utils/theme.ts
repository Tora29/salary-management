/**
 * テーマ管理ユーティリティ
 * アプリケーション全体のテーマ切り替え機能を提供
 */

export const themes = [
	'light', // デフォルト
	'minimal-red',
	'dark-orange',
	'warm-beige',
	'soft-blue',
	'pink-black',
	'dark-yellow',
	'purple-dark',
	'earth-tone',
	'teal-fresh',
	'navy-coral'
] as const;

/**
 * テーマの型定義
 */
export type Theme = (typeof themes)[number];

/**
 * テーマを設定
 *
 * @param theme - 適用するテーマ名
 */
export function setTheme(theme: Theme): void {
	if (theme === 'light') {
		// デフォルトテーマの場合はdata-theme属性を削除
		document.documentElement.removeAttribute('data-theme');
	} else {
		document.documentElement.setAttribute('data-theme', theme);
	}
	localStorage.setItem('theme', theme);
}

/**
 * 現在のテーマを取得
 *
 * @returns 現在のテーマ名
 */
export function getTheme(): Theme {
	const savedTheme = localStorage.getItem('theme');
	// 保存されたテーマが有効なテーマかチェック
	if (savedTheme && themes.includes(savedTheme as Theme)) {
		return savedTheme as Theme;
	}
	return 'light'; // デフォルト
}

/**
 * テーマを初期化（アプリケーション起動時に実行）
 */
export function initTheme(): void {
	const savedTheme = getTheme();
	if (savedTheme !== 'light') {
		document.documentElement.setAttribute('data-theme', savedTheme);
	}
}

/**
 * 次のテーマに切り替え（サイクル）
 */
export function cycleTheme(): void {
	const currentTheme = getTheme();
	const currentIndex = themes.indexOf(currentTheme);
	const nextIndex = (currentIndex + 1) % themes.length;
	const nextTheme = themes[nextIndex];
	if (nextTheme) {
		setTheme(nextTheme);
	}
}

/**
 * システムのダークモード設定を監視してテーマを自動切り替え
 */
export function watchSystemPreference(): void {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	const handleChange = (e: MediaQueryListEvent): void => {
		const savedTheme = localStorage.getItem('theme');
		// ユーザーが明示的にテーマを選択していない場合のみ自動切り替え
		if (!savedTheme) {
			if (e.matches) {
				// ダークモード系のテーマを適用
				setTheme('dark-orange');
			} else {
				// ライトモード（デフォルト）を適用
				setTheme('light');
			}
		}
	};

	mediaQuery.addEventListener('change', handleChange);

	// 初回実行
	if (!localStorage.getItem('theme')) {
		if (mediaQuery.matches) {
			setTheme('dark-orange');
		}
	}
}

/**
 * テーマの表示名を取得
 */
export function getThemeDisplayName(theme: Theme): string {
	const displayNames: Record<Theme, string> = {
		light: 'ライト（デフォルト）',
		'minimal-red': 'ミニマルレッド',
		'dark-orange': 'ダークオレンジ',
		'warm-beige': 'ウォームベージュ',
		'soft-blue': 'ソフトブルー',
		'pink-black': 'ピンクブラック',
		'dark-yellow': 'ダークイエロー',
		'purple-dark': 'パープルダーク',
		'earth-tone': 'アーストーン',
		'teal-fresh': 'ティールフレッシュ',
		'navy-coral': 'ネイビーコーラル'
	};

	return displayNames[theme] || theme;
}

/**
 * テーマがダーク系かどうかを判定
 */
export function isDarkTheme(theme: Theme): boolean {
	const darkThemes: Theme[] = ['dark-orange', 'pink-black', 'dark-yellow', 'purple-dark'];
	return darkThemes.includes(theme);
}

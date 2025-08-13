/**
 * テーマ（ダークモード/ライトモード）の状態管理ストア
 */

type Theme = 'light' | 'dark';

class ThemeStore {
	#theme = $state<Theme>('light');
	private initialized = false;

	constructor() {
		// クライアントサイドでのみ初期化
		if (typeof window !== 'undefined') {
			this.initialize();
		}
	}

	/**
	 * 初期化処理
	 * - localStorageから設定を読み込み
	 * - 設定がない場合はシステム設定を使用
	 */
	private initialize(): void {
		if (this.initialized) {
			return;
		}
		this.initialized = true;

		// localStorageから設定を取得
		const stored = localStorage.getItem('theme');

		if (stored === 'dark' || stored === 'light') {
			this.#theme = stored;
		} else {
			// システムのテーマ設定を検出
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			this.#theme = prefersDark ? 'dark' : 'light';
		}

		// テーマを適用
		this.applyTheme();

		// システムテーマの変更を監視
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			// ユーザーが明示的に設定していない場合のみシステム設定に従う
			if (!localStorage.getItem('theme')) {
				this.#theme = e.matches ? 'dark' : 'light';
				this.applyTheme();
			}
		});
	}

	/**
	 * 現在のテーマを取得（リアクティブ）
	 */
	get current(): Theme {
		return this.#theme;
	}

	/**
	 * ダークモードかどうかを取得（リアクティブ）
	 */
	get isDark(): boolean {
		return this.#theme === 'dark';
	}

	/**
	 * テーマを切り替える
	 */
	toggle(): void {
		this.#theme = this.#theme === 'dark' ? 'light' : 'dark';
		this.save();
		this.applyTheme();
	}

	/**
	 * テーマを設定
	 */
	set(theme: Theme): void {
		this.#theme = theme;
		this.save();
		this.applyTheme();
	}

	/**
	 * localStorageに保存
	 */
	private save(): void {
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', this.#theme);
		}
	}

	/**
	 * HTMLにテーマクラスを適用
	 */
	private applyTheme(): void {
		if (typeof document !== 'undefined') {
			const html = document.documentElement;
			html.classList.remove('light', 'dark');
			html.classList.add(this.#theme);

			// メタテーマカラーも更新
			const metaThemeColor = document.querySelector('meta[name="theme-color"]');
			if (metaThemeColor) {
				metaThemeColor.setAttribute('content', this.#theme === 'dark' ? '#1a1a1a' : '#ffffff');
			}
		}
	}

	/**
	 * 手動で初期化（SSR対応）
	 */
	init(): void {
		if (typeof window !== 'undefined' && !this.initialized) {
			this.initialize();
		}
	}
}

// シングルトンインスタンスをエクスポート
export const themeStore = new ThemeStore();

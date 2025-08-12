import { AUTH_CONSTANTS } from '$entities/auth/api/constants';

class SessionManager {
	private refreshTimer: ReturnType<typeof setInterval> | null = null;
	private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
	private lastActivity = $state(Date.now());

	// $derivedをクラスフィールドとして宣言
	timeSinceLastActivity = $derived(Date.now() - this.lastActivity);
	isInactive = $derived(this.timeSinceLastActivity > AUTH_CONSTANTS.INACTIVITY_TIMEOUT);

	constructor() {
		$effect(() => {
			// ブラウザでのみ実行
			if (typeof window === 'undefined') {
				return;
			}

			const cleanup = this.setupActivityListeners();
			this.startSessionRefresh();

			return () => {
				cleanup?.();
				this.cleanup();
			};
		});
	}

	private setupActivityListeners(): (() => void) | undefined {
		const updateActivity = (): void => {
			this.lastActivity = Date.now();
			this.resetInactivityTimer();
		};

		window.addEventListener('mousemove', updateActivity);
		window.addEventListener('keypress', updateActivity);
		window.addEventListener('click', updateActivity);
		window.addEventListener('scroll', updateActivity);

		// クリーンアップ関数で削除
		return () => {
			window.removeEventListener('mousemove', updateActivity);
			window.removeEventListener('keypress', updateActivity);
			window.removeEventListener('click', updateActivity);
			window.removeEventListener('scroll', updateActivity);
		};
	}

	private startSessionRefresh(): void {
		// 定期的にセッションを更新
		this.refreshTimer = setInterval(() => {
			this.refreshSession();
		}, AUTH_CONSTANTS.SESSION_REFRESH_INTERVAL);
	}

	private resetInactivityTimer(): void {
		if (this.inactivityTimer) {
			clearTimeout(this.inactivityTimer);
		}

		this.inactivityTimer = setTimeout(() => {
			this.handleInactivity();
		}, AUTH_CONSTANTS.INACTIVITY_TIMEOUT);
	}

	private async refreshSession(): Promise<void> {
		// TODO: セッションリフレッシュAPIの実装
		try {
			const response = await fetch('/api/auth/refresh', {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				console.error('Session refresh failed');
			}
		} catch (error) {
			console.error('Session refresh error:', error);
		}
	}

	private handleInactivity(): void {
		// 非アクティブによるログアウト処理
		// TODO: ログアウト処理の実装
	}

	cleanup(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = null;
		}
		if (this.inactivityTimer) {
			clearTimeout(this.inactivityTimer);
			this.inactivityTimer = null;
		}
	}
}

export const sessionManager = new SessionManager();

export function useSession(): SessionManager {
	return sessionManager;
}

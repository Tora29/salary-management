import type { User } from '$entities/user/model/types';
import type { Session } from '$entities/auth/model/types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../api/auth-client';
import type { LoginFormData } from '../model/types';
import { toastStore } from '$shared/stores/toast.svelte';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';
import { goto } from '$app/navigation';
import { AUTH_ROUTES } from '$entities/auth/api/constants';

class AuthStore {
	private _user = $state<User | null>(null);
	private _session = $state<Session | null>(null);
	private _loading = $state(false);
	private _error = $state<string | null>(null);
	private _initialized = $state(false);

	// $derivedをクラスフィールドとして宣言
	isAuthenticated = $derived(!!this._user && !!this._session);
	displayName = $derived(this._user?.profile?.name || this._user?.email?.split('@')[0] || 'ゲスト');

	get user() {
		return this._user;
	}

	get session() {
		return this._session;
	}

	get loading() {
		return this._loading;
	}

	get error() {
		return this._error;
	}

	get initialized() {
		return this._initialized;
	}

	async initialize() {
		if (this._initialized) {
			return;
		}

		this._loading = true;
		try {
			const user = await getCurrentUser();
			if (user) {
				this._user = user;
				// TODO: セッション情報も取得する
			}
		} catch (error) {
			console.error('Auth initialization error:', error);
		} finally {
			this._loading = false;
			this._initialized = true;
		}
	}

	async login(data: LoginFormData) {
		this._loading = true;
		this._error = null;

		try {
			const response = await apiLogin(data);

			if (!response.success) {
				this._error = response.error || ERROR_MESSAGES.BUSINESS.AUTH.INVALID_CREDENTIALS;
				toastStore.error(this._error);
				return false;
			}

			this._user = response.user || null;
			this._session = response.session || null;

			toastStore.success('ログインしました');
			await goto(AUTH_ROUTES.DASHBOARD);
			return true;
		} catch (error) {
			console.error('Login error:', error);
			this._error = ERROR_MESSAGES.API.NETWORK_ERROR;
			toastStore.error(this._error);
			return false;
		} finally {
			this._loading = false;
		}
	}

	async logout() {
		this._loading = true;
		this._error = null;

		try {
			const response = await apiLogout();

			if (!response.success) {
				this._error = response.error || ERROR_MESSAGES.COMMON.OPERATION_FAILED;
				toastStore.error(this._error);
				return false;
			}

			this._user = null;
			this._session = null;

			toastStore.success('ログアウトしました');
			await goto(AUTH_ROUTES.LOGIN);
			return true;
		} catch (error) {
			console.error('Logout error:', error);
			this._error = ERROR_MESSAGES.API.NETWORK_ERROR;
			toastStore.error(this._error);
			return false;
		} finally {
			this._loading = false;
		}
	}

	clearError() {
		this._error = null;
	}
}

export const authStore = new AuthStore();

export function useAuth() {
	return authStore;
}

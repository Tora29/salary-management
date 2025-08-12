import type { LoginFormData, LoginResponse, LogoutResponse } from '../model/types';
import { ERROR_MESSAGES } from '$shared/consts/error-messages';

const API_BASE = '/api/auth';

export async function login(data: LoginFormData): Promise<LoginResponse> {
	try {
		const response = await fetch(`${API_BASE}/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			credentials: 'include'
		});

		const result = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: result.message || ERROR_MESSAGES.BUSINESS.AUTH.INVALID_CREDENTIALS
			};
		}

		return {
			success: true,
			user: result.user,
			session: result.session
		};
	} catch (error) {
		console.error('Login error:', error);
		return {
			success: false,
			error: ERROR_MESSAGES.API.NETWORK_ERROR
		};
	}
}

export async function logout(): Promise<LogoutResponse> {
	try {
		const response = await fetch(`${API_BASE}/logout`, {
			method: 'POST',
			credentials: 'include'
		});

		if (!response.ok) {
			const result = await response.json();
			return {
				success: false,
				error: result.message || ERROR_MESSAGES.COMMON.OPERATION_FAILED
			};
		}

		return { success: true };
	} catch (error) {
		console.error('Logout error:', error);
		return {
			success: false,
			error: ERROR_MESSAGES.API.NETWORK_ERROR
		};
	}
}

export async function getCurrentUser() {
	try {
		const response = await fetch(`${API_BASE}/me`, {
			credentials: 'include'
		});

		if (!response.ok) {
			return null;
		}

		const result = await response.json();
		return result.user;
	} catch (error) {
		console.error('Get current user error:', error);
		return null;
	}
}

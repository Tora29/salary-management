import type { User } from '$entities/user/model/types';
import type { Session } from '$entities/auth/model/types';

export interface LoginFormData {
	email: string;
	password: string;
	rememberMe: boolean;
}

export interface LoginResponse {
	success: boolean;
	user?: User;
	session?: Session;
	error?: string;
}

export interface LogoutResponse {
	success: boolean;
	error?: string;
}

export interface AuthState {
	user: User | null;
	session: Session | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

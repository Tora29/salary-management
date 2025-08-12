export interface Session {
	id: string;
	userId: string;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	createdAt: string;
	lastActivity: string;
}

export interface AuthToken {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	tokenType: string;
}

export interface AuthResponse {
	user: {
		id: string;
		email: string;
		createdAt: string;
	};
	session: Session;
}

export interface AuthError {
	code: string;
	message: string;
	status?: number;
}

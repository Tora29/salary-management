export interface User {
	id: string;
	email: string;
	createdAt: string;
	updatedAt: string;
	lastLoginAt?: string;
	profile?: UserProfile;
}

export interface UserProfile {
	id: string;
	userId: string;
	name?: string;
	avatarUrl?: string;
	createdAt: string;
	updatedAt: string;
}

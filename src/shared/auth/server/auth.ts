import { prisma } from '../../db/server/prisma';

import { PrismaAdapter } from '@auth/prisma-adapter';
import { SvelteKitAuth } from '@auth/sveltekit';
import type { Session } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: PrismaAdapter(prisma),
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
			authorization: {
				params: {
					prompt: 'consent',
					access_type: 'offline',
					response_type: 'code'
				}
			}
		})
	],
	callbacks: {
		async session({ session, user }) {
			if (session?.user) {
				session.user.id = user.id;
			}
			return session;
		}
	},
	pages: {
		signIn: '/login',
		error: '/login'
	},
	secret: process.env.AUTH_SECRET ?? '',
	trustHost: true
});

export type AuthSession = Session;

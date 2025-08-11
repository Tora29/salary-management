import { handle as authHandle } from './shared/auth/server/auth';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = authHandle;

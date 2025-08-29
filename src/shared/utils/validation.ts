import type { ZodError } from 'zod';

export function formatZodError(error: ZodError): Record<string, string> {
	const formatted: Record<string, string> = {};
	error.errors.forEach((err) => {
		const path = err.path.join('.');
		formatted[path] = err.message;
	});
	return formatted;
}

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

import type { ApiErrorData } from './error';

/**
 * ValidationErrorのエラーデータかどうかを判定する型ガード
 * @param {unknown} data - チェックするデータ
 * @returns {boolean} ValidationErrorデータの場合true
 */
export function isValidationErrorData(data: unknown): data is { errors: Record<string, string[]> } {
	if (data === null || typeof data !== 'object' || !('errors' in data)) {
		return false;
	}

	const dataWithErrors = data as { errors: unknown };
	return (
		typeof dataWithErrors.errors === 'object' &&
		dataWithErrors.errors !== null
	);
}

/**
 * ApiErrorDataかどうかを判定する型ガード
 * @param {unknown} data - チェックするデータ
 * @returns {boolean} ApiErrorDataの場合true
 */
export function isApiErrorData(data: unknown): data is ApiErrorData {
	if (data === null || typeof data !== 'object') {
		return false;
	}

	const obj = data as Record<string, unknown>;

	return (
		(obj.message === undefined || typeof obj.message === 'string') &&
		(obj.details === undefined || (typeof obj.details === 'object' && obj.details !== null)) &&
		(obj.timestamp === undefined || typeof obj.timestamp === 'string') &&
		(obj.requestId === undefined || typeof obj.requestId === 'string')
	);
}

/**
 * ネットワークエラーかどうかを判定
 * @param {unknown} error - チェックするエラー
 * @returns {boolean} ネットワークエラーの場合true
 */
export function isNetworkError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.message.includes('fetch') ||
		error.message.includes('network') ||
		error.message.includes('Network') ||
		error.name === 'NetworkError' ||
		error.name === 'TypeError' // Fetch失敗時のTypeError
	);
}

/**
 * タイムアウトエラーかどうかを判定
 * @param {unknown} error - チェックするエラー
 * @returns {boolean} タイムアウトエラーの場合true
 */
export function isTimeoutError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		error.name === 'AbortError' ||
		error.message.includes('timeout') ||
		error.message.includes('Timeout')
	);
}

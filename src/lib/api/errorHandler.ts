import { API_ERROR_MSG, type ApiErrorKey } from '$lib/consts/apiErrorMessages';
import {
	APIError,
	UnauthorizedError,
	ValidationError,
	NotFoundError,
	ForbiddenError,
	InternalServerError
} from './error';
import { showToast } from '$lib/components/toast/model';
import { isNetworkError, isTimeoutError } from './typeGuards';

/**
 * エラーから適切なメッセージを取得
 * @param {unknown} error - エラーオブジェクト
 * @returns {string} エラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
	// APIErrorの場合は既に適切なメッセージが設定されている
	if (error instanceof APIError) {
		return error.statusText;
	}

	// 通常のErrorの場合
	if (error instanceof Error) {
		// ネットワークエラー
		if (error.message === API_ERROR_MSG.NETWORK_ERROR) {
			return API_ERROR_MSG.NETWORK_ERROR;
		}

		// タイムアウトエラー
		if (error.message === API_ERROR_MSG.TIMEOUT) {
			return API_ERROR_MSG.TIMEOUT;
		}

		// fetchエラー
		if (error.message.includes('fetch')) {
			return API_ERROR_MSG.NETWORK_ERROR;
		}

		// AbortError
		if (error.name === 'AbortError') {
			return API_ERROR_MSG.TIMEOUT;
		}

		// その他のエラー
		return error.message;
	}

	// 不明なエラー
	return API_ERROR_MSG.UNEXPECTED_ERROR;
}

/**
 * エラーの種類を判定
 * @param {unknown} error - エラーオブジェクト
 * @returns {ApiErrorKey | null} エラーの種類
 */
export function getErrorType(error: unknown): ApiErrorKey | null {
	if (error instanceof UnauthorizedError) {
		return 'UNAUTHORIZED';
	}

	if (error instanceof ValidationError) {
		return 'VALIDATION_ERROR';
	}

	if (error instanceof NotFoundError) {
		return 'NOT_FOUND';
	}

	if (error instanceof ForbiddenError) {
		return 'FORBIDDEN';
	}

	if (error instanceof InternalServerError) {
		return 'SERVER_ERROR';
	}

	if (error instanceof APIError) {
		switch (error.status) {
			case 400:
				return 'BAD_REQUEST';
			case 405:
				return 'METHOD_NOT_ALLOWED';
			case 409:
				return 'CONFLICT';
			case 422:
				return 'UNPROCESSABLE_ENTITY';
			case 429:
				return 'TOO_MANY_REQUESTS';
			default:
				if (error.status >= 500) {
					return 'SERVER_ERROR';
				}
				return null;
		}
	}

	return null;
}

/**
 * エラーをトースト通知で表示
 * @param {unknown} error - エラーオブジェクト
 * @param {Object} options - オプション
 * @param {boolean} options.showDetails - 詳細を表示するか
 * @param {string} options.fallbackMessage - フォールバックメッセージ
 */
export function handleErrorWithToast(
	error: unknown,
	options: {
		showDetails?: boolean;
		fallbackMessage?: string;
	} = {}
): void {
	const message = getErrorMessage(error);

	// ValidationErrorの場合は最初のエラーメッセージを表示
	if (error instanceof ValidationError && error.errors) {
		const errorValues = Object.values(error.errors).flat();
		const firstError = errorValues.length > 0 ? errorValues[0] : null;
		if (firstError) {
			showToast({
				type: 'error',
				title: 'エラー',
				message: `${message}: ${firstError}`
			});
			return;
		}
	}

	showToast({
		type: 'error',
		title: 'エラー',
		message: options.fallbackMessage || message
	});
}

/**
 * リトライ可能なエラーかどうかを判定
 * @param {unknown} error - エラーオブジェクト
 * @returns {boolean} リトライ可能な場合true
 */
export function isRetryableError(error: unknown): boolean {
	// ネットワークエラーはリトライ可能
	if (isNetworkError(error) || isTimeoutError(error)) {
		return true;
	}

	// 5xx エラーはリトライ可能
	if (error instanceof APIError) {
		if (error.status >= 500) {
			return true;
		}
		// Rate Limitエラーもリトライ可能
		if (error.status === 429) {
			return true;
		}
	}

	return false;
}

/**
 * 認証が必要なエラーかどうかを判定
 * @param {unknown} error - エラーオブジェクト
 * @returns {boolean} 認証が必要な場合true
 */
export function isAuthenticationRequired(error: unknown): boolean {
	return error instanceof UnauthorizedError;
}

/**
 * エラーの詳細情報を取得
 * @param {unknown} error - エラーオブジェクト
 * @returns {Object} エラーの詳細情報
 */
export function getErrorDetails(error: unknown): {
	message: string;
	type: ApiErrorKey | null;
	status?: number;
	data?: unknown;
	isRetryable: boolean;
	requiresAuth: boolean;
} {
	const message = getErrorMessage(error);
	const type = getErrorType(error);
	const isRetryable = isRetryableError(error);
	const requiresAuth = isAuthenticationRequired(error);

	if (error instanceof APIError) {
		return {
			message,
			type,
			status: error.status,
			data: error.data,
			isRetryable,
			requiresAuth
		};
	}

	return {
		message,
		type,
		isRetryable,
		requiresAuth
	};
}

/**
 * エラーログを記録
 * @param {unknown} error - エラーオブジェクト
 * @param {string} context - エラーが発生したコンテキスト
 */
export function logError(error: unknown, context: string): void {
	const details = getErrorDetails(error);

	console.error(`[${context}] Error:`, {
		message: details.message,
		type: details.type,
		status: details.status,
		data: details.data,
		timestamp: new Date().toISOString()
	});

	// 開発環境ではスタックトレースも表示
	if (import.meta.env.DEV && error instanceof Error) {
		console.error('Stack trace:', error.stack);
	}
}

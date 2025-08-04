import { API_ERROR_MSG } from '$lib/consts/apiErrorMessages';

/**
 * APIエラーの詳細データ型
 */
export interface ApiErrorData {
	message?: string;
	details?: Record<string, unknown>;
	timestamp?: string;
	requestId?: string;
}

export type ErrorData = ApiErrorData | string | null;

/**
 * APIエラーの基底クラス
 *
 * @class APIError
 * @extends {Error}
 *
 * @example
 * ```typescript
 * import { APIError } from '$shared/api/apiError.svelte';
 *
 * // カスタムエラーハンドリング
 * if (response.status === 400) {
 *   throw new APIError(400, 'Bad Request', { field: 'invalid' });
 * }
 * ```
 */
export class APIError extends Error {
	public readonly timestamp: string;
	public readonly requestId?: string;

	/**
	 * @param {number} status - HTTPステータスコード
	 * @param {string} statusText - ステータステキスト
	 * @param {ErrorData} [data] - エラーの詳細データ
	 * @param {string} [requestId] - リクエストID
	 */
	constructor(
		public status: number,
		public statusText: string,
		public data?: ErrorData,
		requestId?: string
	) {
		super(`API Error: ${status} ${statusText}`);
		this.name = 'APIError';
		this.timestamp = new Date().toISOString();
		if (requestId) {
			this.requestId = requestId;
		}
	}

	/**
	 * 指定されたエラーがAPIErrorのインスタンスかどうかを判定
	 * @param {unknown} error - チェックするエラー
	 * @returns {boolean} APIErrorのインスタンスの場合true
	 */
	static isAPIError(error: unknown): error is APIError {
		return error instanceof APIError;
	}

	/**
	 * ResponseオブジェクトからAPIErrorを作成
	 * @param {Response} response - Fetchレスポンス
	 * @param {ErrorData} [data] - エラーの詳細データ
	 * @returns {APIError} 作成されたAPIError
	 */
	static from(response: Response, data?: ErrorData): APIError {
		return new APIError(response.status, response.statusText, data);
	}
}

/**
 * 401 Unauthorizedエラー
 *
 * @class UnauthorizedError
 * @extends {APIError}
 *
 * @example
 * ```typescript
 * if (error instanceof UnauthorizedError) {
 *   // ログインページへリダイレクト
 *   await goto('/login');
 * }
 * ```
 */
export class UnauthorizedError extends APIError {
	constructor(data?: ErrorData) {
		super(401, API_ERROR_MSG.UNAUTHORIZED, data);
		this.name = 'UnauthorizedError';
	}
}

/**
 * 404 Not Foundエラー
 *
 * @class NotFoundError
 * @extends {APIError}
 */
export class NotFoundError extends APIError {
	constructor(data?: ErrorData) {
		super(404, API_ERROR_MSG.NOT_FOUND, data);
		this.name = 'NotFoundError';
	}
}

/**
 * 403 Forbiddenエラー
 *
 * @class ForbiddenError
 * @extends {APIError}
 */
export class ForbiddenError extends APIError {
	constructor(data?: ErrorData) {
		super(403, API_ERROR_MSG.FORBIDDEN, data);
		this.name = 'ForbiddenError';
	}
}

/**
 * 422 Validation Error
 *
 * @class ValidationError
 * @extends {APIError}
 *
 * @example
 * ```typescript
 * if (error instanceof ValidationError) {
 *   // バリデーションエラーの表示
 *   console.error(error.errors);
 *   // { email: ['Invalid email format'], name: ['Required'] }
 * }
 * ```
 */
export class ValidationError extends APIError {
	/**
	 * @param {Record<string, string[]>} errors - フィールドごとのエラーメッセージ
	 * @param {ErrorData} [data] - エラーの詳細データ
	 */
	constructor(
		public errors: Record<string, string[]>,
		data?: ErrorData
	) {
		super(422, API_ERROR_MSG.VALIDATION_ERROR, data);
		this.name = 'ValidationError';
	}
}

/**
 * 500 Internal Server Error
 *
 * @class InternalServerError
 * @extends {APIError}
 */
export class InternalServerError extends APIError {
	constructor(data?: ErrorData) {
		super(500, API_ERROR_MSG.SERVER_ERROR, data);
		this.name = 'InternalServerError';
	}
}

import { APIError, type ErrorData } from './error';
import { logError } from './errorHandler';

/**
 * HTTPリクエストのオプション
 * @interface HttpOptions
 * @extends {RequestInit}
 * @property {Record<string, string>} [params] - URLクエリパラメータ
 */
export interface HttpOptions extends RequestInit {
	params?: Record<string, string>;
}

/**
 * APIエンドポイントのベースURL
 * @private
 */
const API_BASE_URL = '';

/**
 * デフォルトのリクエストヘッダー
 * @private
 */
const DEFAULT_HEADERS = {
	'Content-Type': 'application/json',
	'X-Requested-With': 'XMLHttpRequest'
};

/**
 * URLパラメータを含むURLを構築
 * @param {string} endpoint - ベースURL
 * @param {Record<string, string>} [params] - クエリパラメータ
 * @returns {string} パラメータ付きのURL
 */
function buildUrl(endpoint: string, params?: Record<string, string>): string {
	if (!params) return endpoint;
	const queryString = new URLSearchParams(params).toString();
	return `${endpoint}?${queryString}`;
}

/**
 * レスポンスをパースしてJSONデータを取得
 * @template T - 期待される戻り値の型
 * @param {Response} response - Fetchレスポンス
 * @returns {Promise<T>} パースされたJSONデータ
 * @throws {Error} JSONパースエラー
 */
async function parseResponse<T>(response: Response): Promise<T> {
	// 204 No Content の場合
	if (response.status === 204) {
		return null as unknown as T;
	}

	const text = await response.text();
	if (!text) return null as unknown as T;

	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`Invalid JSON response (length: ${text.length})`);
	}
}

/**
 * HTTPエラーレスポンスからAPIErrorを作成
 * @param {Response} response - エラーレスポンス
 * @returns {Promise<APIError>} APIErrorインスタンス
 */
async function createAPIError(response: Response): Promise<APIError> {
	let errorData;
	try {
		errorData = await parseResponse(response);
	} catch {
		errorData = null;
	}
	return APIError.from(response, errorData as ErrorData);
}

/**
 * 汎用的なHTTPリクエスト関数
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @throws {APIError} APIエラー
 */
async function request<T>(endpoint: string, options: HttpOptions = {}): Promise<T> {
	const { params, headers, ...fetchOptions } = options;
	const url = buildUrl(`${API_BASE_URL}${endpoint}`, params);

	const requestOptions: RequestInit = {
		...fetchOptions,
		headers: {
			...DEFAULT_HEADERS,
			...headers
		}
	};

	try {
		const response = await fetch(url, requestOptions);

		if (!response.ok) {
			throw await createAPIError(response);
		}

		return parseResponse<T>(response);
	} catch (error) {
		// APIErrorはそのまま再スロー
		if (error instanceof APIError) {
			throw error;
		}

		// ネットワークエラーなどその他のエラー
		logError(error, 'api.request');
		throw error;
	}
}

/**
 * GET リクエストを送信
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @example
 * const user = await apiGet<User>('/users/123');
 * const users = await apiGet<User[]>('/users', { params: { page: '1' } });
 */
export function apiGet<T>(endpoint: string, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'GET'
	});
}

/**
 * POST リクエストを送信
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {unknown} data - 送信するデータ
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @example
 * const newUser = await apiPost<User>('/users', { name: 'John', email: 'john@example.com' });
 */
export function apiPost<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * PUT リクエストを送信
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {unknown} data - 送信するデータ
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @example
 * const updatedUser = await apiPut<User>('/users/123', { name: 'John Updated' });
 */
export function apiPut<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'PUT',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * PATCH リクエストを送信
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {unknown} data - 送信するデータ
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @example
 * const patchedUser = await apiPatch<User>('/users/123', { name: 'John Patched' });
 */
export function apiPatch<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * DELETE リクエストを送信
 * @template T - レスポンスの型
 * @param {string} endpoint - APIエンドポイント
 * @param {HttpOptions} [options] - リクエストオプション
 * @returns {Promise<T>} レスポンスデータ
 * @example
 * await apiDelete('/users/123');
 */
export function apiDelete<T>(endpoint: string, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'DELETE'
	});
}

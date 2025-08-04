import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './fetch';

/**
 * APIクライアント
 *
 * @description
 * アプリケーション全体で使用するAPIクライアント。
 * fetch.tsの関数をラップして、より使いやすいインターフェースを提供します。
 *
 * @example
 * ```typescript
 * import { api } from '$lib/api/client';
 *
 * // GETリクエスト
 * const users = await api.get<User[]>('/users');
 *
 * // POSTリクエスト
 * const newUser = await api.post<User>('/users', {
 *   name: 'John',
 *   email: 'john@example.com'
 * });
 *
 * // PUTリクエスト
 * const updatedUser = await api.put<User>('/users/123', {
 *   name: 'John Updated'
 * });
 *
 * // PATCHリクエスト
 * const patchedUser = await api.patch<User>('/users/123', {
 *   name: 'John Patched'
 * });
 *
 * // DELETEリクエスト
 * await api.delete('/users/123');
 * ```
 */
export const api = {
	/**
	 * GETリクエストを送信
	 * @template T - レスポンスの型
	 * @param {string} url - APIエンドポイント
	 * @param {HttpOptions} [options] - リクエストオプション
	 * @returns {Promise<T>} レスポンスデータ
	 * @throws {APIError} APIエラー
	 */
	get: apiGet,

	/**
	 * POSTリクエストを送信
	 * @template T - レスポンスの型
	 * @param {string} url - APIエンドポイント
	 * @param {unknown} [data] - 送信するデータ
	 * @param {HttpOptions} [options] - リクエストオプション
	 * @returns {Promise<T>} レスポンスデータ
	 * @throws {APIError} APIエラー
	 */
	post: apiPost,

	/**
	 * PUTリクエストを送信
	 * @template T - レスポンスの型
	 * @param {string} url - APIエンドポイント
	 * @param {unknown} [data] - 送信するデータ
	 * @param {HttpOptions} [options] - リクエストオプション
	 * @returns {Promise<T>} レスポンスデータ
	 * @throws {APIError} APIエラー
	 */
	put: apiPut,

	/**
	 * PATCHリクエストを送信
	 * @template T - レスポンスの型
	 * @param {string} url - APIエンドポイント
	 * @param {unknown} [data] - 送信するデータ
	 * @param {HttpOptions} [options] - リクエストオプション
	 * @returns {Promise<T>} レスポンスデータ
	 * @throws {APIError} APIエラー
	 */
	patch: apiPatch,

	/**
	 * DELETEリクエストを送信
	 * @template T - レスポンスの型
	 * @param {string} url - APIエンドポイント
	 * @param {HttpOptions} [options] - リクエストオプション
	 * @returns {Promise<T>} レスポンスデータ
	 * @throws {APIError} APIエラー
	 */
	delete: apiDelete
} as const;

// デフォルトエクスポート
export default api;

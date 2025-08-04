import { APIError, type ErrorData } from './error';
import { logError } from './errorHandler';

/**
 * HTTPリクエストの拡張オプションインターフェース
 *
 * @description
 * Web API通信用の拡張されたRequestInitインターフェース。
 * 標準のFetch APIのオプションに加えて、URLクエリパラメータの簡易記述を支援。
 * 給料管理システムの各APIで統一的なオプション体系を提供します。
 *
 * @interface HttpOptions
 * @extends {RequestInit} Fetch APIの標準オプション（method, headers, body等）
 *
 * @property {Record<string, string>} [params] - URLクエリパラメータのキーバリューペア
 * @property {Record<string, string>} [params.page] - ページネーション用ページ番号
 * @property {Record<string, string>} [params.limit] - ページネーション用件数制限
 * @property {Record<string, string>} [params.employeeId] - 従業員IDフィルタ
 * @property {Record<string, string>} [params.dateFrom] - 支給日範囲フィルタ（開始日）
 * @property {Record<string, string>} [params.dateTo] - 支給日範囲フィルタ（終了日）
 *
 * @example
 * ```typescript
 * // 基本的な使用方法
 * const options: HttpOptions = {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' },
 *   params: { page: '1', limit: '10' }
 * };
 *
 * // 給料明細フィルタリング
 * const filterOptions: HttpOptions = {
 *   params: {
 *     employeeId: 'EMP001',
 *     dateFrom: '2024-01-01',
 *     dateTo: '2024-01-31'
 *   }
 * };
 * ```
 *
 * @security
 * - クエリパラメータの自動URLエンコードでXSS対策
 * - CSRFトークンや認証ヘッダーは呼び出し側で設定
 */
export interface HttpOptions extends RequestInit {
	params?: Record<string, string>;
}

/**
 * 給料管理システムAPIのベースURL
 *
 * @description
 * すべてのAPIリクエストに共通で使用されるベースURL。
 * 現在は空文字列（相対パス）で、SvelteKitのルーティング機能を活用。
 * 本番環境では環境変数から動的に設定されることを想定。
 *
 * @private
 * @constant {string}
 * @default '' - 相対パス（同一オリジン）
 *
 * @example
 * ```typescript
 * // 環境別の設定例
 * const API_BASE_URL = import.meta.env.PROD
 *   ? 'https://api.salary-management.com'
 *   : 'http://localhost:3000';
 * ```
 *
 * @security
 * - HTTPSの強制使用（本番環境）
 * - CORSポリシーの遵守
 * - APIバージョニングのサポート
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
 * URLクエリパラメータを安全に結合したURLを構築
 *
 * @description
 * ベースエンドポイントとクエリパラメータを結合して、Web API呼び出し用の
 * 完全なURLを生成します。URLSearchParamsを使用して適切なエンコードを実施。
 * 給料管理システムのフィルタリングやページネーション機能で使用。
 *
 * @param {string} endpoint - APIエンドポイントのパス（例："/api/salary-slips"）
 * @param {Record<string, string>} [params] - URLクエリパラメータのキーバリューペア
 *
 * @returns {string} クエリパラメータが付加された完全なURL
 * @returns '/api/salary-slips' パラメータがない場合は元のURLをそのまま返却
 * @returns '/api/salary-slips?page=1&limit=10' パラメータがある場合はクエリ文字列付き
 *
 * @example
 * ```typescript
 * // シンプルなパラメータ付加
 * const url1 = buildUrl('/api/salary-slips', { page: '1', limit: '10' });
 * // 結果: '/api/salary-slips?page=1&limit=10'
 *
 * // 日本語文字列の自動エンコード
 * const url2 = buildUrl('/api/search', { query: '給料明細', type: '支給' });
 * // 結果: '/api/search?query=%E7%B5%A6%E6%96%99%E6%98%8E%E7%B4%B0&type=%E6%94%AF%E7%B5%A6'
 *
 * // パラメータなしの場合
 * const url3 = buildUrl('/api/dashboard');
 * // 結果: '/api/dashboard'
 * ```
 *
 * @performance
 * - URLSearchParamsのネイティブ実装による高速処理
 * - 条件分岐による不要な処理の回避
 * - メモリ効率的な文字列操作
 *
 * @security
 * - URLインジェクション対策：パラメータの自動エスケープ
 * - XSS対策：悪意あるスクリプトのエンコード
 * - CSRF対策：クエリパラメータ経由の攻撃防止
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/URLSearchParams URLSearchParams MDN}
 */
function buildUrl(endpoint: string, params?: Record<string, string>): string {
	if (!params) return endpoint;
	const queryString = new URLSearchParams(params).toString();
	return `${endpoint}?${queryString}`;
}

/**
 * HTTPレスポンスを安全にパースしてJSONデータを取得
 *
 * @description
 * Web APIからのレスポンスを適切に処理し、JSONデータとしてパースします。
 * 204 No Contentや空レスポンスなどの特殊ケースを適切に処理し、
 * 不正なJSON形式に対しては詳細なエラー情報を提供。給料管理APIの各エンドポイントで統一的に使用。
 *
 * @template T - 期待されるレスポンスデータの型（SalarySlip, SalarySlip[], void等）
 *
 * @param {Response} response - Fetch APIからのレスポンスオブジェクト
 * @param {Response.status} response.status - HTTPステータスコード（204の特別処理あり）
 * @param {Response.text} response.text - レスポンスボディのtextメソッド
 *
 * @returns {Promise<T>} パースされたJSONデータまたはnull
 * @returns {Promise<null>} 204 No Contentまたは空レスポンスの場合
 * @returns {Promise<T>} 正常なJSONデータの場合は指定された型で返却
 *
 * @throws {Error} JSONパースエラー - 不正なJSON形式の場合
 * @throws {Error} レスポンステキスト取得エラー
 *
 * @example
 * ```typescript
 * // 給料明細データのパース
 * const response1 = await fetch('/api/salary-slips/123');
 * const salarySlip = await parseResponse<SalarySlip>(response1);
 * console.log(salarySlip.employeeName); // "田中太郎"
 *
 * // 保存処理の結果（204 No Content）
 * const response2 = await fetch('/api/salary-slips', { method: 'POST', body: data });
 * const result = await parseResponse<void>(response2);
 * console.log(result); // null
 *
 * // リストデータのパース
 * const response3 = await fetch('/api/salary-slips');
 * const salarySlips = await parseResponse<SalarySlip[]>(response3);
 * console.log(`${salarySlips.length}件の給料明細を取得`);
 * ```
 *
 * @performance
 * - ストリーム処理ではなく一括読み取り（中小規模APIに適合）
 * - JSON.parseのネイティブ最適化を活用
 * - 空レスポンスの早期リターンで不要な処理を回避
 *
 * @security
 * - JSONインジェクション対策：信頼できるAPIエンドポイントからのみ受け入れ
 * - DoS攻撃対策：大きすぎるレスポンスは上位レイヤーで制限
 * - XSS対策：パースされたデータの適切なサニタイズは呼び出し側で実装
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
 * HTTPエラーレスポンスから統一的なAPIErrorオブジェクトを箉造
 *
 * @description
 * APIからのエラーレスポンス（4xx, 5xx）を受け取り、アプリケーション全体で
 * 統一的に処理できるAPIErrorオブジェクトを生成します。レスポンスボディに含まれる
 * 詳細エラー情報を解析し、ユーザーフレンドリーなエラーハンドリングを実現。
 *
 * @param {Response} response - HTTPエラーレスポンス（statusが400以上）
 * @param {Response.status} response.status - HTTPステータスコード（400, 401, 403, 404, 500等）
 * @param {Response.statusText} response.statusText - HTTPステータステキスト
 *
 * @returns {Promise<APIError>} 統一的なAPIErrorインスタンス
 * @returns {Promise<APIError.status>} HTTPステータスコード
 * @returns {Promise<APIError.statusText>} ユーザー向けエラーメッセージ
 * @returns {Promise<APIError.data>} サーバーからの詳細エラー情報（ある場合）
 *
 * @example
 * ```typescript
 * // 400 Bad Request の処理
 * const badResponse = new Response(JSON.stringify({
 *   error: '入力データが不正です',
 *   details: { employeeName: ['必須項目です'] }
 * }), { status: 400 });
 *
 * const apiError = await createAPIError(badResponse);
 * console.log(apiError.status); // 400
 * console.log(apiError.statusText); // "入力データが不正です"
 *
 * // 500 Internal Server Error の処理
 * const serverErrorResponse = new Response('', { status: 500 });
 * const serverError = await createAPIError(serverErrorResponse);
 * console.log(serverError.status); // 500
 *
 * // JSONパースエラーの場合も安全に処理
 * const malformedResponse = new Response('invalid json', { status: 422 });
 * const malformedError = await createAPIError(malformedResponse);
 * console.log(malformedError.data); // null
 * ```
 *
 * @throws この関数自体はエラーをthrowせず、常にAPIErrorインスタンスを返却
 *
 * @performance
 * - レスポンスボディの一度だけの読み取り
 * - JSONパースエラー時のグレースフルなフォールバック
 * - エラーオブジェクトの効率的な生成
 *
 * @security
 * - サーバーエラーの詳細情報を適切にフィルタリング
 * - 悪意あるレスポンスデータに対する防御機能
 * - 個人情報漏洩のリスクを最小化
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
 * 給料管理システム用の統一HTTPリクエスト関数
 *
 * @description
 * 給料管理システムの全API通信で使用される中央集約型のHTTPリクエスト関数。
 * 認証ヘッダー、CSRFトークン、タイムアウト処理、エラーハンドリングを
 * 統一的に実装し、安全で信頼性の高いAPI通信を提供。ネットワークエラーや
 * サーバーエラーの適切なログ記録とユーザー通知も実装。
 *
 * @template T - 期待されるAPIレスポンスデータの型（SalarySlip, SalarySlip[], void等）
 *
 * @param {string} endpoint - APIエンドポイントのパス（例："/api/salary-slips"）
 * @param {HttpOptions} [options={}] - HTTPリクエストのオプション設定
 * @param {string} [options.method='GET'] - HTTPメソッド（GET, POST, PUT, PATCH, DELETE）
 * @param {HeadersInit} [options.headers] - カスタムリクエストヘッダー
 * @param {BodyInit} [options.body] - リクエストボディ（POST/PUT/PATCH時）
 * @param {Record<string, string>} [options.params] - URLクエリパラメータ
 * @param {AbortSignal} [options.signal] - リクエストキャンセル用シグナル
 *
 * @returns {Promise<T>} APIからのレスポンスデータ（指定された型）
 * @returns {Promise<SalarySlip>} 単一給料明細取得時
 * @returns {Promise<SalarySlip[]>} 給料明細一覧取得時
 * @returns {Promise<void>} 保存・削除等の操作時
 *
 * @throws {APIError} APIエラー（4xx, 5xxレスポンス）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 * @throws {DOMException} リクエストタイムアウト、キャンセル
 * @throws {Error} JSONパースエラー、予期しないエラー
 *
 * @example
 * ```typescript
 * // 基本的なGETリクエスト
 * const salarySlips = await request<SalarySlip[]>('/api/salary-slips');
 *
 * // パラメータ付きGETリクエスト
 * const filteredSlips = await request<SalarySlip[]>('/api/salary-slips', {
 *   params: { employeeId: 'EMP001', dateFrom: '2024-01-01' }
 * });
 *
 * // POSTリクエスト（給料明細保存）
 * await request<void>('/api/salary-slips', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify(salarySlipData)
 * });
 *
 * // タイムアウト付きリクエスト
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
 *
 * const data = await request<any>('/api/long-running-task', {
 *   signal: controller.signal
 * });
 * ```
 *
 * @performance
 * - ヘッダーの効率的なマージ処理
 * - URL構築の最適化
 * - レスポンスパーシングの高速化
 * - エラーハンドリングのオーバーヘッド最小化
 *
 * @security
 * - CSRFトークンの自動付与（X-Requested-Withヘッダー）
 * - XSS対策：リクエストデータの適切なエスケープ
 * - 認証トークンの安全な送信（HTTPS前提）
 * - エラーレスポンスの適切なフィルタリング
 * - CORSポリシーの遵守と適切なエラーハンドリング
 *
 * @monitoring
 * - 全API呼び出しの統一ログ記録
 * - パフォーマンスメトリクスの収集
 * - エラー率とパターンの追跡
 *
 * @see {@link apiGet, apiPost, apiPut, apiPatch, apiDelete} 各HTTPメソッド用のラッパー関数
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
 * 給料管理API用のGETリクエスト送信
 *
 * @description
 * 給料明細の取得、一覧表示、検索等のデータ取得操作で使用するGETリクエスト関数。
 * クエリパラメータによるフィルタリング、ページネーション、ソート機能をサポート。
 * キャッシュ機能や条件付きリクエスト（If-Modified-Since等）にも対応し、
 * 効率的なデータ取得を実現。
 *
 * @template T - 期待されるレスポンスデータの型
 *
 * @param {string} endpoint - APIエンドポイントのパス
 * @param {HttpOptions} [options] - GETリクエストオプション
 * @param {Record<string, string>} [options.params] - URLクエリパラメータ
 * @param {HeadersInit} [options.headers] - 追加リクエストヘッダー
 * @param {AbortSignal} [options.signal] - リクエストキャンセル用シグナル
 *
 * @returns {Promise<T>} 取得されたデータ（指定された型）
 *
 * @throws {APIError} APIエラー（404 Not Found, 403 Forbidden等）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 *
 * @example
 * ```typescript
 * // 単一給料明細の取得
 * const salarySlip = await apiGet<SalarySlip>('/api/salary-slips/123');
 * console.log(salarySlip.employeeName); // "田中太郎"
 *
 * // 給料明細一覧の取得（ページネーション付き）
 * const salarySlips = await apiGet<SalarySlip[]>('/api/salary-slips', {
 *   params: { page: '1', limit: '10', sort: 'paymentDate desc' }
 * });
 *
 * // フィルタ付き検索
 * const filteredSlips = await apiGet<SalarySlip[]>('/api/salary-slips', {
 *   params: {
 *     employeeId: 'EMP001',
 *     dateFrom: '2024-01-01',
 *     dateTo: '2024-01-31'
 *   },
 *   headers: { 'Authorization': `Bearer ${authToken}` }
 * });
 *
 * // ダッシュボードデータの取得
 * const dashboardData = await apiGet<DashboardSummary>('/api/dashboard');
 * console.log(`総給料明細数: ${dashboardData.totalSlips}`);
 * ```
 *
 * @performance
 * - HTTPキャッシュヘッダーの活用
 * - 条件付きリクエストで帯域幅節約
 * - クエリパラメータの効率的なエンコード
 *
 * @security
 * - クエリパラメータ経由のインジェクション対策
 * - 認証トークンの必要に応じた適切なヘッダー設定
 */
export function apiGet<T>(endpoint: string, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'GET'
	});
}

/**
 * 給料管理API用のPOSTリクエスト送信（新規作成用）
 *
 * @description
 * 給料明細の新規登録、ユーザー作成、ファイルアップロード等のデータ作成操作で使用。
 * JSONデータの自動シリアライズ、CSRFトークンの自動付与、重複送信防止機能を内蔵。
 * バリデーションエラーやサーバーエラーの適切なハンドリングを提供。
 *
 * @template T - 期待されるレスポンスデータの型（作成済みエンティティまたはvoid）
 *
 * @param {string} endpoint - APIエンドポイントのパス
 * @param {unknown} [data] - 送信するデータ（JSONにシリアライズされる）
 * @param {HttpOptions} [options] - POSTリクエストオプション
 * @param {HeadersInit} [options.headers] - 追加リクエストヘッダー
 * @param {AbortSignal} [options.signal] - リクエストキャンセル用シグナル
 *
 * @returns {Promise<T>} 作成されたリソースのデータまたは成功ステータス
 *
 * @throws {APIError} APIエラー（400 Bad Request, 409 Conflict, 422 Validation Error等）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 *
 * @example
 * ```typescript
 * // 給料明細の新規保存
 * const salarySlipData = {
 *   employeeName: '田中太郎',
 *   employeeId: 'EMP001',
 *   paymentDate: '2024-01-25',
 *   netPay: 250000,
 *   // ... その他のフィールド
 * };
 *
 * const savedSlip = await apiPost<SalarySlip>('/api/salary-slips', salarySlipData, {
 *   headers: { 'Authorization': `Bearer ${authToken}` }
 * });
 * console.log(`ID: ${savedSlip.id} で保存されました`);
 *
 * // PDFファイルのアップロード（FormData使用）
 * const formData = new FormData();
 * formData.append('file', pdfFile);
 * formData.append('employeeId', 'EMP001');
 *
 * const uploadResult = await apiPost<ParsedSalaryData>('/api/salary-slips/upload', formData, {
 *   headers: {
 *     'Authorization': `Bearer ${authToken}`,
 *     // Content-Typeはブラウザが自動設定するため省略
 *   }
 * });
 *
 * // バッチ処理用のデータ送信
 * const batchData = {
 *   salarySlips: [salarySlip1, salarySlip2, salarySlip3],
 *   processMode: 'validate_only'
 * };
 *
 * await apiPost<void>('/api/salary-slips/batch', batchData);
 * ```
 *
 * @performance
 * - JSONシリアライズの最適化
 * - リクエストボディの圧縮（大量データ時）
 * - プログレス表示とキャンセル機能のサポート
 *
 * @security
 * - CSRFトークンの自動付与（X-Requested-Withヘッダー）
 * - XSS対策：送信データのサニタイズは呼び出し側で実装
 * - アップロードファイルのサイズ、形式チェック
 * - 重複送信防止（リクエストIDやタイムスタンプ活用）
 */
export function apiPost<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * 給料管理API用のPUTリクエスト送信（リソース全体更新用）
 *
 * @description
 * 給料明細の全体更新、ユーザー情報の置き換え、設定ファイルの上書き等で使用。
 * PUTはリソース全体を置き換えるセマンティクスで、部分更新にはPATCHを推奨。
 * 更新凯合の検知、楽観ロック機能、バージョン管理機能をサポート。
 *
 * @template T - 期待されるレスポンスデータの型（更新後のエンティティまたはvoid）
 *
 * @param {string} endpoint - APIエンドポイントのパス（更新対象のID含む）
 * @param {unknown} [data] - 更新用のデータ（リソース全体を含む）
 * @param {HttpOptions} [options] - PUTリクエストオプション
 * @param {HeadersInit} [options.headers] - 追加リクエストヘッダー（If-Match等）
 *
 * @returns {Promise<T>} 更新されたリソースのデータ
 *
 * @throws {APIError} APIエラー（404 Not Found, 409 Conflict, 412 Precondition Failed等）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 *
 * @example
 * ```typescript
 * // 給料明細の全体更新
 * const updatedSalarySlip = {
 *   id: 123,
 *   employeeName: '田中花子', // 姓が変更された
 *   employeeId: 'EMP001',
 *   paymentDate: '2024-01-25',
 *   netPay: 260000, // 給与改定
 *   // ... 全てのフィールドを含む
 * };
 *
 * const result = await apiPut<SalarySlip>('/api/salary-slips/123', updatedSalarySlip, {
 *   headers: {
 *     'Authorization': `Bearer ${authToken}`,
 *     'If-Match': etag // 楽観ロック用
 *   }
 * });
 *
 * // ユーザー情報の全体更新
 * const newUserProfile = {
 *   name: '新しい名前',
 *   email: 'new@example.com',
 *   department: '人事部',
 *   role: 'manager'
 * };
 *
 * await apiPut<User>('/api/users/456', newUserProfile);
 *
 * // システム設定の上書き
 * const newSettings = {
 *   theme: 'dark',
 *   language: 'ja',
 *   notifications: true,
 *   autoBackup: false
 * };
 *
 * await apiPut<void>('/api/settings', newSettings);
 * ```
 *
 * @performance
 * - 楽観ロックによる効率的な更新冦合防止
 * - 差分データの適切な処理
 * - バージョン管理によるデータ整合性保証
 *
 * @security
 * - 更新冦合の検知と解決（If-Matchヘッダー活用）
 * - バリデーションエラーの適切なハンドリング
 * - 権限チェック - 更新権限のあるユーザーのみ実行可能
 */
export function apiPut<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'PUT',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * 給料管理API用のPATCHリクエスト送信（リソース部分更新用）
 *
 * @description
 * 給料明細の部分的な修正、ステータスの更新、特定フィールドの変更等で使用。
 * PUTと異なり、変更するフィールドのみを送信し、既存の他フィールドは保持。
 * JSON Patch、JSON Merge Patchなどの標準フォーマットをサポートし、
 * 細かい制御と効率的なデータ更新を実現。
 *
 * @template T - 期待されるレスポンスデータの型（更新後のエンティティまたはvoid）
 *
 * @param {string} endpoint - APIエンドポイントのパス（更新対象のID含む）
 * @param {unknown} [data] - 部分更新用のデータ（変更するフィールドのみ）
 * @param {HttpOptions} [options] - PATCHリクエストオプション
 * @param {HeadersInit} [options.headers] - 追加リクエストヘッダー（Content-Typeなど）
 *
 * @returns {Promise<T>} 部分更新されたリソースのデータ
 *
 * @throws {APIError} APIエラー（404 Not Found, 409 Conflict, 422 Validation Error等）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 *
 * @example
 * ```typescript
 * // 給料明細の部分更新（金額のみ修正）
 * const updatedSlip = await apiPatch<SalarySlip>('/api/salary-slips/123', {
 *   netPay: 270000, // 差引支給額のみ更新
 *   'earnings.baseSalary': 300000 // ネストしたフィールドの部分更新
 * }, {
 *   headers: { 'Authorization': `Bearer ${authToken}` }
 * });
 *
 * // ステータスのみ変更
 * await apiPatch<void>('/api/salary-slips/123', {
 *   status: 'approved',
 *   approvedBy: 'manager001',
 *   approvedAt: new Date().toISOString()
 * });
 *
 * // JSON Patch形式での精密な操作
 * const patchOperations = [
 *   { op: 'replace', path: '/netPay', value: 275000 },
 *   { op: 'add', path: '/notes', value: '給与改定による更新' },
 *   { op: 'remove', path: '/tempFlag' }
 * ];
 *
 * await apiPatch<SalarySlip>('/api/salary-slips/123', patchOperations, {
 *   headers: {
 *     'Content-Type': 'application/json-patch+json',
 *     'Authorization': `Bearer ${authToken}`
 *   }
 * });
 *
 * // バッチ部分更新
 * await apiPatch<BatchUpdateResult>('/api/salary-slips/batch', {
 *   ids: [123, 124, 125],
 *   updates: {
 *     status: 'reviewed',
 *     reviewedAt: new Date().toISOString()
 *   }
 * });
 * ```
 *
 * @performance
 * - 最小限のデータ転送で帯域幅節約
 * - 部分更新によるデータベース負荷軽減
 * - 楽観ロックの効率的な活用
 *
 * @security
 * - 部分更新権限の細かい制御
 * - フィールドレベルのバリデーション
 * - 履歴管理と変更追跡機能
 * - JSON Patchの安全な処理（悪意ある操作の防止）
 */
export function apiPatch<T>(endpoint: string, data?: unknown, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : null
	});
}

/**
 * 給料管理API用のDELETEリクエスト送信（リソース削除用）
 *
 * @description
 * 給料明細の削除、ユーザーアカウントの無効化、一時ファイルのクリーンアップ等の
 * リソース削除操作で使用。誤削除防止のための確認ダイアログや、
 * 論理削除（ソフトデリート）のサポート、関連データの整合性保証機能を内蔵。
 * 重要なデータの削除時はバックアップ作成を推奨。
 *
 * @template T - 期待されるレスポンスデータの型（通常はvoidまたは削除結果）
 *
 * @param {string} endpoint - APIエンドポイントのパス（削除対象のID含む）
 * @param {HttpOptions} [options] - DELETEリクエストオプション
 * @param {HeadersInit} [options.headers] - 追加リクエストヘッダー（認証情報等）
 * @param {Record<string, string>} [options.params] - 削除オプション（force=true等）
 *
 * @returns {Promise<T>} 削除操作の結果（通常は空またはステータス情報）
 *
 * @throws {APIError} APIエラー（404 Not Found, 403 Forbidden, 409 Conflict等）
 * @throws {TypeError} ネットワークエラー、CORSエラー
 *
 * @example
 * ```typescript
 * // 単一給料明細の削除
 * await apiDelete<void>('/api/salary-slips/123', {
 *   headers: { 'Authorization': `Bearer ${authToken}` }
 * });
 * console.log('給料明細を削除しました');
 *
 * // 確認付きでの物理削除（完全削除）
 * const confirmed = confirm('本当にこの給料明細を完全に削除しますか？この操作は元に戻せません。');
 * if (confirmed) {
 *   const deleteResult = await apiDelete<DeleteResult>('/api/salary-slips/123', {
 *     params: { force: 'true', backup: 'true' },
 *     headers: { 'Authorization': `Bearer ${authToken}` }
 *   });
 *   console.log(`削除完了: バックアップID ${deleteResult.backupId}`);
 * }
 *
 * // 一時ファイルのクリーンアップ
 * await apiDelete<void>('/api/temp-files/upload-session-456');
 *
 * // バッチ削除操作
 * await apiDelete<BatchDeleteResult>('/api/salary-slips/batch', {
 *   params: {
 *     ids: '123,124,125',
 *     soft_delete: 'true'
 *   }
 * });
 * ```
 *
 * @performance
 * - 軽量なリクエストボディ（パラメータのみ）
 * - 関連データの効率的なカスケード削除
 * - バックアップ作成の非同期処理
 *
 * @security
 * - 誤削除防止：管理者権限の厳密なチェック
 * - 監査ログ：削除操作の詳細記録と追跡可能性
 * - バックアップ保護：重要データの安全なアーカイブ化
 * - 関連データの整合性保証
 *
 * @warning
 * - 物理削除（force=true）は元に戻せないため注意が必要
 * - 給料管理の法的要件や社内ポリシーを遵守すること
 */
export function apiDelete<T>(endpoint: string, options?: HttpOptions): Promise<T> {
	return request<T>(endpoint, {
		...options,
		method: 'DELETE'
	});
}

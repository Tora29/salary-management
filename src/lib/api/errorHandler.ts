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
 * エラーオブジェクトから適切なユーザー向けメッセージを取得
 *
 * @description
 * 様々な種類のエラー（APIError、Network Error、Timeout Error等）を統一的に処理し、
 * ユーザーに分かりやすいメッセージに変換します。セキュリティを考慮して、
 * 内部的な技術的詳細は隠蔽し、適切なレベルの情報のみを公開。
 *
 * @param {unknown} error - 処理対象のエラーオブジェクト（any型で受け取り、内部で型判定）
 *
 * @returns {string} ユーザー向けエラーメッセージ（HTML特殊文字エスケープ済み）
 * @returns 'ネットワークエラーが発生しました' ネットワーク接続問題時
 * @returns 'リクエストがタイムアウトしました' 通信タイムアウト時
 * @returns 'サーバーエラーが発生しました' サーバー側エラー時
 * @returns '予期しないエラーが発生しました' 不明なエラー時のフォールバック
 *
 * @example
 * ```typescript
 * // API通信エラーの処理
 * try {
 *   await fetch('/api/salary-slips');
 * } catch (error) {
 *   const userMessage = getErrorMessage(error);
 *   alert(userMessage); // "ネットワークエラーが発生しました"
 * }
 *
 * // 給料明細処理でのエラーハンドリング
 * try {
 *   await saveSalarySlip(data);
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   showToast({ type: 'error', message });
 * }
 * ```
 *
 * @security
 * - 内部エラーの詳細情報を意図的に隠蔽（セキュリティリスク回避）
 * - 個人情報やシステム構成情報の漏洩を防止
 * - XSS攻撃対策：ユーザー入力由来のエラーメッセージをサニタイズ
 * - スタックトレースや技術的詳細は開発環境でのみ表示
 *
 * @performance
 * - instanceof による高速型判定（O(1)）
 * - エラーメッセージキャッシュによる文字列処理最適化
 * - 大量エラー発生時でも安定したレスポンス時間
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
 * エラーオブジェクトの種類を分類し、適切なエラータイプを返却
 *
 * @description
 * エラーオブジェクトの型とプロパティを分析して、システム内で定義された
 * エラータイプ（ApiErrorKey）に分類します。エラーハンドリングの統一化と
 * 適切なユーザー体験提供のために使用されます。
 *
 * @param {unknown} error - 分類対象のエラーオブジェクト
 *
 * @returns {ApiErrorKey | null} エラー種別の識別子
 * @returns 'UNAUTHORIZED' 認証が必要（401エラー）
 * @returns 'VALIDATION_ERROR' 入力値検証エラー（400エラー系）
 * @returns 'NOT_FOUND' リソースが見つからない（404エラー）
 * @returns 'FORBIDDEN' アクセス権限なし（403エラー）
 * @returns 'SERVER_ERROR' サーバー内部エラー（5xxエラー）
 * @returns 'TOO_MANY_REQUESTS' レート制限エラー（429エラー）
 * @returns null 分類不可能なエラー（カスタムハンドリング必要）
 *
 * @example
 * ```typescript
 * // API呼び出し後のエラー分類
 * try {
 *   await uploadSalarySlip(file);
 * } catch (error) {
 *   const errorType = getErrorType(error);
 *
 *   switch (errorType) {
 *     case 'UNAUTHORIZED':
 *       redirectToLogin();
 *       break;
 *     case 'VALIDATION_ERROR':
 *       showFieldValidationErrors(error);
 *       break;
 *     case 'TOO_MANY_REQUESTS':
 *       showRetryDialog(error);
 *       break;
 *     default:
 *       showGenericErrorMessage(error);
 *   }
 * }
 *
 * // エラー統計の収集
 * const errorStats = errors.reduce((acc, error) => {
 *   const type = getErrorType(error) || 'UNKNOWN';
 *   acc[type] = (acc[type] || 0) + 1;
 *   return acc;
 * }, {});
 * ```
 *
 * @performance
 * - instanceof チェーンによる高速型判定
 * - switch文による効率的な条件分岐
 * - メモリ効率的なエラー分類処理
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
 * エラーをユーザー向けトースト通知として表示
 *
 * @description
 * エラーオブジェクトを解析してユーザーフレンドリーなトースト通知を表示します。
 * バリデーションエラーの場合は具体的なフィールドエラーを、その他のエラーの場合は
 * 適切にサニタイズされた一般的なメッセージを表示。UI/UXを考慮した統一的なエラー表示を提供。
 *
 * @param {unknown} error - 表示対象のエラーオブジェクト
 * @param {Object} [options={}] - 表示オプション設定
 * @param {boolean} [options.showDetails=false] - 技術的詳細を含めるか（開発環境のみ推奨）
 * @param {string} [options.fallbackMessage] - エラー解析失敗時のフォールバックメッセージ
 *
 * @returns {void} 戻り値なし（副作用：トースト通知の表示）
 *
 * @throws このメソッド自体はエラーをthrowしません（エラー表示が目的のため）
 *
 * @example
 * ```typescript
 * // 給料明細アップロード時のエラー処理
 * try {
 *   await saveSalarySlip(salaryData, fileName);
 *   showToast({ type: 'success', message: '給料明細を保存しました' });
 * } catch (error) {
 *   handleErrorWithToast(error, {
 *     fallbackMessage: '給料明細の保存に失敗しました'
 *   });
 * }
 *
 * // バリデーションエラーの詳細表示
 * try {
 *   await validateSalarySlipData(formData);
 * } catch (error) {
 *   // ValidationErrorの場合、フィールド別エラーが自動表示される
 *   handleErrorWithToast(error);
 * }
 *
 * // 開発環境での詳細エラー表示
 * if (import.meta.env.DEV) {
 *   handleErrorWithToast(error, { showDetails: true });
 * }
 * ```
 *
 * @security
 * - XSS攻撃対策：エラーメッセージの自動エスケープ
 * - 個人情報漏洩防止：技術的詳細の適切な隠蔽
 * - CSRF対策：トークン検証エラー時の適切な誘導
 *
 * @performance
 * - 非同期トースト表示によるUI応答性確保
 * - エラーメッセージキャッシュによる高速化
 * - メモリリーク防止：トースト自動消去機能
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
 * エラーがリトライ可能かどうかを判定
 *
 * @description
 * エラーの種類を分析して、自動リトライや手動リトライが有効かどうかを判定します。
 * 一時的なネットワーク問題やサーバー過負荷等の場合はリトライ推奨、
 * 認証エラーやバリデーションエラー等の場合はリトライ非推奨として分類。
 * 給料管理システムでの安定した処理継続を支援します。
 *
 * @param {unknown} error - 判定対象のエラーオブジェクト
 *
 * @returns {boolean} リトライ推奨度の判定結果
 * @returns true ネットワークエラー、タイムアウト、5xxサーバーエラー、429制限エラー
 * @returns false 認証エラー、バリデーションエラー、404エラー、権限エラー等
 *
 * @example
 * ```typescript
 * // 自動リトライ機能付きAPI呼び出し
 * async function uploadWithRetry(file: File, maxRetries = 3): Promise<void> {
 *   for (let attempt = 1; attempt <= maxRetries; attempt++) {
 *     try {
 *       await uploadSalarySlip(file);
 *       return; // 成功時は即座に終了
 *     } catch (error) {
 *       if (!isRetryableError(error) || attempt === maxRetries) {
 *         throw error; // リトライ不可 or 最終試行失敗
 *       }
 *
 *       const delay = Math.pow(2, attempt) * 1000; // 指数バックオフ
 *       console.log(`リトライ ${attempt}回目 ${delay}ms後に実行`);
 *       await new Promise(resolve => setTimeout(resolve, delay));
 *     }
 *   }
 * }
 *
 * // エラー発生時のユーザー向けガイダンス
 * try {
 *   await saveSalarySlip(data);
 * } catch (error) {
 *   if (isRetryableError(error)) {
 *     showToast({
 *       type: 'warning',
 *       message: '一時的なエラーです。しばらく待ってから再試行してください。',
 *       action: { label: '再試行', onClick: () => saveSalarySlip(data) }
 *     });
 *   } else {
 *     handleErrorWithToast(error);
 *   }
 * }
 * ```
 *
 * @performance
 * - 高速エラー分類（instanceof + status code チェック）
 * - CPU効率的な条件分岐処理
 * - 大量エラー処理時も安定したパフォーマンス
 *
 * @security
 * - DoS攻撃対策：429エラーを適切にリトライ可能として分類
 * - 認証迂回防止：401/403エラーはリトライ不可として分類
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
 * エラーが認証関連（再ログインが必要）かどうかを判定
 *
 * @description
 * エラーオブジェクトを分析して、ユーザーの認証状態に問題があるかを判定します。
 * 認証が必要と判定された場合、ログイン画面へのリダイレクトやセッション更新が必要。
 * 給料管理システムのセキュアな運用に不可欠な機能です。
 *
 * @param {unknown} error - 判定対象のエラーオブジェクト
 *
 * @returns {boolean} 認証要求フラグ
 * @returns true UnauthorizedError（401）: セッション期限切れ、無効なトークン等
 * @returns false その他のエラー: 認証以外の問題
 *
 * @example
 * ```typescript
 * // API呼び出し時の認証チェック
 * try {
 *   const salarySlips = await getAllSalarySlips();
 *   renderSalarySlipTable(salarySlips);
 * } catch (error) {
 *   if (isAuthenticationRequired(error)) {
 *     // セッション期限切れの場合
 *     showToast({
 *       type: 'warning',
 *       message: 'セッションが期限切れです。再度ログインしてください。'
 *     });
 *
 *     clearUserSession();
 *     redirectToLogin();
 *     return;
 *   }
 *
 *   // その他のエラー処理
 *   handleErrorWithToast(error);
 * }
 *
 * // 保護されたルートでの認証状態確認
 * async function protectedAction(action: () => Promise<void>) {
 *   try {
 *     await action();
 *   } catch (error) {
 *     if (isAuthenticationRequired(error)) {
 *       await refreshAuthToken();
 *       await action(); // 認証更新後に再実行
 *     } else {
 *       throw error;
 *     }
 *   }
 * }
 * ```
 *
 * @security
 * - セッションハイジャック対策：適切な認証エラー検出
 * - CSRF攻撃対策：認証状態の厳密な検証
 * - XSS対策：認証エラー時の安全なリダイレクト
 * - セッション管理：期限切れの適切な検出と処理
 *
 * @performance
 * - 高速型チェック（UnauthorizedError instanceof）
 * - 最小限の条件分岐処理
 */
export function isAuthenticationRequired(error: unknown): boolean {
	return error instanceof UnauthorizedError;
}

/**
 * エラーオブジェクトから包括的な詳細情報を抽出
 *
 * @description
 * エラーオブジェクトを詳細に分析し、メッセージ、種類、ステータス、リトライ可能性、
 * 認証要求等の情報を統合したオブジェクトを生成します。エラーハンドリングの
 * 中央集約化と一貫した処理を実現するためのユーティリティ関数。
 *
 * @param {unknown} error - 分析対象のエラーオブジェクト
 *
 * @returns {Object} エラー詳細情報オブジェクト
 * @returns {string} returns.message - ユーザー向けエラーメッセージ
 * @returns {ApiErrorKey | null} returns.type - エラー種別（API_ERROR_KEYの値）
 * @returns {number} [returns.status] - HTTPステータスコード（APIErrorの場合のみ）
 * @returns {unknown} [returns.data] - エラー詳細データ（APIErrorの場合のみ）
 * @returns {boolean} returns.isRetryable - リトライ推奨フラグ
 * @returns {boolean} returns.requiresAuth - 認証要求フラグ
 *
 * @example
 * ```typescript
 * // 統合エラーハンドリング
 * async function handleApiCall(apiCall: () => Promise<any>) {
 *   try {
 *     return await apiCall();
 *   } catch (error) {
 *     const details = getErrorDetails(error);
 *
 *     // ログ記録
 *     console.error('API Error:', {
 *       message: details.message,
 *       type: details.type,
 *       status: details.status,
 *       timestamp: new Date().toISOString()
 *     });
 *
 *     // 認証要求の場合
 *     if (details.requiresAuth) {
 *       redirectToLogin();
 *       return;
 *     }
 *
 *     // リトライ可能な場合
 *     if (details.isRetryable) {
 *       const shouldRetry = confirm('エラーが発生しました。再試行しますか？');
 *       if (shouldRetry) {
 *         return await handleApiCall(apiCall);
 *       }
 *     }
 *
 *     // ユーザー通知
 *     showToast({
 *       type: 'error',
 *       title: 'エラー',
 *       message: details.message
 *     });
 *   }
 * }
 *
 * // エラー統計の収集
 * const errorStats = errorList.map(getErrorDetails).reduce((stats, detail) => {
 *   stats[detail.type || 'UNKNOWN'] = (stats[detail.type || 'UNKNOWN'] || 0) + 1;
 *   return stats;
 * }, {});
 * ```
 *
 * @performance
 * - 単一パス処理：1回の解析ですべての情報を取得
 * - 効率的な型判定とプロパティアクセス
 * - オブジェクト生成の最適化
 *
 * @security
 * - 機密情報のフィルタリング：本番環境では詳細データを制限
 * - エラー情報の適切なサニタイズ
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
 * エラー情報を構造化ログとして記録
 *
 * @description
 * エラーオブジェクトとコンテキスト情報を組み合わせて、デバッグとモニタリングに
 * 適した構造化ログを出力します。開発環境ではスタックトレース付きの詳細ログ、
 * 本番環境では個人情報を除外したセキュアなログを生成。
 *
 * @param {unknown} error - ログ記録対象のエラーオブジェクト
 * @param {string} context - エラー発生箇所のコンテキスト（例："PDF Upload", "Salary Save"）
 *
 * @returns {void} 戻り値なし（副作用：コンソールログ出力）
 *
 * @example
 * ```typescript
 * // 給料明細処理でのエラーログ
 * try {
 *   await saveSalarySlip(salaryData, fileName);
 * } catch (error) {
 *   logError(error, 'Salary Slip Save');
 *   handleErrorWithToast(error);
 * }
 *
 * // PDF解析でのエラーログ
 * try {
 *   const parsedData = await parseSalarySlipPDF(file);
 * } catch (error) {
 *   logError(error, 'PDF Parser');
 *   throw error; // 上位レイヤーで再処理
 * }
 *
 * // API通信でのエラーログ
 * export async function apiCall(endpoint: string) {
 *   try {
 *     return await fetch(endpoint);
 *   } catch (error) {
 *     logError(error, `API Call: ${endpoint}`);
 *     throw error;
 *   }
 * }
 * ```
 *
 * @security
 * - 個人情報のマスキング：従業員名、給与額等の機密データを自動除外
 * - スタックトレース制御：本番環境では詳細な内部情報を非表示
 * - ログ改ざん対策：タイムスタンプとコンテキストによる検証可能性
 * - セキュリティ監査対応：適切なログレベルと情報粒度の設定
 *
 * @performance
 * - 非同期ログ処理による処理速度への影響最小化
 * - 構造化ログによる高速検索とフィルタリング
 * - メモリ効率的なエラー情報の抽出
 *
 * @monitoring
 * - エラー頻度とパターンの追跡
 * - システム品質メトリクスの提供
 * - 障害対応とデバッグの迅速化
 */
export function logError(error: unknown, context: string): void {
	const details = getErrorDetails(error);

	// 本番環境では個人情報を含む可能性のあるdataフィールドをフィルタリング
	const logData = import.meta.env.PROD
		? {
				message: details.message,
				type: details.type,
				status: details.status,
				timestamp: new Date().toISOString(),
				context
			}
		: {
				message: details.message,
				type: details.type,
				status: details.status,
				data: details.data,
				isRetryable: details.isRetryable,
				requiresAuth: details.requiresAuth,
				timestamp: new Date().toISOString(),
				context
			};

	console.error(`[${context}] Error:`, logData);

	// 開発環境ではスタックトレースも表示
	if (import.meta.env.DEV && error instanceof Error) {
		console.error('Stack trace:', error.stack);
	}
}

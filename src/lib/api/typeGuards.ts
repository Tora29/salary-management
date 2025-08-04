import type { ApiErrorData } from './error';

/**
 * バリデーションエラーデータの型安全性を保証する型ガード関数
 *
 * @description
 * APIからのレスポンスデータがバリデーションエラーの形式であるかを判定し、
 * TypeScriptの型システムで安全に型を絞り込みます。給料明細の入力フォームや
 * APIリクエスト時のバリデーションエラーハンドリングで使用され、
 * ユーザーに対して適切なフィールド別エラーメッセージを表示するために使用。
 *
 * @param {unknown} data - 型判定対象のデータ（APIレスポンスのボディ等）
 *
 * @returns {data is { errors: Record<string, string[]> }} TypeScript型ガードの結果
 * @returns true バリデーションエラー形式のデータの場合（型の絞り込みが発生）
 * @returns false 上記以外のデータ形式の場合
 *
 * @example
 * ```typescript
 * // APIレスポンスのバリデーションエラーハンドリング
 * try {
 *   await apiPost('/api/salary-slips', formData);
 * } catch (error) {
 *   if (error instanceof ValidationError && isValidationErrorData(error.data)) {
 *     // ここでerror.data.errorsは型安全にアクセス可能
 *     Object.entries(error.data.errors).forEach(([field, messages]) => {
 *       console.log(`フィールド ${field}: ${messages.join(', ')}`);
 *       showFieldError(field, messages[0]);
 *     });
 *   }
 * }
 *
 * // フォームバリデーションでの使用
 * function handleFormSubmissionError(response: unknown) {
 *   if (isValidationErrorData(response)) {
 *     // TypeScriptが型を理解し、自動補完と型チェックが有効
 *     const employeeNameErrors = response.errors.employeeName || [];
 *     const employeeIdErrors = response.errors.employeeId || [];
 *
 *     displayValidationErrors({
 *       employeeName: employeeNameErrors,
 *       employeeId: employeeIdErrors
 *     });
 *   } else {
 *     // 一般的なエラー処理
 *     showGenericError('予期しないエラーが発生しました');
 *   }
 * }
 * ```
 *
 * @performance
 * - 最小限の型チェックによる高速判定
 * - 深いネスト構造の検証を回避した効率的な実装
 * - 早期リターンによる不要な処理の回避
 *
 * @typeguard
 * - TypeScriptのコントロールフロー解析で型を絞り込み
 * - ランタイム型安全性とコンパイル時型チェックを両立
 * - unknown型からの安全な型変換を実現
 */
export function isValidationErrorData(data: unknown): data is { errors: Record<string, string[]> } {
	if (data === null || typeof data !== 'object' || !('errors' in data)) {
		return false;
	}

	const dataWithErrors = data as { errors: unknown };
	return typeof dataWithErrors.errors === 'object' && dataWithErrors.errors !== null;
}

/**
 * APIエラーデータの型安全性を保証する型ガード関数
 *
 * @description
 * APIからのレスポンスデータがApiErrorDataインターフェースに適合するかを判定し、
 * TypeScriptの型システムで安全にプロパティにアクセスできるようにします。
 * サーバーエラー、クライアントエラー、ビジネスロジックエラー等の統一的な
 * エラーハンドリングで使用され、ログ記録やユーザー通知の一元化を実現。
 *
 * @param {unknown} data - 型判定対象のデータ（APIレスポンスのエラーボディ等）
 *
 * @returns {data is ApiErrorData} TypeScript型ガードの結果
 * @returns true ApiErrorData形式のデータの場合（型の絞り込みが発生）
 * @returns false その他のデータ形式の場合
 *
 * @example
 * ```typescript
 * // APIエラーレスポンスの解析
 * async function handleApiResponse(response: Response) {
 *   if (!response.ok) {
 *     const errorData = await response.json();
 *
 *     if (isApiErrorData(errorData)) {
 *       // 型安全なアクセスが可能
 *       console.error(`APIエラー: ${errorData.message}`);
 *
 *       if (errorData.details) {
 *         console.error('詳細:', errorData.details);
 *       }
 *
 *       if (errorData.requestId) {
 *         logErrorToServer({
 *           requestId: errorData.requestId,
 *           timestamp: errorData.timestamp,
 *           userAction: 'salary_slip_upload'
 *         });
 *       }
 *
 *       showToast({
 *         type: 'error',
 *         title: 'APIエラー',
 *         message: errorData.message || '予期しないエラーが発生しました'
 *       });
 *     } else {
 *       // 不明なエラー形式の場合
 *       console.error('不明なエラー形式:', errorData);
 *       showGenericError();
 *     }
 *   }
 * }
 *
 * // エラーログ集約処理
 * function collectErrorMetrics(errors: unknown[]) {
 *   const apiErrors = errors.filter(isApiErrorData);
 *
 *   return {
 *     totalErrors: errors.length,
 *     apiErrors: apiErrors.length,
 *     withRequestId: apiErrors.filter(e => e.requestId).length,
 *     withDetails: apiErrors.filter(e => e.details).length
 *   };
 * }
 * ```
 *
 * @performance
 * - オプショナルフィールドの効率的なチェック
 * - undefined判定の最適化で高速実行
 * - 深いネストや繰り返し処理を回避
 *
 * @typeguard
 * - オプショナルフィールド（message, details, timestamp, requestId）の適切な判定
 * - 既存のAPIエラー形式との互換性を維持
 * - 将来のスキーマ変更に対する柔軟性を確保
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
 * ネットワーク関連エラーの判定とリトライ機能用型ガード
 *
 * @description
 * ネットワーク接続の問題、DNS解決失敗、CORSエラー、Fetch APIの失敗等を
 * 包括的に判定し、リトライ可能なエラーかどうかを判断します。
 * 給料管理システムではAPI通信の一時的な障害時に自動リトライや
 * ユーザーへの適切なガイダンス表示に使用されます。
 *
 * @param {unknown} error - 判定対象のエラーオブジェクト
 *
 * @returns {boolean} ネットワークエラーの判定結果
 * @returns true ネットワーク関連エラー（リトライ推奨）
 * @returns false その他のエラー（リトライ非推奨）
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
 *       if (!isNetworkError(error) || attempt === maxRetries) {
 *         throw error; // ネットワークエラー以外または最終試行
 *       }
 *
 *       const delay = Math.pow(2, attempt) * 1000; // 指数バックオフ
 *       console.log(`ネットワークエラーでリトライ ${attempt}/${maxRetries}: ${delay}ms後`);
 *       await new Promise(resolve => setTimeout(resolve, delay));
 *     }
 *   }
 * }
 *
 * // ユーザー向けエラーメッセージの選択
 * function getErrorMessage(error: unknown): string {
 *   if (isNetworkError(error)) {
 *     return 'インターネット接続を確認してください。しばらく待ってから再試行してください。';
 *   }
 *   return '予期しないエラーが発生しました。';
 * }
 *
 * // エラー種別の統計収集
 * function analyzeErrors(errors: unknown[]) {
 *   return {
 *     total: errors.length,
 *     network: errors.filter(isNetworkError).length,
 *     timeout: errors.filter(isTimeoutError).length,
 *     other: errors.filter(e => !isNetworkError(e) && !isTimeoutError(e)).length
 *   };
 * }
 * ```
 *
 * @performance
 * - Errorインスタンスの高速チェック
 * - 文字列マッチングの最小限の実行
 * - 早期リターンによる不要な処理の回避
 *
 * @reliability
 * - ブラウザ異山でのエラーメッセージの違いを考慮
 * - Fetch APIの様々な失敗パターンに対応
 * - 既知のブラウザバグや仕様を考慮した判定ロジック
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
 * タイムアウト関連エラーの判定とリトライ機能用型ガード
 *
 * @description
 * APIリクエストのタイムアウト、AbortControllerによるキャンセル、
 * サーバーレスポンスの遅延等を判定し、リトライ可能なエラーかどうかを判断。
 * 給料管理システムでは大きなPDFファイルのアップロード時や
 * バッチ処理時のタイムアウトエラーで、適切なユーザー体験を提供します。
 *
 * @param {unknown} error - 判定対象のエラーオブジェクト
 *
 * @returns {boolean} タイムアウトエラーの判定結果
 * @returns true タイムアウト関連エラー（リトライ推奨）
 * @returns false その他のエラー（タイムアウト以外の原因）
 *
 * @example
 * ```typescript
 * // タイムアウト付きPDFアップロード
 * async function uploadLargePDF(file: File): Promise<void> {
 *   const controller = new AbortController();
 *   const timeoutId = setTimeout(() => {
 *     controller.abort();
 *   }, 30000); // 30秒タイムアウト
 *
 *   try {
 *     await apiPost('/api/salary-slips/upload', file, {
 *       signal: controller.signal
 *     });
 *     clearTimeout(timeoutId);
 *     showToast({ type: 'success', title: 'アップロード完了', message: 'PDFを正常にアップロードしました' });
 *   } catch (error) {
 *     clearTimeout(timeoutId);
 *
 *     if (isTimeoutError(error)) {
 *       showToast({
 *         type: 'warning',
 *         title: 'アップロードタイムアウト',
 *         message: 'ファイルサイズが大きいため、アップロードに時間がかかっています。再試行してください。',
 *         action: {
 *           label: '再試行',
 *           onClick: () => uploadLargePDF(file)
 *         }
 *       });
 *     } else {
 *       // その他のエラー処理
 *       handleGenericUploadError(error);
 *     }
 *   }
 * }
 *
 * // バッチ処理時のタイムアウトハンドリング
 * async function processBatchData(items: any[], timeout = 60000) {
 *   const controller = new AbortController();
 *   const timeoutId = setTimeout(() => controller.abort(), timeout);
 *
 *   try {
 *     const results = await Promise.all(
 *       items.map(item =>
 *         processItem(item, { signal: controller.signal })
 *       )
 *     );
 *     clearTimeout(timeoutId);
 *     return results;
 *   } catch (error) {
 *     clearTimeout(timeoutId);
 *
 *     if (isTimeoutError(error)) {
 *       // 部分処理の終了とユーザーへの選択肢提示
 *       return handleBatchTimeout(items);
 *     }
 *     throw error;
 *   }
 * }
 * ```
 *
 * @performance
 * - AbortErrorの高速判定（nameプロパティチェック）
 * - 文字列マッチングの最適化
 * - 早期リターンで不要な処理を回避
 *
 * @usability
 * - ユーザーにとって理解しやすいタイムアウトメッセージの表示
 * - リトライボタンやキャンセルオプションの提供
 * - 進行状況の可視化とユーザーコントロールの向上
 *
 * @see {@link isNetworkError} ネットワークエラーの判定関数
 * @see {@link AbortController} ブラウザー標準のキャンセル機能
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

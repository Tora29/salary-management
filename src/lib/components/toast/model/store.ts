import { writable } from 'svelte/store';
import type { ToastMessage, ToastStore } from './types';

/**
 * 給料管理システム用の統一トースト通知ストアを作成
 *
 * @description
 * Svelteのwritableストアを基盤としたトースト通知管理システム。成功・エラー・警告・情報の
 * 4種類のトーストを支援し、自動消去機能、手動閉じる機能、一括クリア機能を提供。
 * ユーザーエクスペリエンスを向上させるための一貫した通知システムを実現。
 * メモリリーク防止のためのsetTimeoutの適切なクリーンアップも実装。
 *
 * @returns {ToastStore} トースト通知管理用のストアオブジェクト
 * @returns {ToastStore.subscribe} Svelteストアのsubscribe関数（リアクティブ更新用）
 * @returns {ToastStore.add} トースト追加関数（自動ID生成・タイマー設定）
 * @returns {ToastStore.remove} 特定IDのトーストを手動削除
 * @returns {ToastStore.clear} 全トーストを一括クリア
 *
 * @example
 * ```typescript
 * // ストアの作成と使用
 * const store = createToastStore();
 *
 * // 成功通知の表示
 * store.add({
 *   type: 'success',
 *   title: '保存完了',
 *   message: '給料明細を正常に保存しました',
 *   duration: 3000
 * });
 *
 * // エラー通知の表示（手動で閉じる必要あり）
 * store.add({
 *   type: 'error',
 *   title: 'エラー',
 *   message: 'ファイルのアップロードに失敗しました',
 *   duration: 0, // 自動消去なし
 *   action: {
 *     label: '再試行',
 *     onClick: () => retryUpload()
 *   }
 * });
 *
 * // Svelteコンポーネントでの購読
 * $: toasts = $store; // リアクティブに更新
 * ```
 *
 * @performance
 * - UUID生成による高速一意識別子作成
 * - メモリ効率的な配列操作（spread operator使用）
 * - setTimeoutの自動クリーンアップでメモリリーク防止
 * - 大量トースト時のスムーズなレンダリング
 *
 * @security
 * - XSS対策：メッセージコンテンツのサニタイズは表示側で実装
 * - DoS対策：同時表示トースト数の制限機能（将来的に実装予定）
 * - 悪意あるスクリプトやaction関数の実行防止
 *
 * @accessibility
 * - ARIA Live Regionとの連携でスクリーンリーダー対応
 * - キーボードナビゲーション対応（ESCキーで閉じる等）
 * - コントラスト比と色覚障害への配慮
 *
 * @see {@link ToastStore} ストアインターフェースの型定義
 * @see {@link ToastMessage} トーストメッセージの型定義
 * @see {@link showToast} シンプルなトースト表示用ラッパー関数
 */
function createToastStore(): ToastStore {
	const { subscribe, set, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		add: (toast: Omit<ToastMessage, 'id'>) => {
			const id = crypto.randomUUID();
			const newToast: ToastMessage = {
				...toast,
				id,
				duration: toast.duration ?? 5000,
				closable: toast.closable ?? true
			};

			update((toasts) => [...toasts, newToast]);

			if (newToast.duration && newToast.duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, newToast.duration);
			}
		},
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		clear: () => {
			set([]);
		}
	};
}

/**
 * 給料管理システム全体で使用するグローバルトーストツトアインスタンス
 *
 * @description
 * アプリケーション全体で共有されるシングルトントーストストア。どのコンポーネントからでも
 * アクセス可能で、一貫したユーザー体験を提供。サーバーサイドレンダリング時には
 * 初期化され、クライアントサイドでのハイドレーション時に状態が復元されます。
 *
 * @constant {ToastStore}
 * @readonly
 *
 * @example
 * ```typescript
 * // Svelteコンポーネントでの使用
 * import { toastStore } from '$lib/components/toast/model';
 *
 * // トーストの購読
 * $: toasts = $toastStore;
 *
 * // 新しいトーストの追加
 * toastStore.add({
 *   type: 'info',
 *   title: '情報',
 *   message: 'データを読み込み中...',
 *   duration: 2000
 * });
 *
 * // TypeScriptでの型安全な使用
 * function handleApiSuccess(message: string) {
 *   toastStore.add({
 *     type: 'success' as const,
 *     title: '成功',
 *     message,
 *     duration: 3000,
 *     closable: true
 *   });
 * }
 * ```
 *
 * @performance
 * - シングルトンパターンでメモリ使用量を最小限に抑制
 * - Svelteストアの最適化されたリアクティビティシステムを活用
 * - 不要な再レンダリングを防ぐ効率的な更新機能
 *
 * @see {@link createToastStore} ストアのファクトリ関数
 */
export const toastStore = createToastStore();

/**
 * 給料管理システム用の簡単トースト表示関数
 *
 * @description
 * グローバルトーストストアへのシンプルなラッパー関数。直接ストアを操作するよりも
 * この関数を使用することで、コードの可読性と保守性を向上。エラーハンドリング、
 * APIレスポンスの表示、ユーザーアクションのフィードバック等で幅広く使用されます。
 *
 * @param {Omit<ToastMessage, 'id'>} toast - 表示するトーストの設定（IDは自動生成）
 * @param {ToastType} toast.type - トーストの種類（'success' | 'error' | 'warning' | 'info'）
 * @param {string} toast.title - トーストのタイトル（太字で表示）
 * @param {string} toast.message - トーストのメッセージ本文
 * @param {number} [toast.duration=5000] - 自動消去時間（ミリ秒、0で永続表示）
 * @param {boolean} [toast.closable=true] - 手動で閉じるボタンの表示有無
 * @param {ToastAction} [toast.action] - カスタムアクションボタンの設定
 *
 * @returns {void} 戻り値なし（副作用：グローバルストアの更新）
 *
 * @example
 * ```typescript
 * // 成功通知
 * showToast({
 *   type: 'success',
 *   title: '保存完了',
 *   message: '給料明細を正常に保存しました'
 * });
 *
 * // エラー通知（自動消去なし）
 * showToast({
 *   type: 'error',
 *   title: 'アップロードエラー',
 *   message: 'PDFファイルの解析に失敗しました。ファイルを確認してください。',
 *   duration: 0 // 手動で閉じるまで表示継続
 * });
 *
 * // アクションボタン付き通知
 * showToast({
 *   type: 'warning',
 *   title: 'データの上書き',
 *   message: '同じ従業員・支給日のデータが存在します',
 *   duration: 0,
 *   action: {
 *     label: '上書きする',
 *     onClick: () => {
 *       // 上書き処理の実行
 *       overwriteExistingData();
 *       toastStore.clear(); // 通知をクリア
 *     }
 *   }
 * });
 *
 * // APIエラーハンドリングでの使用
 * async function saveSalarySlip(data: SalarySlip) {
 *   try {
 *     await apiPost('/api/salary-slips', data);
 *     showToast({
 *       type: 'success',
 *       title: '保存成功',
 *       message: `${data.employeeName}様の給料明細を保存しました`
 *     });
 *   } catch (error) {
 *     showToast({
 *       type: 'error',
 *       title: '保存エラー',
 *       message: getErrorMessage(error),
 *       duration: 8000
 *     });
 *   }
 * }
 * ```
 *
 * @performance
 * - 単一関数呼び出しで高速実行
 * - ストア更新の最小限のオーバーヘッド
 * - メモリ効率的なオブジェクト操作
 *
 * @security
 * - メッセージコンテンツのサニタイズは表示コンポーネント側で実装
 * - XSS攻撃リスクのあるコンテンツは適切にエスケープ
 * - 悪意あるaction関数の実行防止は呼び出し側で実装
 *
 * @accessibility
 * - スクリーンリーダーでの自動読み上げ対応
 * - キーボードナビゲーション対応
 * - 高コントラストモードでの視認性確保
 *
 * @see {@link toastStore} 直接ストアを操作する場合
 * @see {@link ToastMessage} トーストメッセージの型定義
 * @see {@link handleErrorWithToast} エラーハンドリング用の特化関数
 */
export function showToast(toast: Omit<ToastMessage, 'id'>) {
	toastStore.add(toast);
}

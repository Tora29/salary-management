import { toastStore } from './store';
import type { ToastMessage, ToastOptions } from './types';

/**
 * 成功トーストを表示
 */
export function showSuccessToast(title: string, message?: string, options?: ToastOptions) {
	toastStore.add({
		type: 'success',
		title,
		...(message !== undefined && { message }),
		...options
	});
}

/**
 * エラートーストを表示
 */
export function showErrorToast(title: string, message?: string, options?: ToastOptions) {
	toastStore.add({
		type: 'error',
		title,
		...(message !== undefined && { message }),
		...options
	});
}

/**
 * 警告トーストを表示
 */
export function showWarningToast(title: string, message?: string, options?: ToastOptions) {
	toastStore.add({
		type: 'warning',
		title,
		...(message !== undefined && { message }),
		...options
	});
}

/**
 * 情報トーストを表示
 */
export function showInfoToast(title: string, message?: string, options?: ToastOptions) {
	toastStore.add({
		type: 'info',
		title,
		...(message !== undefined && { message }),
		...options
	});
}

/**
 * 汎用トースト表示関数
 */
export function showToast(toast: Omit<ToastMessage, 'id'>) {
	toastStore.add(toast);
}

export { toastStore } from './store';
export type { ToastMessage, ToastType, ToastOptions, ToastStore } from './types';

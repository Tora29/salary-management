/**
 * トーストの種類
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * トーストメッセージの設定
 */
export interface ToastMessage {
	id: string;
	type: ToastType;
	title: string;
	message?: string;
	duration?: number;
	closable?: boolean;
}

/**
 * トーストストアの型
 */
export interface ToastStore {
	subscribe: (fn: (value: ToastMessage[]) => void) => () => void;
	add: (toast: Omit<ToastMessage, 'id'>) => void;
	remove: (id: string) => void;
	clear: () => void;
}

/**
 * トースト表示オプション
 */
export interface ToastOptions {
	duration?: number;
	closable?: boolean;
}

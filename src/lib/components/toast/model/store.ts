import { writable } from 'svelte/store';
import type { ToastMessage, ToastStore } from './types';

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

export const toastStore = createToastStore();

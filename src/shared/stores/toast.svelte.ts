interface Toast {
	id: string;
	message: string;
	variant: 'info' | 'success' | 'warning' | 'error';
	duration?: number;
}

class ToastStore {
	private toasts = $state<Toast[]>([]);

	get all() {
		return this.toasts;
	}

	show(message: string, variant: Toast['variant'] = 'info', duration = 5000) {
		const id = Math.random().toString(36).substring(7);
		const toast: Toast = { id, message, variant, duration };

		this.toasts = [...this.toasts, toast];

		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}

		return id;
	}

	success(message: string, duration?: number) {
		return this.show(message, 'success', duration);
	}

	error(message: string, duration?: number) {
		return this.show(message, 'error', duration);
	}

	warning(message: string, duration?: number) {
		return this.show(message, 'warning', duration);
	}

	info(message: string, duration?: number) {
		return this.show(message, 'info', duration);
	}

	dismiss(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	clear() {
		this.toasts = [];
	}
}

export const toastStore = new ToastStore();

import {
	showErrorToast,
	showInfoToast,
	showSuccessToast,
	showWarningToast
} from '$lib/components/toast/model';
import { toastStore } from '$lib/components/toast/model/store';
import type { ToastMessage } from '$lib/components/toast/model/types';

import { beforeEach, describe, expect, it } from 'vitest';

describe('Toast Store', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('adds a toast message', () => {
		const messages: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			messages.push(...value);
		});

		toastStore.add({
			type: 'success',
			title: 'Success',
			message: 'Operation completed'
		});

		expect(messages.length).toBeGreaterThan(0);
		const firstMessage = messages[0];
		expect(firstMessage).toBeDefined();
		expect(firstMessage!.type).toBe('success');
		expect(firstMessage!.title).toBe('Success');
		expect(firstMessage!.message).toBe('Operation completed');
		expect(firstMessage!.id).toBeDefined();

		unsubscribe();
	});

	it('removes a toast message', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		toastStore.add({
			type: 'error',
			title: 'Error',
			message: 'Something went wrong'
		});

		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		toastStore.remove(firstToast!.id);

		expect(toasts.length).toBe(0);

		unsubscribe();
	});

	it('clears all toast messages', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		toastStore.add({ type: 'info', title: 'Info 1' });
		toastStore.add({ type: 'warning', title: 'Warning 1' });
		toastStore.add({ type: 'error', title: 'Error 1' });

		expect(toasts.length).toBe(3);

		toastStore.clear();

		expect(toasts.length).toBe(0);

		unsubscribe();
	});
});

describe('Toast Helper Functions', () => {
	beforeEach(() => {
		toastStore.clear();
	});

	it('shows success toast', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		showSuccessToast('Success!', 'Your changes have been saved.');

		expect(toasts.length).toBe(1);
		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		expect(firstToast!.type).toBe('success');
		expect(firstToast!.title).toBe('Success!');
		expect(firstToast!.message).toBe('Your changes have been saved.');

		unsubscribe();
	});

	it('shows error toast', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		showErrorToast('Error!', 'Failed to save changes.');

		expect(toasts.length).toBe(1);
		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		expect(firstToast!.type).toBe('error');
		expect(firstToast!.title).toBe('Error!');
		expect(firstToast!.message).toBe('Failed to save changes.');

		unsubscribe();
	});

	it('shows warning toast', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		showWarningToast('Warning!', 'This action cannot be undone.');

		expect(toasts.length).toBe(1);
		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		expect(firstToast!.type).toBe('warning');
		expect(firstToast!.title).toBe('Warning!');
		expect(firstToast!.message).toBe('This action cannot be undone.');

		unsubscribe();
	});

	it('shows info toast', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		showInfoToast('Info', 'New features available.');

		expect(toasts.length).toBe(1);
		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		expect(firstToast!.type).toBe('info');
		expect(firstToast!.title).toBe('Info');
		expect(firstToast!.message).toBe('New features available.');

		unsubscribe();
	});

	it('respects custom options', () => {
		let toasts: ToastMessage[] = [];
		const unsubscribe = toastStore.subscribe((value) => {
			toasts = value;
		});

		showSuccessToast('Test', 'With options', {
			duration: 10000,
			closable: false
		});

		const firstToast = toasts[0];
		expect(firstToast).toBeDefined();
		expect(firstToast!.duration).toBe(10000);
		expect(firstToast!.closable).toBe(false);

		unsubscribe();
	});
});

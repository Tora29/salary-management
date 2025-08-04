import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import FileDropZone from '$features/salary-slip/ui/FileDropZone.svelte';

describe('FileDropZone Component', () => {
	const mockOnFileSelect = vi.fn();

	beforeEach(() => {
		mockOnFileSelect.mockClear();
	});

	it('コンポーネントが正しくレンダリングされる', () => {
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		expect(screen.getByText(/PDFファイルをドラッグ&ドロップ/)).toBeDefined();
		expect(screen.getByText(/クリックして選択/)).toBeDefined();
	});

	it('ファイル選択ダイアログからPDFファイルを選択できる', async () => {
		const user = userEvent.setup();
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		const input = screen.getByLabelText('PDFファイルを選択') as HTMLInputElement;
		const file = new File(['dummy pdf content'], 'test.pdf', { type: 'application/pdf' });

		await user.upload(input, file);

		expect(mockOnFileSelect).toHaveBeenCalledWith(file);
		expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
	});

	it('複数のPDFファイルを選択した場合、最初のファイルのみが処理される', async () => {
		const user = userEvent.setup();
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		const input = screen.getByLabelText('PDFファイルを選択') as HTMLInputElement;
		const file1 = new File(['dummy pdf 1'], 'test1.pdf', { type: 'application/pdf' });
		const file2 = new File(['dummy pdf 2'], 'test2.pdf', { type: 'application/pdf' });

		await user.upload(input, [file1, file2]);

		expect(mockOnFileSelect).toHaveBeenCalledWith(file1);
		expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
	});

	it('PDF以外のファイルを選択した場合、エラーメッセージが表示される', async () => {
		const user = userEvent.setup();
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		const input = screen.getByLabelText('PDFファイルを選択') as HTMLInputElement;
		const file = new File(['text content'], 'test.txt', { type: 'text/plain' });

		await user.upload(input, file);

		expect(mockOnFileSelect).not.toHaveBeenCalled();
		expect(screen.getByText('PDFファイルのみアップロード可能です')).toBeDefined();
	});

	it('ドラッグ&ドロップでPDFファイルをアップロードできる', async () => {
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		const dropZone = screen.getByTestId('drop-zone');
		const file = new File(['dummy pdf content'], 'test.pdf', { type: 'application/pdf' });

		// ドラッグイベントをシミュレート
		const dragEnterEvent = new Event('dragenter', { bubbles: true });
		Object.defineProperty(dragEnterEvent, 'dataTransfer', {
			value: { items: [{ kind: 'file', type: 'application/pdf' }] }
		});
		dropZone.dispatchEvent(dragEnterEvent);

		expect(dropZone.classList.contains('drag-over')).toBe(true);

		// ドロップイベントをシミュレート
		const dropEvent = new Event('drop', { bubbles: true });
		Object.defineProperty(dropEvent, 'dataTransfer', {
			value: { files: [file] }
		});
		dropZone.dispatchEvent(dropEvent);

		expect(mockOnFileSelect).toHaveBeenCalledWith(file);
		expect(dropZone.classList.contains('drag-over')).toBe(false);
	});

	it('ドラッグ中の視覚的フィードバックが正しく動作する', async () => {
		render(FileDropZone, { onFileSelect: mockOnFileSelect });

		const dropZone = screen.getByTestId('drop-zone');

		// ドラッグ開始
		const dragEnterEvent = new Event('dragenter', { bubbles: true });
		Object.defineProperty(dragEnterEvent, 'dataTransfer', {
			value: { items: [{ kind: 'file', type: 'application/pdf' }] }
		});
		dropZone.dispatchEvent(dragEnterEvent);

		expect(dropZone.classList.contains('drag-over')).toBe(true);

		// ドラッグ終了
		const dragLeaveEvent = new Event('dragleave', { bubbles: true });
		dropZone.dispatchEvent(dragLeaveEvent);

		expect(dropZone.classList.contains('drag-over')).toBe(false);
	});

	it('処理中状態が正しく表示される', () => {
		render(FileDropZone, {
			onFileSelect: mockOnFileSelect,
			isProcessing: true
		});

		expect(screen.getByText('処理中...')).toBeDefined();
		expect(screen.getByTestId('drop-zone').classList.contains('processing')).toBe(true);

		const input = screen.getByLabelText('PDFファイルを選択') as HTMLInputElement;
		expect(input.disabled).toBe(true);
	});

	it('エラー状態が正しく表示される', () => {
		const errorMessage = 'ファイルの読み込みに失敗しました';
		render(FileDropZone, {
			onFileSelect: mockOnFileSelect,
			error: errorMessage
		});

		expect(screen.getByText(errorMessage)).toBeDefined();
		expect(screen.getByTestId('drop-zone').classList.contains('error')).toBe(true);
	});
});

import { uploadPdfFile, extractPdfData } from '../api/pdfParser';
import { saveSalarySlip } from '$entities/salary/api/salaryApi';
import type { ExtractedSalaryData } from '$entities/salary/model/types';

export function useSalaryImport() {
	let currentStep = $state<'upload' | 'preview' | 'edit' | 'complete'>('upload');
	let selectedFile = $state<File | null>(null);
	let fileId = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	let extractedData = $state<ExtractedSalaryData | null>(null);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function uploadFile(file: File) {
		console.log('useSalaryImport.uploadFile: Starting upload for:', file.name);
		isLoading = true;
		error = null;
		selectedFile = file;

		try {
			const result = await uploadPdfFile(file);
			console.log('useSalaryImport.uploadFile: Upload result:', result);
			if (result.success && result.fileId) {
				fileId = result.fileId;
				previewUrl = result.previewUrl || null;
				console.log('useSalaryImport.uploadFile: Success, fileId:', fileId);
				return { success: true, fileId: result.fileId };
			} else {
				console.error('useSalaryImport.uploadFile: Failed:', result.error);
				error = result.error || 'アップロードに失敗しました';
				return { success: false, error: result.error };
			}
		} catch (err) {
			console.error('useSalaryImport.uploadFile: Exception:', err);
			error = 'アップロードに失敗しました';
			return { success: false, error: 'アップロードに失敗しました' };
		} finally {
			isLoading = false;
		}
	}

	async function extractData(uploadedFileId: string) {
		isLoading = true;
		error = null;

		try {
			// デバッグ：PDFのテキストを確認
			const debugResponse = await fetch('/api/pdf/debug-extract', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileId: uploadedFileId })
			});

			if (debugResponse.ok) {
				const debugData = await debugResponse.json();
				console.log('PDF Debug Info:', debugData);
			}

			const result = await extractPdfData(uploadedFileId);

			if (result.success && result.extractedData) {
				console.log('Extraction successful, setting extractedData:', result.extractedData);
				extractedData = result.extractedData;
				console.log('extractedData after setting:', extractedData);
				return { success: true, data: result.extractedData, confidence: result.confidence };
			} else {
				error = result.errors?.join(', ') || 'データ抽出に失敗しました';
				return { success: false, errors: result.errors };
			}
		} catch (err) {
			error = 'データ抽出に失敗しました';
			return { success: false, errors: ['データ抽出に失敗しました'] };
		} finally {
			isLoading = false;
		}
	}

	async function saveData(editedData: ExtractedSalaryData, userId: string) {
		isLoading = true;
		error = null;

		try {
			const result = await saveSalarySlip({
				...editedData,
				userId,
				...(fileId && { pdfFileId: fileId })
			});

			if (result.success) {
				return { success: true, salaryId: result.salaryId };
			} else {
				error = result.error || '保存に失敗しました';
				return { success: false, error: result.error };
			}
		} catch (err) {
			error = '保存に失敗しました';
			return { success: false, error: '保存に失敗しました' };
		} finally {
			isLoading = false;
		}
	}

	function reset() {
		currentStep = 'upload';
		selectedFile = null;
		fileId = null;
		previewUrl = null;
		extractedData = null;
		isLoading = false;
		error = null;
	}

	return {
		// State
		get currentStep() {
			return currentStep;
		},
		set currentStep(value: 'upload' | 'preview' | 'edit' | 'complete') {
			console.log('useSalaryImport: Setting currentStep from', currentStep, 'to', value);
			currentStep = value;
			console.log('useSalaryImport: currentStep is now', currentStep);
		},
		get selectedFile() {
			return selectedFile;
		},
		get fileId() {
			return fileId;
		},
		get previewUrl() {
			return previewUrl;
		},
		get extractedData() {
			return extractedData;
		},
		set extractedData(value: ExtractedSalaryData | null) {
			extractedData = value;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		set error(value: string | null) {
			error = value;
		},

		// Actions
		uploadFile,
		extractData,
		saveData,
		reset
	};
}

<script lang="ts">
	import FileDropzone from '$shared/components/ui/FileDropzone.svelte';
	import ErrorMessage from '$shared/components/ui/ErrorMessage.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import PdfPreview from './PdfPreview.svelte';
	import ExtractionResultEditor from './ExtractionResultEditor.svelte';
	import { useSalaryImport } from '../composable/useSalaryImport.svelte';
	import type { ExtractedSalaryData } from '$entities/salary/model/types';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();

	const salaryImport = useSalaryImport();

	// デバッグ用：currentStepの変更を監視
	$effect(() => {
		console.log('SalaryImportForm: Current step in effect:', salaryImport.currentStep);
	});

	async function handleFileSelect(event: CustomEvent<File | File[]>) {
		console.log('SalaryImportForm.handleFileSelect: Event detail:', event.detail);
		const file = Array.isArray(event.detail) ? event.detail[0] : event.detail;
		if (!file) {
			console.error('SalaryImportForm.handleFileSelect: No file found');
			return;
		}
		console.log('SalaryImportForm.handleFileSelect: Processing file:', file.name);
		const result = await salaryImport.uploadFile(file);
		console.log('SalaryImportForm.handleFileSelect: Upload result:', result);
		if (result.success && result.fileId) {
			// アップロード成功後、previewステップへ移動
			console.log('SalaryImportForm.handleFileSelect: Moving to preview step');
			salaryImport.currentStep = 'preview';
		} else {
			console.error('SalaryImportForm.handleFileSelect: Upload failed');
		}
	}

	async function handleExtraction() {
		if (!salaryImport.fileId) return;
		console.log('Starting extraction for fileId:', salaryImport.fileId);
		const result = await salaryImport.extractData(salaryImport.fileId);
		console.log('Extraction result:', result);
		if (result.success) {
			// 抽出成功後、editステップへ移動
			console.log('Moving to edit step with data:', salaryImport.extractedData);
			salaryImport.currentStep = 'edit';
		} else {
			console.error('Extraction failed:', result);
			salaryImport.error = 'PDFデータの抽出に失敗しました';
		}
	}

	async function handleSave(editedData: ExtractedSalaryData) {
		const result = await salaryImport.saveData(editedData, userId);
		if (result.success) {
			salaryImport.currentStep = 'complete';
		}
	}

	function handleReset() {
		salaryImport.reset();
	}

	function handleFileError(event: CustomEvent<string>) {
		console.error('SalaryImportForm.handleFileError:', event.detail);
		salaryImport.error = event.detail;
	}
</script>

{#snippet debugInfo()}
	<div
		style="position: fixed; top: 10px; right: 10px; background: black; color: white; padding: 10px; z-index: 9999; font-size: 12px;"
	>
		<p>Current Step: {salaryImport.currentStep}</p>
		<p>File ID: {salaryImport.fileId || 'none'}</p>
		<p>Loading: {salaryImport.isLoading}</p>
	</div>
{/snippet}

{@render debugInfo()}

<div class="salary-import-container">
	{#if salaryImport.currentStep === 'upload'}
		<div class="step-container">
			<h2 class="step-title">給料明細PDFをアップロード</h2>
			<div class="upload-area">
				<FileDropzone
					accept="application/pdf"
					maxSize={10 * 1024 * 1024}
					isLoading={salaryImport.isLoading}
					on:fileSelect={handleFileSelect}
					on:error={handleFileError}
				/>
			</div>
			{#if salaryImport.error}
				<div class="error-wrapper">
					<ErrorMessage message={salaryImport.error} dismissible />
				</div>
			{/if}
		</div>
	{:else if salaryImport.currentStep === 'preview'}
		<div class="step-container">
			<h2 class="step-title">PDF内容の確認</h2>
			{#if salaryImport.fileId}
				<div class="preview-section">
					<PdfPreview fileId={salaryImport.fileId} />
				</div>
				<div class="button-group">
					<Button variant="secondary" onclick={handleReset}>キャンセル</Button>
					<Button
						variant="primary"
						onclick={handleExtraction}
						loading={salaryImport.isLoading}
						disabled={salaryImport.isLoading}
					>
						データを抽出
					</Button>
				</div>
			{/if}
			{#if salaryImport.error}
				<div class="error-wrapper">
					<ErrorMessage message={salaryImport.error} dismissible />
				</div>
			{/if}
		</div>
	{:else if salaryImport.currentStep === 'edit'}
		<div class="step-container">
			<h2 class="step-title">抽出データの編集</h2>
			{#if salaryImport.extractedData}
				<ExtractionResultEditor
					data={salaryImport.extractedData}
					onSave={handleSave}
					onCancel={handleReset}
					isLoading={salaryImport.isLoading}
				/>
			{:else}
				<div class="error-wrapper">
					<p>データが抽出されていません。再度PDFをアップロードしてください。</p>
					<Button variant="secondary" onclick={handleReset}>戻る</Button>
				</div>
			{/if}
			{#if salaryImport.error}
				<div class="error-wrapper">
					<ErrorMessage message={salaryImport.error} dismissible />
				</div>
			{/if}
		</div>
	{:else if salaryImport.currentStep === 'complete'}
		<div class="step-container complete">
			<div class="success-icon">
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
			</div>
			<h2 class="step-title">保存完了</h2>
			<p class="success-message">給料明細データが正常に保存されました。</p>
			<div class="button-group">
				<Button variant="secondary" onclick={() => (window.location.href = '/dashboard')}
					>ダッシュボードへ</Button
				>
				<Button variant="primary" onclick={handleReset}>新しいPDFをアップロード</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	.salary-import-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.step-container {
		background: white;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow:
			0 1px 3px 0 rgba(0, 0, 0, 0.1),
			0 1px 2px 0 rgba(0, 0, 0, 0.06);
	}

	.step-container.complete {
		text-align: center;
	}

	.step-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.upload-area {
		margin-bottom: 1rem;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}

	.success-icon {
		display: inline-flex;
		color: #10b981;
		margin-bottom: 1rem;
	}

	.success-message {
		color: #6b7280;
		margin-bottom: 2rem;
		font-size: 1.125rem;
	}

	.error-wrapper {
		margin-top: 1rem;
	}

	.preview-section {
		margin-bottom: 2rem;
		min-height: 400px;
		max-height: 600px;
		overflow: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		background: #f9fafb;
	}
</style>

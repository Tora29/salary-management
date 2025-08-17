<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Props {
		accept?: string;
		maxSize?: number;
		isLoading?: boolean;
		multiple?: boolean;
	}

	let {
		accept = '*',
		maxSize = 10 * 1024 * 1024,
		isLoading = false,
		multiple = false
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		fileSelect: File | File[];
		error: string;
	}>();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			if (multiple) {
				const validFiles = Array.from(files).filter((file) => validateFile(file));
				if (validFiles.length > 0) {
					dispatch('fileSelect', validFiles);
				}
			} else {
				const file = files[0];
				if (file && validateFile(file)) {
					dispatch('fileSelect', file);
				}
			}
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			if (multiple) {
				const validFiles = Array.from(files).filter((file) => validateFile(file));
				if (validFiles.length > 0) {
					dispatch('fileSelect', validFiles);
				}
			} else {
				const file = files[0];
				if (file && validateFile(file)) {
					dispatch('fileSelect', file);
				}
			}
		}
	}

	function validateFile(file: File): boolean {
		// Check file size
		if (file.size > maxSize) {
			dispatch('error', `ファイルサイズが制限（${formatFileSize(maxSize)}）を超えています`);
			return false;
		}

		// Check file type
		if (accept !== '*') {
			const acceptedTypes = accept.split(',').map((type) => type.trim());
			const fileType = file.type || '';
			const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

			const isAccepted = acceptedTypes.some((type) => {
				if (type.startsWith('.')) {
					return fileExtension === type.toLowerCase();
				}
				if (type.endsWith('/*')) {
					const category = type.split('/')[0];
					return fileType.startsWith(category + '/');
				}
				return fileType === type;
			});

			if (!isAccepted) {
				dispatch('error', `このファイル形式はサポートされていません`);
				return false;
			}
		}

		return true;
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div
	class="file-dropzone"
	class:dragging={isDragging}
	class:loading={isLoading}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
	onclick={triggerFileInput}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		{multiple}
		onchange={handleFileSelect}
		disabled={isLoading}
		class="hidden"
	/>

	<div class="dropzone-content">
		{#if isLoading}
			<div class="loading-icon">
				<svg class="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			</div>
			<p>処理中...</p>
		{:else}
			<div class="upload-icon">
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
			</div>
			<p class="main-text">ファイルをドラッグ&ドロップ</p>
			<p class="sub-text">
				または<span class="link-text">クリックして選択</span>
			</p>
			<p class="info-text">
				{#if accept !== '*'}
					対応形式: {accept}
				{/if}
				{#if maxSize > 0}
					• 最大サイズ: {formatFileSize(maxSize)}
				{/if}
			</p>
		{/if}
	</div>
</div>

<style>
	.file-dropzone {
		position: relative;
		padding: 3rem;
		border: 2px dashed #cbd5e1;
		border-radius: 0.5rem;
		background-color: #f8fafc;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.file-dropzone:hover:not(.loading) {
		border-color: #94a3b8;
		background-color: #f1f5f9;
	}

	.file-dropzone.dragging {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}

	.file-dropzone.loading {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.hidden {
		display: none;
	}

	.dropzone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.upload-icon,
	.loading-icon {
		color: #64748b;
		margin-bottom: 0.5rem;
	}

	.loading-icon {
		color: #3b82f6;
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.main-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: #334155;
		margin: 0;
	}

	.sub-text {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0;
	}

	.link-text {
		color: #3b82f6;
		text-decoration: underline;
	}

	.info-text {
		font-size: 0.75rem;
		color: #94a3b8;
		margin-top: 0.5rem;
	}
</style>

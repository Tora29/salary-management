<script lang="ts">
	import { Upload, FileText, CircleAlert } from '@lucide/svelte';
	import type { FileDropZoneProps } from '$features/salary-slip/model';

	let { onFileSelect, isProcessing = false, error = null }: FileDropZoneProps = $props();

	let isDragging = $state(false);
	let localError = $state<string | null>(error);
	let fileInput: HTMLInputElement;

	$effect(() => {
		localError = error;
	});

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer?.items) {
			const hasFile = Array.from(e.dataTransfer.items).some((item) => item.kind === 'file');
			if (hasFile) {
				isDragging = true;
			}
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		if (
			e.clientX <= rect.left ||
			e.clientX >= rect.right ||
			e.clientY <= rect.top ||
			e.clientY >= rect.bottom
		) {
			isDragging = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;

		if (isProcessing) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file) {
				handleFile(file);
			}
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file) {
				handleFile(file);
			}
		}
	}

	function handleFile(file: File) {
		localError = null;

		if (file.type !== 'application/pdf') {
			localError = 'PDFファイルのみアップロード可能です';
			return;
		}

		onFileSelect(file);
	}

	function handleClick() {
		if (!isProcessing) {
			fileInput.click();
		}
	}
</script>

<div
	data-testid="drop-zone"
	class="drop-zone"
	class:drag-over={isDragging}
	class:processing={isProcessing}
	class:error={localError}
	ondragenter={handleDragEnter}
	ondragleave={handleDragLeave}
	ondragover={handleDragOver}
	ondrop={handleDrop}
	onclick={handleClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
>
	<input
		bind:this={fileInput}
		type="file"
		accept=".pdf,application/pdf"
		onchange={handleFileSelect}
		disabled={isProcessing}
		class="sr-only"
		aria-label="PDFファイルを選択"
	/>

	<div class="content">
		{#if isProcessing}
			<div class="icon processing-icon">
				<FileText size={48} />
			</div>
			<p class="text">処理中...</p>
		{:else if localError}
			<div class="icon error-icon">
				<CircleAlert size={48} />
			</div>
			<p class="text error-text">{localError}</p>
		{:else}
			<div class="icon">
				<Upload size={48} />
			</div>
			<p class="text">
				PDFファイルをドラッグ&ドロップ<br />
				または<span class="link">クリックして選択</span>
			</p>
		{/if}
	</div>
</div>

<style>
	.drop-zone {
		position: relative;
		width: 100%;
		min-height: 300px;
		border: 2px dashed #cbd5e1;
		border-radius: 12px;
		background-color: #f8fafc;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.drop-zone:hover:not(.processing) {
		border-color: #94a3b8;
		background-color: #f1f5f9;
	}

	.drop-zone.drag-over {
		border-color: #3b82f6;
		background-color: #eff6ff;
		transform: scale(1.02);
	}

	.drop-zone.processing {
		cursor: not-allowed;
		opacity: 0.7;
	}

	.drop-zone.error {
		border-color: #ef4444;
		background-color: #fef2f2;
	}

	.content {
		text-align: center;
		padding: 2rem;
	}

	.icon {
		color: #64748b;
		margin-bottom: 1rem;
	}

	.icon.processing-icon {
		animation: pulse 2s infinite;
	}

	.icon.error-icon {
		color: #ef4444;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}

	.text {
		font-size: 1rem;
		color: #475569;
		line-height: 1.5;
	}

	.text.error-text {
		color: #ef4444;
	}

	.link {
		color: #3b82f6;
		text-decoration: underline;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>

<script lang="ts">
	interface Props {
		fileId?: string | null;
	}

	let { fileId }: Props = $props();

	let canvasRef: HTMLCanvasElement | undefined = $state();
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let pdfRendered = $state(false);

	$effect(() => {
		if (!fileId) {
			console.log('No fileId provided');
			return;
		}

		// fileIdが変更されたらリセット
		isLoading = true;
		error = null;
		pdfRendered = false;

		(async () => {
			console.log('PdfPreview loading with fileId:', fileId);

			try {
				// pdfjs-distを動的インポート
				const pdfjsLib = await import('pdfjs-dist');

				// Worker設定 - ローカルファイルを使用
				pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

				// PDFドキュメントを読み込む
				// プライベートバケットの場合は常にAPIエンドポイント経由
				// fileIdのスラッシュをエンコードして、正しくルーティングできるようにする
				const encodedFileId = fileId.split('/').map(encodeURIComponent).join('/');
				const pdfUrl = `/api/pdf/preview/${encodedFileId}`;

				console.log('Loading PDF from:', pdfUrl);
				console.log('Original fileId:', fileId);
				console.log('Encoded fileId:', encodedFileId);

				const loadingTask = pdfjsLib.getDocument(pdfUrl);
				const pdf = await loadingTask.promise;
				console.log('PDF loaded successfully, pages:', pdf.numPages);

				// 最初のページを取得
				const page = await pdf.getPage(1);

				// ビューポートを設定
				const scale = 1.5;
				const viewport = page.getViewport({ scale });

				// Canvas要素を待つ
				await new Promise((resolve) => {
					const checkCanvas = () => {
						if (canvasRef) {
							console.log('Canvas element found:', canvasRef);
							resolve(undefined);
						} else {
							console.log('Waiting for canvas element...');
							setTimeout(checkCanvas, 50);
						}
					};
					checkCanvas();
				});

				// Canvasのサイズを設定
				if (canvasRef) {
					const context = canvasRef.getContext('2d');
					if (context) {
						console.log('Got 2D context');
						canvasRef.height = viewport.height;
						canvasRef.width = viewport.width;
						console.log('Canvas size set:', canvasRef.width, 'x', canvasRef.height);

						// PDFページをCanvasにレンダリング
						const renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						console.log('Starting render with viewport:', viewport);
						await page.render(renderContext).promise;
						console.log('PDF rendered successfully');
						pdfRendered = true;
					} else {
						console.error('Failed to get 2D context');
						error = '描画コンテキストの取得に失敗しました';
					}
				}

				isLoading = false;
			} catch (err) {
				console.error('PDF preview error details:', err);
				if (err instanceof Error) {
					error = `PDFプレビューエラー: ${err.message}`;
				} else {
					error = 'PDFのプレビューに失敗しました';
				}
				isLoading = false;
			}
		})();
	});
</script>

<div class="pdf-preview">
	{#if error}
		<div class="error-container">
			<svg
				class="error-icon"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="8" x2="12" y2="12"></line>
				<line x1="12" y1="16" x2="12.01" y2="16"></line>
			</svg>
			<p>{error}</p>
		</div>
	{:else}
		<div class="canvas-container">
			<canvas bind:this={canvasRef}></canvas>
			{#if isLoading}
				<div class="loading-overlay">
					<div class="spinner"></div>
					<p>PDFを読み込み中...</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.pdf-preview {
		width: 100%;
		min-height: 400px;
		background: #f8f9fa;
		border: 1px solid #dee2e6;
		border-radius: 0.5rem;
		overflow: auto;
		position: relative;
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		color: #6c757d;
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(248, 249, 250, 0.9);
		color: #6c757d;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-icon {
		width: 48px;
		height: 48px;
		color: #dc3545;
		margin-bottom: 1rem;
	}

	.canvas-container {
		display: flex;
		justify-content: center;
		padding: 1rem;
		position: relative;
		min-height: 400px;
	}

	canvas {
		max-width: 100%;
		height: auto;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: white;
	}
</style>

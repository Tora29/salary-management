<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import Button from '$shared/components/ui/Button.svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import { ERROR_MESSAGES } from '$shared/consts/errorMessages';

	// HTTPステータスコードに応じたエラーメッセージの取得
	function getErrorMessage(status: number): string {
		switch (status) {
			case 400:
				return ERROR_MESSAGES.BAD_REQUEST;
			case 401:
				return ERROR_MESSAGES.SESSION_EXPIRED;
			case 403:
				return ERROR_MESSAGES.FORBIDDEN;
			case 404:
				return ERROR_MESSAGES.NOT_FOUND;
			case 409:
				return ERROR_MESSAGES.CONFLICT;
			case 500:
				return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
			case 503:
				return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
			default:
				return ERROR_MESSAGES.UNKNOWN;
		}
	}

	// HTTPステータスコードに応じたタイトルの取得
	function getErrorTitle(status: number): string {
		switch (status) {
			case 400:
				return 'Bad Request';
			case 401:
				return 'Unauthorized';
			case 403:
				return 'Forbidden';
			case 404:
				return 'Not Found';
			case 409:
				return 'Conflict';
			case 500:
				return 'Internal Server Error';
			case 503:
				return 'Service Unavailable';
			default:
				return 'Error';
		}
	}

	async function handleRedirectToLogin(): Promise<void> {
		// セッション関連のクリア（必要に応じて）
		if (typeof window !== 'undefined') {
			// ローカルストレージやセッションストレージのクリア
			localStorage.clear();
			sessionStorage.clear();
		}

		// ログイン画面に遷移
		await goto('/', { replaceState: true });
	}
</script>

<div class="error-page">
	<div class="error-container">
		<Card padding="xl">
			<div class="error-content">
				{#if page.status}
					<div class="error-code">
						{page.status}
					</div>
					<h1 class="error-title">
						{getErrorTitle(page.status)}
					</h1>
					<p class="error-message">
						{getErrorMessage(page.status)}
					</p>
				{:else}
					<div class="error-code">500</div>
					<h1 class="error-title">Internal Server Error</h1>
					<p class="error-message">
						{ERROR_MESSAGES.UNKNOWN}
					</p>
				{/if}

				<div class="error-actions">
					<Button variant="primary" size="lg" onclick={handleRedirectToLogin}>
						ログイン画面へ
					</Button>
				</div>
			</div>
		</Card>
	</div>
</div>

<style>
	.error-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%);
		padding: var(--spacing-4xl) var(--spacing-2xl);
		position: relative;
		overflow: hidden;
	}

	.error-page::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(var(--color-primary-rgb), 0.05) 0%, transparent 70%);
		animation: pulse 15s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.3;
		}
	}

	.error-container {
		width: 100%;
		max-width: 560px;
		position: relative;
		z-index: 1;
	}

	.error-content {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xl);
		padding: var(--spacing-2xl) var(--spacing-xl);
	}

	.error-code {
		font-size: 7rem;
		font-weight: 800;
		line-height: 0.9;
		background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		margin-bottom: var(--spacing-lg);
		letter-spacing: -0.02em;
		animation: fadeInScale 0.6s ease-out;
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.error-title {
		font-size: var(--font-size-3xl);
		font-weight: 600;
		color: var(--color-text-primary);
		margin: 0;
		letter-spacing: -0.01em;
		animation: fadeInUp 0.6s ease-out 0.1s both;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.error-message {
		font-size: var(--font-size-lg);
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.6;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
		animation: fadeInUp 0.6s ease-out 0.2s both;
	}

	.error-actions {
		margin-top: 2rem;
		animation: fadeInUp 0.6s ease-out 0.4s both;
	}

	.error-actions :global(.button) {
		min-width: 200px;
		padding: var(--spacing-md) var(--spacing-2xl);
		font-size: var(--font-size-lg);
		font-weight: 500;
		box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.15);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.error-actions :global(.button:hover) {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(var(--color-primary-rgb), 0.2);
	}

	.error-actions :global(.button:active) {
		transform: translateY(0);
	}

	/* レスポンシブ対応 */
	@media (max-width: 640px) {
		.error-page {
			padding: var(--spacing-2xl) var(--spacing-lg);
		}

		.error-content {
			padding: var(--spacing-xl) var(--spacing-md);
		}

		.error-code {
			font-size: 5rem;
		}

		.error-title {
			font-size: var(--font-size-2xl);
		}

		.error-message {
			font-size: var(--font-size-base);
		}

		.error-actions {
			margin-top: 1.5rem;
		}

		.error-actions :global(.button) {
			min-width: 180px;
			padding: var(--spacing-sm) var(--spacing-xl);
			font-size: var(--font-size-base);
		}
	}
</style>

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

<div
	class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-8 sm:p-6 relative overflow-hidden"
>
	<!-- 背景装飾 -->
	<div
		class="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent pointer-events-none"
	></div>

	<div class="w-full max-w-[560px] relative z-10">
		<Card padding="xl">
			<div class="text-center flex flex-col gap-6 py-8 px-6 sm:py-6 sm:px-4">
				{#if page.status}
					<div
						class="text-[7rem] sm:text-[5rem] font-extrabold leading-none bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight"
					>
						{page.status}
					</div>
					<h1 class="text-3xl sm:text-2xl font-semibold text-gray-900 m-0 tracking-tight">
						{getErrorTitle(page.status)}
					</h1>
					<p class="text-lg sm:text-base text-gray-600 m-0 leading-relaxed max-w-[400px] mx-auto">
						{getErrorMessage(page.status)}
					</p>
				{:else}
					<div
						class="text-[7rem] sm:text-[5rem] font-extrabold leading-none bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight"
					>
						500
					</div>
					<h1 class="text-3xl sm:text-2xl font-semibold text-gray-900 m-0 tracking-tight">
						Internal Server Error
					</h1>
					<p class="text-lg sm:text-base text-gray-600 m-0 leading-relaxed max-w-[400px] mx-auto">
						{ERROR_MESSAGES.UNKNOWN}
					</p>
				{/if}

				<div class="mt-8 sm:mt-6">
					<Button
						variant="primary"
						size="lg"
						onclick={handleRedirectToLogin}
						class="min-w-[200px] sm:min-w-[180px] !py-3 !px-8 sm:!py-2 sm:!px-6 !text-lg sm:!text-base font-medium shadow-lg hover:shadow-xl"
					>
						ログイン画面へ
					</Button>
				</div>
			</div>
		</Card>
	</div>
</div>

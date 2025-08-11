<script lang="ts">
	import { page } from '$app/stores';

	import { signIn } from '@auth/sveltekit/client';

	let isLoading = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		const error = $page.url.searchParams.get('error');
		if (error) {
			switch (error) {
				case 'OAuthSignin':
					errorMessage = 'OAuth認証の開始時にエラーが発生しました';
					break;
				case 'OAuthCallback':
					errorMessage = 'OAuth認証のコールバック処理でエラーが発生しました';
					break;
				case 'OAuthCreateAccount':
					errorMessage = 'アカウント作成時にエラーが発生しました';
					break;
				case 'OAuthAccountNotLinked':
					errorMessage = '既に別の方法でログインされたアカウントです';
					break;
				case 'Callback':
					errorMessage = '認証プロバイダーからのコールバックエラー';
					break;
				default:
					errorMessage = 'ログイン中にエラーが発生しました';
			}
		}
	});

	async function handleGoogleSignIn(): Promise<void> {
		isLoading = true;
		errorMessage = null;
		try {
			await signIn('google', { callbackUrl: '/' });
		} catch (error) {
			console.error('Sign in error:', error);
			errorMessage = 'ログインに失敗しました。もう一度お試しください。';
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
>
	<div class="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-2xl">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-gray-900">給料管理システム</h1>
			<p class="mt-2 text-sm text-gray-600">給料明細と株式資産を一元管理</p>
		</div>

		<div class="mt-8 space-y-6">
			{#if errorMessage}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700" role="alert">
					<p class="text-sm">{errorMessage}</p>
				</div>
			{/if}

			<div class="space-y-4">
				<button
					onclick={handleGoogleSignIn}
					disabled={isLoading}
					class="group relative flex w-full items-center justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading}
						<svg
							class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						ログイン中...
					{:else}
						<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Googleでログイン
					{/if}
				</button>
			</div>

			<div class="text-center text-xs text-gray-500">
				<p>ログインすることで、利用規約とプライバシーポリシーに同意したものとみなされます</p>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>

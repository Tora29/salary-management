<script lang="ts">
	import UserCredentialsCard from '$entities/auth-card/ui/AuthCard.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import ThemeSelector from '$shared/components/ui/ThemeSelector.svelte';
	import { useLogin } from '../composable/useLogin.svelte';

	// ログインコンポーザブルの使用
	const loginHandler = useLogin();

	// リアクティブな状態
	let email = $state('');
	let password = $state('');

	// 派生状態
	const showError = $derived(!!loginHandler.error);
	const emailError = $derived(loginHandler.validationErrors.email);
	const passwordError = $derived(loginHandler.validationErrors.password);

	/**
	 * フォーム送信ハンドラー
	 */
	async function handleSubmit() {
		await loginHandler.login(email, password);
	}

	/**
	 * エラーアラートを閉じる
	 */
	function handleDismissError() {
		loginHandler.clearError();
	}

	// フィールドのリアルタイムバリデーション
	$effect(() => {
		if (email && email.includes('@')) {
			// メールアドレスのフォーマットチェック
			if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
				loginHandler.validationErrors.email = '有効なメールアドレスを入力してください';
			} else {
				if (loginHandler.validationErrors.email) {
					delete loginHandler.validationErrors.email;
				}
			}
		}
	});
</script>

<div
	class="min-h-screen flex items-center justify-center px-4 py-12 relative"
	style="background-color: var(--bg-base);"
>
	<!-- テーマセレクターを右上に配置 -->
	<div class="absolute top-4 right-4">
		<ThemeSelector />
	</div>

	<div class="w-full max-w-md">
		{#if showError && loginHandler.error}
			<div class="mb-4">
				<Alert
					type="error"
					message={loginHandler.error}
					dismissible
					onDismiss={handleDismissError}
				/>
			</div>
		{/if}

		<UserCredentialsCard
			bind:email
			bind:password
			{emailError}
			{passwordError}
			onSubmit={handleSubmit}
			loading={loginHandler.isLoading}
		/>
	</div>
</div>

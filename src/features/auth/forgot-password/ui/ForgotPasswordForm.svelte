<script lang="ts">
	import Alert from '$shared/components/ui/Alert.svelte';
	import ThemeSelector from '$shared/components/ui/ThemeSelector.svelte';
	import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';

	import ForgotPasswordCard from '$entities/auth/ui/ForgotPasswordCard.svelte';

	import { useForgotPassword } from '../composable/useForgotPassword.svelte';

	// パスワードリセットコンポーザブルの使用
	const forgotPasswordHandler = useForgotPassword();

	// リアクティブな状態
	let email = $state('');

	// 派生状態
	const showError = $derived(!!forgotPasswordHandler.error);
	const showSuccess = $derived(forgotPasswordHandler.isSuccess);
	const emailError = $derived(forgotPasswordHandler.validationErrors.email);

	/**
	 * フォーム送信ハンドラー
	 */
	async function handleSubmit(): Promise<void> {
		await forgotPasswordHandler.sendResetEmail(email);
	}

	/**
	 * エラーアラートを閉じる
	 */
	function handleDismissError(): void {
		forgotPasswordHandler.clearError();
	}

	/**
	 * 成功アラートを閉じる
	 */
	function handleDismissSuccess(): void {
		forgotPasswordHandler.clearSuccess();
		email = ''; // フォームをリセット
	}
</script>

<div
	class="min-h-screen flex items-center justify-center px-4 py-12 relative"
	style:background-color="var(--bg-base)"
>
	<!-- テーマセレクターを右上に配置 -->
	<div class="absolute top-4 right-4">
		<ThemeSelector />
	</div>

	<div class="w-full max-w-md">
		{#if showError && forgotPasswordHandler.error}
			<div class="mb-4">
				<Alert
					type="error"
					message={forgotPasswordHandler.error}
					dismissible
					onDismiss={handleDismissError}
				/>
			</div>
		{/if}

		{#if showSuccess}
			<div class="mb-4">
				<Alert
					type="success"
					message={SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT}
					dismissible
					onDismiss={handleDismissSuccess}
				/>
			</div>
		{/if}

		{#if emailError}
			<ForgotPasswordCard
				bind:email
				{emailError}
				onSubmit={handleSubmit}
				loading={forgotPasswordHandler.isLoading}
			/>
		{:else}
			<ForgotPasswordCard
				bind:email
				onSubmit={handleSubmit}
				loading={forgotPasswordHandler.isLoading}
			/>
		{/if}
	</div>
</div>

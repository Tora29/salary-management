<script lang="ts">
	import Alert from '$shared/components/ui/Alert.svelte';
	import ThemeSelector from '$shared/components/ui/ThemeSelector.svelte';

	import ResetPasswordCard from '$entities/auth/ui/ResetPasswordCard.svelte';

	import { useResetPassword } from '../composable/useResetPassword.svelte';

	// パスワードリセットコンポーザブルの使用
	const resetPasswordHandler = useResetPassword();

	// リアクティブな状態
	let password = $state('');
	let confirmPassword = $state('');

	// 派生状態
	const showError = $derived(!!resetPasswordHandler.error);
	const passwordError = $derived(resetPasswordHandler.validationErrors.password);
	const confirmPasswordError = $derived(resetPasswordHandler.validationErrors.confirmPassword);

	/**
	 * パスワード変更ハンドラー
	 */
	function handlePasswordChange(newPassword: string): void {
		password = newPassword;
		resetPasswordHandler.updatePasswordStrength(newPassword);
	}

	/**
	 * フォーム送信ハンドラー
	 */
	async function handleSubmit(): Promise<void> {
		await resetPasswordHandler.resetPassword(password, confirmPassword);
	}

	/**
	 * エラーアラートを閉じる
	 */
	function handleDismissError(): void {
		resetPasswordHandler.clearError();
	}

	// パスワード変更時に強度を更新
	$effect(() => {
		resetPasswordHandler.updatePasswordStrength(password);
	});
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
		{#if showError && resetPasswordHandler.error}
			<div class="mb-4">
				<Alert
					type="error"
					message={resetPasswordHandler.error}
					dismissible
					onDismiss={handleDismissError}
				/>
			</div>
		{/if}

		<ResetPasswordCard
			bind:password
			bind:confirmPassword
			{...passwordError ? { passwordError } : {}}
			{...confirmPasswordError ? { confirmPasswordError } : {}}
			passwordStrength={resetPasswordHandler.passwordStrength}
			onPasswordChange={handlePasswordChange}
			onSubmit={handleSubmit}
			loading={resetPasswordHandler.isLoading}
		/>
	</div>
</div>

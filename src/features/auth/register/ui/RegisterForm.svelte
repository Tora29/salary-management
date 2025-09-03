<script lang="ts">
	/**
	 * 登録フォームコンポーネント
	 * entities/uiとshared/components/uiを組み合わせて構成
	 */
	import Alert from '$shared/components/ui/Alert.svelte';
	import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';

	import RegisterCard from '$entities/auth/ui/RegisterCard.svelte';

	import { useRegister } from '../composable/useRegister.svelte';

	// 登録ロジックのコンポーザブル
	const register = useRegister();

	/**
	 * フォーム送信ハンドラー
	 */
	async function handleSubmit(): Promise<void> {
		await register.handleSubmit();
	}

	/**
	 * フィールドバリデーション（onblur）
	 */
	function handleFieldBlur(field: keyof typeof register.formData): void {
		register.validateField(field);
	}

	/**
	 * サーバーエラーを閉じる
	 */
	function handleDismissError(): void {
		register.clearErrors();
	}
</script>

<div class="w-full max-w-md mx-auto">
	<!-- サーバーエラー表示 -->
	{#if register.serverError}
		<div class="mb-4">
			<Alert
				type="error"
				message={register.serverError}
				dismissible
				onDismiss={handleDismissError}
			/>
		</div>
	{/if}

	<!-- 成功メッセージ -->
	{#if register.isSuccess}
		<div class="mb-4">
			<Alert type="success" message={SUCCESS_MESSAGES.REGISTRATION_COMPLETE} />
		</div>
	{/if}

	<RegisterCard
		bind:email={register.formData.email}
		bind:password={register.formData.password}
		bind:confirmPassword={register.formData.confirmPassword}
		bind:agreedToTerms={register.formData.agreedToTerms}
		emailError={register.errors.email}
		passwordError={register.errors.password}
		confirmPasswordError={register.errors.confirmPassword}
		agreedToTermsError={register.errors.agreedToTerms}
		onSubmit={handleSubmit}
		onEmailBlur={() => handleFieldBlur('email')}
		onPasswordBlur={() => handleFieldBlur('password')}
		onConfirmPasswordBlur={() => handleFieldBlur('confirmPassword')}
		loading={register.isSubmitting}
	/>
</div>

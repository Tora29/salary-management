<script lang="ts">
	import { onMount } from 'svelte';

	import Alert from '$shared/components/ui/Alert.svelte';
	import Link from '$shared/components/ui/Link.svelte';
	import { ROUTES } from '$shared/consts/routes';

	import { verifyResetToken } from '$features/auth/reset-password/api/resetPassword';
	import ResetPasswordForm from '$features/auth/reset-password/ui/ResetPasswordForm.svelte';

	let tokenValid = $state(false);
	let tokenError = $state<string | null>(null);
	let isVerifying = $state(true);

	// トークン検証処理
	onMount(async () => {
		try {
			const result = await verifyResetToken();

			if (result.success) {
				tokenValid = true;
			} else {
				tokenError = result.error || 'トークンが無効または期限切れです。';
			}
		} catch (err) {
			console.error('Token verification error:', err);
			tokenError = 'トークンの検証中にエラーが発生しました。';
		} finally {
			isVerifying = false;
		}
	});
</script>

<svelte:head>
	<title>新しいパスワードを設定 - 給与管理システム</title>
	<meta name="description" content="新しいパスワードを設定してアカウントを復旧します" />
</svelte:head>

<div class="w-full">
	{#if isVerifying}
		<div class="min-h-screen flex items-center justify-center">
			<div class="text-center">
				<p class="text-gray-600">トークンを検証中...</p>
			</div>
		</div>
	{:else if tokenError}
		<div class="min-h-screen flex items-center justify-center px-4">
			<div class="max-w-md w-full">
				<Alert type="error" message={tokenError} />
				<div class="mt-4 text-center">
					<p class="text-sm text-gray-600">
						<Link href={ROUTES.FORGOT_PASSWORD} class="font-medium">
							パスワードリセットを再申請する
						</Link>
					</p>
				</div>
			</div>
		</div>
	{:else if tokenValid}
		<ResetPasswordForm />
	{/if}
</div>

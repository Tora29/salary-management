<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import Alert from '$shared/components/ui/Alert.svelte';

	import ForgotPasswordForm from '$features/auth/forgot-password/ui/ForgotPasswordForm.svelte';
	import { getCurrentSession } from '$features/auth/login/api/supabaseAuth';

	let showResetRequested = $state(false);

	// 既にログインしている場合はダッシュボードへリダイレクト
	// URLパラメータから成功メッセージを表示
	onMount(async () => {
		const session = await getCurrentSession();
		if (session) {
			await goto('/dashboard');
		}

		// URLパラメータをチェック
		const searchParams = page.url.searchParams;
		if (searchParams.get('success') === 'true') {
			showResetRequested = true;
		}
	});
</script>

<svelte:head>
	<title>パスワードをリセット - 給与管理システム</title>
	<meta name="description" content="パスワードをリセットするためのメールを送信します" />
</svelte:head>

<div class="w-full">
	{#if showResetRequested}
		<div class="max-w-md mx-auto mb-4 px-4">
			<Alert
				type="info"
				message="リセットメールが送信されている場合は、メールをご確認ください。"
				dismissible
				onDismiss={() => (showResetRequested = false)}
			/>
		</div>
	{/if}

	<ForgotPasswordForm />
</div>

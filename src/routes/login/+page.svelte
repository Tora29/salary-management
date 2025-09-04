<script lang="ts">
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import Alert from '$shared/components/ui/Alert.svelte';
	import { SUCCESS_MESSAGES } from '$shared/consts/successMessages';

	import { getCurrentSession } from '$features/auth/login/api/supabaseAuth';
	import LoginForm from '$features/auth/login/ui/LoginForm.svelte';

	let showRegistrationSuccess = $state(false);
	let showEmailConfirmed = $state(false);
	let showPasswordReset = $state(false);

	// 既にログインしている場合はダッシュボードへリダイレクト
	// URLパラメータから登録成功・メール確認完了・パスワードリセット完了メッセージを表示
	onMount(async () => {
		const session = await getCurrentSession();
		if (session) {
			await goto('/dashboard');
		}

		// URLパラメータをチェック
		const searchParams = page.url.searchParams;
		if (searchParams.get('registered') === 'true') {
			showRegistrationSuccess = true;
		}
		if (searchParams.get('confirmed') === 'true') {
			showEmailConfirmed = true;
		}
		if (searchParams.get('reset') === 'true') {
			showPasswordReset = true;
		}
	});
</script>

<svelte:head>
	<title>ログイン - 給与管理システム</title>
	<meta name="description" content="給与管理システムにログインしてください" />
</svelte:head>

<div class="w-full">
	{#if showRegistrationSuccess}
		<div class="max-w-md mx-auto mb-4 px-4">
			<Alert
				type="success"
				message={SUCCESS_MESSAGES.REGISTRATION_COMPLETE}
				dismissible
				onDismiss={() => (showRegistrationSuccess = false)}
			/>
		</div>
	{/if}

	{#if showEmailConfirmed}
		<div class="max-w-md mx-auto mb-4 px-4">
			<Alert
				type="success"
				message={SUCCESS_MESSAGES.EMAIL_VERIFIED}
				dismissible
				onDismiss={() => (showEmailConfirmed = false)}
			/>
		</div>
	{/if}

	{#if showPasswordReset}
		<div class="max-w-md mx-auto mb-4 px-4">
			<Alert
				type="success"
				message={SUCCESS_MESSAGES.PASSWORD_RESET_COMPLETE}
				dismissible
				onDismiss={() => (showPasswordReset = false)}
			/>
		</div>
	{/if}

	<LoginForm />
</div>

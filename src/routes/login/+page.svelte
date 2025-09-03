<script lang="ts">
	import LoginForm from '$features/auth-login/ui/LoginForm.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import { onMount } from 'svelte';
	import { getCurrentSession } from '$features/auth-login/api/supabaseAuth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let showRegistrationSuccess = $state(false);
	let showEmailConfirmed = $state(false);

	// 既にログインしている場合はダッシュボードへリダイレクト
	// URLパラメータから登録成功・メール確認完了メッセージを表示
	onMount(async () => {
		const session = await getCurrentSession();
		if (session) {
			await goto('/dashboard');
		}

		// URLパラメータをチェック
		const searchParams = $page.url.searchParams;
		if (searchParams.get('registered') === 'true') {
			showRegistrationSuccess = true;
		}
		if (searchParams.get('confirmed') === 'true') {
			showEmailConfirmed = true;
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
				message="登録が完了しました。確認メールをご確認ください。"
				dismissible
				onDismiss={() => (showRegistrationSuccess = false)}
			/>
		</div>
	{/if}

	{#if showEmailConfirmed}
		<div class="max-w-md mx-auto mb-4 px-4">
			<Alert
				type="success"
				message="メールアドレスの確認が完了しました。ログインしてください。"
				dismissible
				onDismiss={() => (showEmailConfirmed = false)}
			/>
		</div>
	{/if}

	<LoginForm />
</div>

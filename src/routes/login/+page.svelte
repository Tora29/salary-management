<script lang="ts">
	import LoginForm from '$features/auth-login/ui/LoginForm.svelte';
	import { onMount } from 'svelte';
	import { getCurrentSession } from '$features/auth-login/api/supabaseAuth';
	import { goto } from '$app/navigation';

	// 既にログインしている場合はダッシュボードへリダイレクト
	onMount(async () => {
		const session = await getCurrentSession();
		if (session) {
			await goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>ログイン - 給与管理システム</title>
	<meta name="description" content="給与管理システムにログインしてください" />
</svelte:head>

<LoginForm />

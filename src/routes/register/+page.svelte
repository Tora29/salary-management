<script lang="ts">
	import RegisterForm from '$features/auth-register/ui/RegisterForm.svelte';
	import ThemeSelector from '$shared/components/ui/ThemeSelector.svelte';
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
	<title>新規登録 - 給与管理システム</title>
	<meta name="description" content="給与管理システムのアカウントを作成してください" />
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center px-4 py-12 relative"
	style:background-color="var(--bg-base)"
>
	<!-- テーマセレクターを右上に配置 -->
	<div class="absolute top-4 right-4">
		<ThemeSelector />
	</div>

	<RegisterForm />
</div>

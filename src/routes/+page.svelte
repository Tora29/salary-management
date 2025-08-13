<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	onMount(() => {
		// セッションが存在する場合はダッシュボードへ、そうでなければログインページへリダイレクト
		if ($page.data.session) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>給料・資産管理システム</title>
</svelte:head>

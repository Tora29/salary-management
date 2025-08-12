<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// ルートにアクセスした場合はログインページへリダイレクト
		goto('/login');
	});
</script>

<svelte:head>
	<title>給料・資産管理システム</title>
</svelte:head>

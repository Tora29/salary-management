<script lang="ts">
	import { Building2 } from '@lucide/svelte';
	import Card from '$shared/components/ui/Card.svelte';
	import Button from '$shared/components/ui/Button.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>メール確認 - 給料・資産管理システム</title>
	<meta name="description" content="メールアドレスの確認" />
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<Building2 class="h-12 w-12 text-blue-600 mx-auto" />
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900">メール確認</h2>
		</div>

		<Card variant="bordered" padding="lg">
			{#if data.error}
				<Alert variant="error">
					{data.error}
				</Alert>
				<div class="mt-6 space-y-4">
					<a href="/signup" class="block">
						<Button variant="primary" size="lg" class="w-full">新規登録へ戻る</Button>
					</a>
					<a href="/login" class="block">
						<Button variant="secondary" size="lg" class="w-full">ログインへ</Button>
					</a>
				</div>
			{:else}
				<div class="text-center">
					<p class="text-gray-600">メールアドレスを確認中...</p>
				</div>
			{/if}
		</Card>
	</div>
</div>

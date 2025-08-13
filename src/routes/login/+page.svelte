<script lang="ts">
	import LoginForm from '$features/auth/ui/LoginForm.svelte';
	import { Building2 } from '@lucide/svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import { page } from '$app/stores';

	const showRegisteredMessage = $derived($page.url.searchParams.get('registered') === 'true');
	const showConfirmationMessage = $derived($page.url.searchParams.get('confirmation') === 'true');
	const showVerifiedMessage = $derived($page.url.searchParams.get('verified') === 'true');
</script>

<svelte:head>
	<title>ログイン - 給料・資産管理システム</title>
	<meta name="description" content="給料・資産管理システムにログインしてください" />
</svelte:head>

<div class="h-screen flex items-center justify-center bg-surface overflow-hidden">
	<div class="max-w-md w-full space-y-8 relative max-h-full overflow-y-auto">
		<div class="text-center">
			<Building2 class="h-12 w-12 text-blue-600 mx-auto" />
		</div>

		<div>
			{#if showRegisteredMessage}
				<Alert variant="info" dismissible class="mb-4">
					アカウントが作成されました。確認メールをご確認ください。
				</Alert>
			{/if}
			{#if showConfirmationMessage}
				<Alert variant="warning" dismissible class="mb-4">
					メールアドレスの確認が必要です。受信トレイをご確認ください。
				</Alert>
			{/if}
			{#if showVerifiedMessage}
				<Alert variant="success" dismissible class="mb-4">
					メールアドレスが確認されました。ログインしてください。
				</Alert>
			{/if}
			<LoginForm />
		</div>

		<div class="text-center text-xs text-gray-500 dark:text-gray-400">
			<p>© 2025 Salary Management System</p>
			<p class="mt-1">
				<a href="/terms" class="hover:text-gray-700 dark:hover:text-gray-300">利用規約</a>
				<span class="mx-2">|</span>
				<a href="/privacy" class="hover:text-gray-700 dark:hover:text-gray-300"
					>プライバシーポリシー</a
				>
			</p>
		</div>
	</div>
</div>

<script lang="ts">
	import SignupForm from '$features/auth/ui/SignupForm.svelte';
	import { Building2 } from '@lucide/svelte';
</script>

<svelte:head>
	<title>新規登録 - 給料・資産管理システム</title>
	<meta name="description" content="給料・資産管理システムの新規アカウント登録" />
</svelte:head>

<div
	class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden"
>
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<Building2 class="h-12 w-12 text-blue-600 mx-auto" />
		</div>

		<div>
			<SignupForm />
		</div>

		<div class="text-center text-xs text-gray-500">
			<p>© 2025 Salary Management System</p>
			<p class="mt-1">
				<a href="/terms" class="hover:text-gray-700">利用規約</a>
				<span class="mx-2">|</span>
				<a href="/privacy" class="hover:text-gray-700">プライバシーポリシー</a>
			</p>
		</div>
	</div>
</div>

<script lang="ts">
	import Card from '$shared/components/ui/Card.svelte';
	import LoginForm from './LoginForm.svelte';
	import { Building2 } from '@lucide/svelte';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<div class="flex justify-center">
				<Building2 class="h-12 w-12 text-blue-600" />
			</div>
			<h2 class="mt-6 text-3xl font-bold text-gray-900">給料・資産管理システム</h2>
			<p class="mt-2 text-sm text-gray-600">アカウントにログインしてください</p>
		</div>

		<Card variant="bordered" padding="lg">
			<LoginForm />
		</Card>

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

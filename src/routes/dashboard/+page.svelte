<script lang="ts">
	import DashboardLayout from '$features/dashboard/ui/DashboardLayout.svelte';
</script>

<svelte:head>
	<title>ダッシュボード - 給料・資産管理システム</title>
</svelte:head>

<div class="w-full">
	<div class="mb-8">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">ダッシュボード</h1>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">給料と資産の統合管理</p>
			</div>
		</div>
	</div>

	<main class="w-full">
		<DashboardLayout />
	</main>
</div>

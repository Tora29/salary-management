<script lang="ts">
	import DashboardLayout from '$features/dashboard/ui/DashboardLayout.svelte';
</script>

<svelte:head>
	<title>ダッシュボード - 給料・資産管理システム</title>
</svelte:head>

<div class="dashboard-container">
	<div class="dashboard-header">
		<div class="dashboard-header-content">
			<div>
				<h1 class="dashboard-title">ダッシュボード</h1>
				<p class="dashboard-subtitle">給料と資産の統合管理</p>
			</div>
		</div>
	</div>

	<main class="dashboard-main">
		<DashboardLayout />
	</main>
</div>

<style>
	.dashboard-container {
		width: 100%;
	}

	.dashboard-header {
		margin-bottom: 2rem;
	}

	.dashboard-header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dashboard-title {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
	}

	.dashboard-subtitle {
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-text-tertiary);
	}

	.dashboard-main {
		width: 100%;
	}
</style>

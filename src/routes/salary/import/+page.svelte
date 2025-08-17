<script lang="ts">
	import SalaryImportForm from '$features/salary-import/ui/SalaryImportForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="page-container">
	<div class="page-header">
		<h1>給料明細インポート</h1>
		<p>PDFファイルから給料明細データを自動的に抽出します</p>
	</div>

	<SalaryImportForm userId={data.session?.user?.id || ''} />
</div>

<style>
	.page-container {
		min-height: 100vh;
		background: #f9fafb;
		padding: 2rem 1rem;
	}

	.page-header {
		max-width: 900px;
		margin: 0 auto 2rem;
		text-align: center;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		margin-bottom: 0.5rem;
	}

	.page-header p {
		font-size: 1.125rem;
		color: #6b7280;
	}
</style>

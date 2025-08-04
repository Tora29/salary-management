<script lang="ts">
	import type { CardProps } from '../model/types';

	/**
	 * カードコンポーネント
	 * @component
	 * @description 汎用的なカードコンポーネント
	 * @example
	 * <Card
	 *   title="今月の給料"
	 *   value="¥250,000"
	 *   subtitle="前月比 +5%"
	 *   icon={DollarSign}
	 * />
	 */
	let { title, value, subtitle, icon: Icon }: CardProps = $props();
</script>

<div class="rounded-lg bg-white p-6 shadow-md">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-700">{title}</h3>
		<Icon class="h-6 w-6 text-gray-400" />
	</div>
	<p class="text-2xl font-bold text-gray-900">{value}</p>
	{#if subtitle}
		<p class="mt-2 text-sm text-gray-500">{subtitle}</p>
	{/if}
</div>

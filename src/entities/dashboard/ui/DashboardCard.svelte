<script lang="ts">
	import Card from '$lib/components/card/ui/Card.svelte';
	import type { DashboardCardProps } from '../model';

	/**
	 * ダッシュボード専用のカードコンポーネント
	 *
	 * @description
	 * 給料管理ドメインに特化したカードUI。汎用Cardコンポーネントをラップし、
	 * ダッシュボード画面で一貫したスタイルと構造を提供する。
	 *
	 * @example
	 * ```svelte
	 * <DashboardCard
	 *   title="今月の給料"
	 *   value="¥300,000"
	 *   subtitle="前月比 +5%"
	 *   icon={DollarSign}
	 * />
	 * ```
	 */

	let { title, value, subtitle, icon }: DashboardCardProps = $props();
</script>

{#if subtitle}
	<Card {title} {value} {subtitle} {icon} />
{:else}
	<Card {title} {value} {icon} />
{/if}

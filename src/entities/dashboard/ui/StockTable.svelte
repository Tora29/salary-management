<script lang="ts">
	import type { Column } from '$lib/components/table/model/types';
	import Table from '$lib/components/table/ui/Table.svelte';

	import type { Stock, StockTableProps } from '../model';

	/**
	 * 株式情報専用のテーブルコンポーネント
	 *
	 * @description
	 * 保有株式の一覧を表示するドメイン固有のテーブル。汎用Tableコンポーネントをラップし、
	 * 株式データに最適化されたカラム設定と表示フォーマットを提供する。
	 *
	 * @example
	 * ```svelte
	 * <StockTable stocks={[
	 *   {
	 *     symbol: '7203',
	 *     name: 'トヨタ自動車',
	 *     quantity: 100,
	 *     purchasePrice: 2500,
	 *     currentPrice: 2800,
	 *     value: 280000
	 *   }
	 * ]} />
	 * ```
	 */

	let { stocks }: StockTableProps = $props();

	const stockColumns: Column<Stock>[] = [
		{ key: 'symbol', label: '銘柄コード' },
		{ key: 'name', label: '銘柄名' },
		{ key: 'quantity', label: '保有数' },
		{ key: 'purchasePrice', label: '取得単価' },
		{ key: 'currentPrice', label: '現在値' },
		{ key: 'value', label: '評価額' }
	];
</script>

<Table
	columns={stockColumns as unknown as Column<Record<string, unknown>>[]}
	data={stocks as unknown as Record<string, unknown>[]}
/>

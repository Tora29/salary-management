<script lang="ts">
	import type { Column } from '../model/types';

	/**
	 * 汎用テーブルコンポーネント
	 * @component
	 * @template T - テーブルに表示するデータの型
	 * @example
	 * <Table
	 *   columns={[
	 *     { key: 'name', label: '名前' },
	 *     { key: 'age', label: '年齢' }
	 *   ]}
	 *   data={users}
	 * />
	 */
	let {
		columns = [],
		data = [],
		emptyMessage = 'データがありません'
	}: {
		columns?: Column[];
		data?: Record<string, unknown>[];
		emptyMessage?: string;
	} = $props();
</script>

<div class="overflow-x-auto">
	{#if data.length === 0}
		<div class="py-8 text-center text-gray-500">
			<p>{emptyMessage}</p>
		</div>
	{:else}
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					{#each columns as column (column.key)}
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							{column.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each data as row, index (index)}
					<tr>
						{#each columns as column (column.key)}
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
								{row[column.key as string] ?? '-'}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

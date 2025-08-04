/**
 * @fileoverview DashboardCardコンポーネントのユニットテスト
 * @module card/unit/Card.test
 * @description TDDアプローチに基づいたカードコンポーネントの動作検証
 */

import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import DashboardCard from '$lib/components/card/ui/Card.svelte';
import { DollarSign } from '@lucide/svelte';

/**
 * DashboardCardコンポーネントのテストスイート
 * @description カードの表示、条件付きレンダリング、プロパティの正しい処理を検証
 */
describe('DashboardCard', () => {
	/**
	 * 基本的な表示機能のテスト
	 * @test
	 * @description タイトルと値が正しくレンダリングされることを確認
	 */
	test('タイトルと値を表示する', () => {
		const { getByText } = render(DashboardCard, {
			props: {
				title: '今月の給料',
				value: '¥250,000',
				icon: DollarSign
			}
		});

		expect(getByText('今月の給料')).toBeInTheDocument();
		expect(getByText('¥250,000')).toBeInTheDocument();
	});

	/**
	 * subtitleプロパティの表示テスト
	 * @test
	 * @description subtitleが指定された場合に正しく表示されることを確認
	 */
	test('subtitleがある場合は表示する', () => {
		const { getByText } = render(DashboardCard, {
			props: {
				title: '年収累計',
				value: '¥3,000,000',
				subtitle: '今年の合計',
				icon: DollarSign
			}
		});

		expect(getByText('今年の合計')).toBeInTheDocument();
	});

	/**
	 * subtitleプロパティの非表示テスト
	 * @test
	 * @description subtitleが未指定の場合に表示されないことを確認
	 */
	test('subtitleがない場合は表示しない', () => {
		const { queryByText } = render(DashboardCard, {
			props: {
				title: '今月の給料',
				value: '¥250,000',
				icon: DollarSign
			}
		});

		// subtitleが渡されていないので、何も表示されないはず
		expect(queryByText('今年の合計')).not.toBeInTheDocument();
	});
});

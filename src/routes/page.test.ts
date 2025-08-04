import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import Page from './+page.svelte';
import type { Stock } from '$lib/data/types';
import type { DashboardResponse } from '$lib/api/types';

const mockDashboardData: DashboardResponse = {
	currentMonthSalary: 275000,
	yearlyIncome: 1650000,
	depositBalance: 5500000,
	stockValuation: 2282500,
	stocks: [
		{
			symbol: '7203',
			name: 'トヨタ自動車',
			quantity: 100,
			purchasePrice: 2800,
			currentPrice: 3150,
			value: 315000
		} as Stock
	],
	totalAssets: 7782500
};

describe('+page.svelte', () => {
	test('ダッシュボードのヘッダーが表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		expect(getByText('給料・資産管理')).toBeInTheDocument();
	});

	test('4つのダッシュボードカードが表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		// 各カードのタイトルが存在することを確認
		expect(getByText('今月の給料')).toBeInTheDocument();
		expect(getByText('年収累計')).toBeInTheDocument();
		expect(getByText('総資産額')).toBeInTheDocument();
		expect(getByText('株式評価額')).toBeInTheDocument();
	});

	test('株式ポートフォリオのテーブルが表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		// テーブルヘッダーの存在を確認
		expect(getByText('保有株式')).toBeInTheDocument();
		expect(getByText('銘柄コード')).toBeInTheDocument();
		expect(getByText('銘柄名')).toBeInTheDocument();
		expect(getByText('保有数')).toBeInTheDocument();
		expect(getByText('取得単価')).toBeInTheDocument();
		expect(getByText('現在値')).toBeInTheDocument();
		expect(getByText('評価額')).toBeInTheDocument();
	});

	test('APIから取得した株式情報が表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		// モックデータの最初の株式が表示されることを確認
		expect(getByText('7203')).toBeInTheDocument();
		expect(getByText('トヨタ自動車')).toBeInTheDocument();
	});

	test('更新ボタンが表示される', () => {
		const { getByRole } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		expect(getByRole('button', { name: /更新/ })).toBeInTheDocument();
	});

	test('エラー時にエラーメッセージが表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: {
					dashboardData: mockDashboardData,
					error: 'データの取得に失敗しました'
				} as any
			}
		});

		expect(getByText('エラーが発生しました')).toBeInTheDocument();
		expect(getByText('データの取得に失敗しました')).toBeInTheDocument();
	});

	test('フッターが表示される', () => {
		const { getByText } = render(Page, {
			props: {
				data: { dashboardData: mockDashboardData } as any
			}
		});

		expect(getByText('© 2024 給料・資産管理アプリ')).toBeInTheDocument();
	});
});

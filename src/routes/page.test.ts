import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import Page from './+page.svelte';

describe('+page.svelte', () => {
	// 1. Red: ダッシュボードの主要要素が表示されることをテスト
	test('ダッシュボードのヘッダーが表示される', () => {
		const { getByText } = render(Page);

		expect(getByText('給料・資産管理')).toBeInTheDocument();
	});

	test('4つのダッシュボードカードが表示される', () => {
		const { getByText } = render(Page);

		// 各カードのタイトルが存在することを確認
		expect(getByText('今月の給料')).toBeInTheDocument();
		expect(getByText('年収累計')).toBeInTheDocument();
		expect(getByText('総資産額')).toBeInTheDocument();
		expect(getByText('株式評価額')).toBeInTheDocument();
	});

	test('株式ポートフォリオのテーブルが表示される', () => {
		const { getByText } = render(Page);

		// テーブルヘッダーの存在を確認
		expect(getByText('保有株式')).toBeInTheDocument();
		expect(getByText('銘柄コード')).toBeInTheDocument();
		expect(getByText('銘柄名')).toBeInTheDocument();
		expect(getByText('保有数')).toBeInTheDocument();
		expect(getByText('取得単価')).toBeInTheDocument();
		expect(getByText('現在値')).toBeInTheDocument();
		expect(getByText('評価額')).toBeInTheDocument();
	});

	test('ダミーデータの株式情報が表示される', () => {
		const { getByText } = render(Page);

		// ダミーデータの最初の株式が表示されることを確認
		expect(getByText('7203')).toBeInTheDocument(); // トヨタ自動車
		expect(getByText('トヨタ自動車')).toBeInTheDocument();
	});

	test('フッターが表示される', () => {
		const { getByText } = render(Page);

		expect(getByText('© 2024 給料・資産管理アプリ')).toBeInTheDocument();
	});
});

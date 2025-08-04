export interface Stock {
	symbol: string;
	name: string;
	quantity: number;
	purchasePrice: number;
	currentPrice: number;
	value: number;
}

export interface DashboardMetrics {
	currentMonthSalary: number;
	yearlyIncome: number;
	depositBalance: number;
	stockValuation: number;
	totalAssets: number;
}

import type { Component } from 'svelte';

export interface DashboardCardProps {
	/** カードのタイトル（例: "今月の給料", "総資産額"） */
	title: string;
	/** 表示する値（例: "¥300,000"） */
	value: string;
	/** オプションのサブタイトル（例: "前月比 +5%"） */
	subtitle?: string;
	/** アイコンコンポーネント（Lucide Svelteアイコン） */
	icon: Component;
	/** トレンド表示（将来の拡張用） */
	trend?: 'up' | 'down' | 'neutral';
}

export interface StockTableProps {
	/** 表示する株式データの配列 */
	stocks: Stock[];
}

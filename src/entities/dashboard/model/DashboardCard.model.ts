import type { Component } from 'svelte';

export interface DashboardCardProps {
	/** カードのタイトル（例: "手取り累計", "総資産額"） */
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

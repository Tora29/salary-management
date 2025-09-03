/**
 * Melt UI共通型定義
 * このファイルは型定義のみを含みます（FSDルール準拠）
 */

import type { Snippet } from 'svelte';

/**
 * Melt UI Checkboxの共通プロパティ型
 */
export interface MeltCheckboxProps {
	checked?: boolean;
	disabled?: boolean;
	required?: boolean;
	label?: Snippet;
	class?: string;
	onCheckedChange?: (checked: boolean) => void;
	ariaLabel?: string;
}

/**
 * Melt UI Tooltipの共通プロパティ型
 */
export interface MeltTooltipProps {
	content?: Snippet;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	openDelay?: number;
	closeDelay?: number;
	class?: string;
	children?: Snippet;
}

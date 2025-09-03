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
}

/**
 * パスワード強度レベル
 */
export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

/**
 * パスワード強度チェック結果
 */
export interface PasswordStrengthResult {
	level: PasswordStrengthLevel;
	score: number;
	checks: {
		hasMinLength: boolean;
		hasUpperCase: boolean;
		hasLowerCase: boolean;
		hasNumber: boolean;
		hasSpecialChar: boolean;
	};
}

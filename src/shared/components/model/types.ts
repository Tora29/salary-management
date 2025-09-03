import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

/**
 * カードコンポーネントのプロパティ
 */
export interface CardProps {
	class?: string;
	padding?: 'sm' | 'md' | 'lg' | 'xl';
	shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	children?: Snippet;
}

/**
 * ボタンコンポーネントのプロパティ
 */
export interface ButtonProps extends HTMLButtonAttributes {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	loading?: boolean;
	disabled?: boolean;
	type?: 'button' | 'submit' | 'reset';
	class?: string;
	onclick?: (e: MouseEvent) => void;
	children?: Snippet;
}

/**
 * インプットコンポーネントのプロパティ
 */
export interface InputProps extends Omit<HTMLInputAttributes, 'autocomplete' | 'value'> {
	type?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	required?: boolean;
	autocomplete?: HTMLInputAttributes['autocomplete'];
	id?: string;
	name?: string;
	class?: string;
}

/**
 * アラートコンポーネントのプロパティ
 */
export interface AlertProps {
	type?: 'error' | 'success' | 'warning' | 'info';
	title?: string;
	message: string;
	dismissible?: boolean;
	icon?: boolean;
	onDismiss?: () => void;
}

/**
 * ラベルコンポーネントのプロパティ
 */
export interface LabelProps {
	for?: string;
	required?: boolean;
	class?: string;
	children?: Snippet;
}

/**
 * アイコンコンポーネントのプロパティ
 */
export interface IconProps {
	name: string;
	size?: 'sm' | 'md' | 'lg';
	class?: string;
}

/**
 * リンクコンポーネントのプロパティ
 */
export interface LinkProps {
	href: string;
	class?: string;
	children: Snippet;
	target?: string;
	'aria-label'?: string;
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

/**
 * パスワード強度コンポーネントのプロパティ
 */
export interface PasswordStrengthProps {
	password: string;
	class?: string;
	showDetails?: boolean;
}

/**
 * ツールチップコンポーネントのプロパティ
 */
export interface TooltipProps {
	content?: Snippet;
	placement?: 'top' | 'bottom' | 'left' | 'right';
	openDelay?: number;
	closeDelay?: number;
	class?: string;
	children?: Snippet;
}

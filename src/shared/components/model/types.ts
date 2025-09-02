import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

export interface CardProps {
	class?: string;
	padding?: 'sm' | 'md' | 'lg' | 'xl';
	shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	children?: Snippet;
}

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

export interface InputProps extends Omit<HTMLInputAttributes, 'autocomplete'> {
	type?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	error?: boolean;
	required?: boolean;
	autocomplete?: string;
	id?: string;
	name?: string;
	class?: string;
}

export interface AlertProps {
	type?: 'error' | 'success' | 'warning' | 'info';
	title?: string;
	message: string;
	dismissible?: boolean;
	icon?: boolean;
	onDismiss?: () => void;
}

export interface LabelProps {
	for?: string;
	required?: boolean;
	class?: string;
	children?: Snippet;
}

export interface IconProps {
	name: string;
	size?: 'sm' | 'md' | 'lg';
	class?: string;
}

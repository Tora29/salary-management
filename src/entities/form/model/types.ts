import type { Snippet } from 'svelte';

export interface FormLayoutProps {
	children: Snippet;
	onsubmit?: (e: Event) => void;
}

export interface FormSectionProps {
	children: Snippet;
	spacing?: 'tight' | 'normal' | 'loose';
}

export interface FormFooterProps {
	children: Snippet;
	align?: 'left' | 'center' | 'right' | 'between';
}

export interface FormFieldGroupProps {
	children: Snippet;
	helpText?: string;
}

export interface FormTextProps {
	children: Snippet;
	variant?: 'default' | 'muted' | 'error';
	size?: 'xs' | 'sm' | 'md';
	align?: 'left' | 'center' | 'right';
}

export interface FormLinkProps {
	href: string;
	children: Snippet;
	variant?: 'primary' | 'secondary';
	size?: 'sm' | 'md';
}

export interface FormCheckboxProps {
	children: Snippet;
	id: string;
	name: string;
	checked?: boolean;
	required?: boolean;
	disabled?: boolean;
	error?: string;
}

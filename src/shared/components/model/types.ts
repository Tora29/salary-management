import type { Component } from 'svelte';

export interface ButtonProps {
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	type?: 'button' | 'submit' | 'reset';
	class?: string;
	fullWidth?: boolean;
}

export interface InputProps {
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
	placeholder?: string;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	error?: string;
	label?: string;
	id?: string;
	name?: string;
	value?: string;
	class?: string;
	icon?: Component<{ class?: string }>;
	onblur?: () => void;
}

export interface CardProps {
	variant?: 'default' | 'bordered' | 'elevated';
	padding?: 'none' | 'sm' | 'md' | 'lg';
	class?: string;
}

export interface AlertProps {
	variant?: 'info' | 'success' | 'warning' | 'error';
	dismissible?: boolean;
	class?: string;
}

export interface FormFieldProps {
	label?: string;
	error?: string;
	required?: boolean;
	id?: string;
	class?: string;
}

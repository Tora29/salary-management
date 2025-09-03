/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				secondary: 'var(--color-secondary)',
				accent: 'var(--color-accent)',
				neutral: 'var(--color-neutral)',
				'primary-700': 'var(--color-primary-700)',
				'error-600': 'var(--color-error-600)',
				'success-600': 'var(--color-success-600)',
				'warning-600': 'var(--color-warning-600)',
				'info-600': 'var(--color-info-600)',
				border: 'var(--color-border)'
			},
			backgroundColor: {
				base: 'var(--bg-base)',
				surface: 'var(--bg-surface)',
				card: 'var(--color-bg-card)',
				page: 'var(--color-bg-page)'
			},
			textColor: {
				base: 'var(--text-base)',
				muted: 'var(--text-muted)',
				primary: 'var(--color-text-primary)',
				secondary: 'var(--color-text-secondary)'
			},
			spacing: {
				0: 'var(--spacing-0)',
				1: 'var(--spacing-1)',
				2: 'var(--spacing-2)',
				3: 'var(--spacing-3)',
				4: 'var(--spacing-4)',
				5: 'var(--spacing-5)',
				6: 'var(--spacing-6)',
				8: 'var(--spacing-8)',
				10: 'var(--spacing-10)',
				12: 'var(--spacing-12)',
				16: 'var(--spacing-16)',
				20: 'var(--spacing-20)',
				24: 'var(--spacing-24)'
			},
			fontSize: {
				xs: 'var(--font-size-xs)',
				sm: 'var(--font-size-sm)',
				base: 'var(--font-size-base)',
				lg: 'var(--font-size-lg)',
				xl: 'var(--font-size-xl)',
				'2xl': 'var(--font-size-2xl)',
				'3xl': 'var(--font-size-3xl)',
				'4xl': 'var(--font-size-4xl)'
			},
			fontWeight: {
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)'
			},
			borderRadius: {
				none: 'var(--border-radius-none)',
				sm: 'var(--border-radius-sm)',
				base: 'var(--border-radius-base)',
				md: 'var(--border-radius-md)',
				lg: 'var(--border-radius-lg)',
				xl: 'var(--border-radius-xl)',
				'2xl': 'var(--border-radius-2xl)',
				full: 'var(--border-radius-full)'
			},
			borderWidth: {
				0: 'var(--border-width-0)',
				1: 'var(--border-width-1)',
				2: 'var(--border-width-2)',
				4: 'var(--border-width-4)'
			},
			boxShadow: {
				none: 'var(--shadow-none)',
				sm: 'var(--shadow-sm)',
				base: 'var(--shadow-base)',
				md: 'var(--shadow-md)',
				lg: 'var(--shadow-lg)',
				xl: 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)'
			},
			transitionDuration: {
				fast: 'var(--transition-fast)',
				base: 'var(--transition-base)',
				slow: 'var(--transition-slow)',
				slower: 'var(--transition-slower)'
			},
			transitionTimingFunction: {
				linear: 'var(--ease-linear)',
				in: 'var(--ease-in)',
				out: 'var(--ease-out)',
				'in-out': 'var(--ease-in-out)'
			},
			maxWidth: {
				grid: 'var(--grid-max-width)'
			}
		}
	},
	plugins: []
};

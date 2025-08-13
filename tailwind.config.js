import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
					950: '#172554'
				}
			}
		}
	},
	plugins: [
		plugin(function ({ addUtilities, _addBase, _theme }) {
			// カスタムユーティリティクラスを追加
			addUtilities({
				// 背景色ユーティリティ
				'.bg-base': {
					'@apply bg-white dark:bg-gray-900': {}
				},
				'.bg-surface': {
					'@apply bg-gray-50 dark:bg-gray-800': {}
				},
				'.bg-surface-secondary': {
					'@apply bg-gray-100 dark:bg-gray-700': {}
				},

				// テキスト色ユーティリティ
				'.text-base': {
					'@apply text-gray-900 dark:text-white': {}
				},
				'.text-muted': {
					'@apply text-gray-700 dark:text-gray-300': {}
				},
				'.text-subtle': {
					'@apply text-gray-500 dark:text-gray-400': {}
				},

				// ボーダー色ユーティリティ
				'.border-base': {
					'@apply border-gray-200 dark:border-gray-700': {}
				},
				'.border-muted': {
					'@apply border-gray-300 dark:border-gray-600': {}
				},

				// カードコンポーネント
				'.card': {
					'@apply bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/30': {}
				},
				'.card-hover': {
					'@apply hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow': {}
				},

				// ボタンベースクラス
				'.btn-primary': {
					'@apply bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white':
						{}
				},
				'.btn-secondary': {
					'@apply bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white':
						{}
				}
			});
		})
	]
};

import svelteConfig from './svelte.config.js';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		plugins: {
			jsdoc
		}
	},
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// ========== 非推奨機能の検出 ==========
			// '@typescript-eslint/no-deprecated': 'warn', // 型情報が必要なため無効化

			// ========== import関連 ==========
			'no-restricted-imports': [
				'warn',
				{
					patterns: ['@sveltejs/kit/experimental/*', 'svelte/internal/*']
				}
			],

			// ========== TypeScript品質ルール ==========
			'@typescript-eslint/explicit-function-return-type': [
				'warn',
				{
					allowExpressions: true,
					allowTypedFunctionExpressions: true,
					allowHigherOrderFunctions: true,
					allowDirectConstAssertionInArrowFunctions: true
				}
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/consistent-type-imports': [
				'warn',
				{
					prefer: 'type-imports'
				}
			],
			'@typescript-eslint/no-non-null-assertion': 'warn',

			// ========== JSDoc関連 ==========
			'jsdoc/require-description': [
				'warn',
				{
					contexts: ['FunctionDeclaration', 'MethodDefinition', 'ClassDeclaration']
				}
			],
			'jsdoc/require-param': 'warn',
			'jsdoc/require-param-description': 'warn',
			'jsdoc/require-param-type': 'off', // TypeScriptで型があるため不要
			'jsdoc/require-returns': 'warn',
			'jsdoc/require-returns-description': 'warn',
			'jsdoc/require-returns-type': 'off', // TypeScriptで型があるため不要
			'jsdoc/check-alignment': 'warn',
			'jsdoc/check-param-names': 'error',
			'jsdoc/check-tag-names': 'error',
			'jsdoc/no-undefined-types': 'off', // TypeScript型を使うため

			// ========== 一般的な品質ルール ==========
			'prefer-const': 'error',
			'no-var': 'error',
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'error',
			'no-alert': 'error',
			eqeqeq: ['error', 'always'],
			curly: ['error', 'all'],

			// ========== セキュリティ関連 ==========
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',
			'no-script-url': 'error',

			// ========== アクセシビリティ（後でSvelte用に調整） ==========
			'no-restricted-properties': [
				'warn',
				{ object: 'console', property: 'log', message: 'Use proper logging' }
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		},
		rules: {
			// ========== Svelteベストプラクティス ==========
			'svelte/no-at-html-tags': 'error',
			'svelte/no-at-debug-tags': 'error',
			'svelte/valid-compile': 'error',
			'svelte/no-dom-manipulating': 'warn',
			'svelte/no-dupe-else-if-blocks': 'error',
			'svelte/no-dupe-style-properties': 'error',
			'svelte/no-inner-declarations': 'error',
			'svelte/no-useless-mustaches': 'warn',

			// ========== Svelteパフォーマンス ==========
			'svelte/no-object-in-text-mustaches': 'warn',
			'svelte/prefer-style-directive': 'warn',

			// ========== Svelte 5 Runes対応 ==========
			// $props()の分割代入は再代入されないが、letである必要がある
			'prefer-const': [
				'error',
				{
					destructuring: 'all',
					ignoreReadBeforeAssign: true
				}
			]
		}
	}
);

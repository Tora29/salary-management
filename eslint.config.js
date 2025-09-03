import { fileURLToPath } from 'node:url';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		plugins: {
			import: importPlugin,
			jsdoc: jsdoc
		},
		settings: {
			'import/resolver': {
				typescript: {
					alwaysTryTypes: true,
					project: './tsconfig.json'
				}
			}
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',

			// ========== 非推奨機能の検出 ==========
			// '@typescript-eslint/no-deprecated': 'warn', // 型情報が必要なため無効化

			// ========== import関連 ==========
			// import順序の自動整理ルール
			'import/order': [
				'error',
				{
					groups: [
						'builtin', // Node.js組み込みモジュール
						'external', // npm packageなど
						'internal', // エイリアス($lib, $appなど)
						'parent', // 親ディレクトリ
						'sibling', // 同階層
						'index', // indexファイル
						'object', // object import
						'type' // type import
					],
					pathGroups: [
						{
							pattern: '$app/**',
							group: 'internal',
							position: 'before'
						},
						{
							pattern: '$lib/**',
							group: 'internal'
						},
						{
							pattern: '$shared/**',
							group: 'internal'
						},
						{
							pattern: '$entities/**',
							group: 'internal',
							position: 'after'
						},
						{
							pattern: '$features/**',
							group: 'internal',
							position: 'after'
						}
					],
					pathGroupsExcludedImportTypes: ['type'],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					}
				}
			],
			'import/no-duplicates': 'error',
			'import/newline-after-import': 'error',
			'import/no-mutable-exports': 'error',
			'import/no-cycle': 'error',
			'import/no-self-import': 'error',

			// ========== JSDoc関連ルール ==========
			'jsdoc/check-alignment': 'warn',
			'jsdoc/check-param-names': 'error',
			'jsdoc/check-tag-names': [
				'error',
				{
					definedTags: ['internal', 'experimental', 'deprecated']
				}
			],
			'jsdoc/check-types': 'off', // TypeScriptが型チェックを行うため無効
			'jsdoc/require-description': [
				'warn',
				{
					contexts: ['FunctionDeclaration', 'ClassDeclaration', 'MethodDefinition'],
					descriptionStyle: 'body'
				}
			],
			'jsdoc/require-jsdoc': [
				'warn',
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						ClassDeclaration: true,
						MethodDefinition: true,
						ArrowFunctionExpression: false,
						FunctionExpression: false
					},
					contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
					checkConstructors: false
				}
			],
			'jsdoc/require-param': 'off', // TypeScriptの型情報を使用
			'jsdoc/require-param-description': 'warn',
			'jsdoc/require-param-name': 'error',
			'jsdoc/require-returns': 'off', // TypeScriptの型情報を使用
			'jsdoc/require-returns-description': 'warn',
			'jsdoc/no-undefined-types': 'off', // TypeScriptが型チェックを行う
			'jsdoc/valid-types': 'off', // TypeScriptが型チェックを行う
			'jsdoc/no-types': [
				'warn',
				{
					contexts: ['any'] // TypeScriptプロジェクトでは型注釈不要
				}
			],
			'jsdoc/empty-tags': 'error',
			'jsdoc/multiline-blocks': ['warn', { noSingleLineBlocks: true }],
			'jsdoc/tag-lines': ['warn', 'never', { startLines: 1 }],

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
	// FSDアーキテクチャ制約 - shared層
	{
		files: ['**/shared/**/*'],
		rules: {
			// shared層は他のレイヤーに依存できません
		}
	},
	// FSDアーキテクチャ制約 - entities層
	{
		files: ['**/entities/**/*'],
		rules: {
			// entities層は上位レイヤー（features, routes）に依存できません
		}
	},
	// FSDアーキテクチャ制約 - features層
	{
		files: ['**/features/**/*'],
		rules: {
			// features層はroutesレイヤーに依存できません
			// features同士の相互依存は禁止されています
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

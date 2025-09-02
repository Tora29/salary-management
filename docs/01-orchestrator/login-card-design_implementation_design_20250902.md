# カードデザインログイン画面 実装用設計書

## 作成日: 2025/09/02

## 中間成果物リンク

- [ライブラリ選定JSON](../02-library-selector/login-card-design_library_selection_20250902.json)
- [基本設計JSON](../04-basic-design/login-card-design_basic_design_20250902.json)
- [詳細設計JSON](../05-detailed-design/login-card-design_detailed_design_20250902.json)

## 1. ライブラリ選定

### 選定技術スタック

| カテゴリ         | 選定技術               | 理由                                                               |
| ---------------- | ---------------------- | ------------------------------------------------------------------ |
| UIコンポーネント | Melt UI + カスタム実装 | 既存のMelt UIを活用、シンプルなコンポーネントはHTML+Tailwindで実装 |
| バリデーション   | Zod                    | 既存利用、TypeScript統合が優秀                                     |
| 認証             | Supabase               | 既存のSupabase統合を活用、SSR対応済み                              |
| 状態管理         | Svelte 5 Runes         | $state、$derived、$effectで十分                                    |

### Melt UI使用戦略

- **Form**: createFormビルダー（バリデーション統合）
- **Card, Button, Input, Alert**: カスタム実装（HTML + Tailwind CSS）

## 2. 基本設計

### 問題定義

安全で使いやすいユーザー認証システムがなく、不正アクセスのリスクがある

### 主要目標（5つ）

1. モダンで視覚的に魅力的なカードベースのログイン画面を実装
2. Supabase認証を使用した安全なメール/パスワード認証を提供
3. リアルタイムバリデーションとエラー処理により優れたUXを実現
4. すべてのデバイスサイズで完璧に動作するレスポンシブデザイン
5. WCAGレベルAAのアクセシビリティ基準を満たす

### 受け入れ基準（10項目）

| ID     | 内容                                                      |
| ------ | --------------------------------------------------------- |
| AC-001 | 有効な認証情報でログイン成功→ダッシュボードへリダイレクト |
| AC-002 | 無効なメール形式でリアルタイムエラー表示                  |
| AC-003 | 認証失敗時にエラーアラート表示                            |
| AC-004 | ローディング状態とボタン無効化                            |
| AC-005 | モバイルレスポンシブ対応（375px〜）                       |
| AC-006 | パスワード表示/非表示切り替え                             |
| AC-007 | キーボードナビゲーション完全対応                          |
| AC-008 | 必須フィールドのクライアント側バリデーション              |
| AC-009 | ネットワークエラーのハンドリング                          |
| AC-010 | スクリーンリーダー対応（ARIA）                            |

## 3. 詳細設計

### FSDアーキテクチャ構成

```
src/
├── shared/                    # 共有層
│   ├── components/ui/          # 基本UIコンポーネント
│   │   ├── Card.svelte
│   │   ├── Button.svelte
│   │   ├── Input.svelte
│   │   ├── Alert.svelte
│   │   ├── Label.svelte
│   │   └── Icon.svelte
│   ├── api/
│   │   └── supabase.ts        # Supabaseクライアント
│   └── utils/
│       └── validation.ts       # バリデーションユーティリティ
│
├── entities/                   # エンティティ層
│   └── user/
│       ├── model/
│       │   └── types.ts       # ユーザー型定義
│       └── ui/
│           └── UserCredentialsCard.svelte
│
├── features/                   # フィーチャー層
│   └── auth-login/
│       ├── model/
│       │   └── loginSchema.ts # Zodスキーマ
│       ├── api/
│       │   └── supabaseAuth.ts # 認証API
│       ├── composable/
│       │   └── useLogin.svelte.ts # ログインロジック
│       └── ui/
│           └── LoginForm.svelte
│
└── routes/                     # ルート層
    └── login/
        └── +page.svelte
```

### コンポーネント実装詳細

#### shared/components/ui/Card.svelte

```svelte
<script lang="ts">
	interface Props {
		variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
		padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
		rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
		class?: string;
	}

	let {
		variant = 'default',
		padding = 'lg',
		rounded = 'lg',
		class: className = '',
		children
	}: Props = $props();

	const variantClasses = {
		default: 'card-default',
		elevated: 'card-elevated',
		outlined: 'card-outlined',
		ghost: 'card-ghost'
	};
</script>

<div class="card {variantClasses[variant]} p-{padding} rounded-{rounded} {className}">
	{@render children?.()}
</div>
```

#### shared/components/ui/Button.svelte

```svelte
<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (e: MouseEvent) => void;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		disabled = false,
		type = 'button',
		onclick,
		class: className = '',
		children
	}: Props = $props();

	const isDisabled = $derived(disabled || loading);
</script>

<button
	{type}
	class="btn btn-{variant} btn-{size} {loading ? 'btn-loading' : ''} {className}"
	disabled={isDisabled}
	{onclick}
	aria-busy={loading}
>
	{#if loading}
		<span class="spinner" aria-hidden="true"></span>
	{/if}
	{@render children?.()}
</button>
```

#### features/auth-login/composable/useLogin.svelte.ts

```typescript
import { supabaseAuth } from '../api/supabaseAuth';
import { loginSchema } from '../model/loginSchema';
import type { LoginCredentials, LoginResult } from '../model/types';

export function useLogin() {
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function login(credentials: LoginCredentials): Promise<LoginResult> {
		isLoading = true;
		error = null;

		try {
			// バリデーション
			const validated = loginSchema.parse(credentials);

			// Supabase認証
			const result = await supabaseAuth.signIn(validated);

			if (result.error) {
				throw new Error(result.error.message);
			}

			return {
				success: true,
				user: result.data.user,
				session: result.data.session
			};
		} catch (err) {
			error = err instanceof Error ? err.message : '認証に失敗しました';
			return {
				success: false,
				error
			};
		} finally {
			isLoading = false;
		}
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		login,
		clearError: () => {
			error = null;
		}
	};
}
```

#### features/auth-login/ui/LoginForm.svelte

```svelte
<script lang="ts">
	import { goto } from '$app/navigation';
	import { createForm } from '@melt-ui/svelte';
	import { z } from 'zod';
	import UserCredentialsCard from '$entities/user/ui/UserCredentialsCard.svelte';
	import Alert from '$shared/components/ui/Alert.svelte';
	import { useLogin } from '../composable/useLogin.svelte';
	import { loginSchema } from '../model/loginSchema';

	const { login, isLoading, error, clearError } = useLogin();

	const { form, errors, data, handleSubmit } = createForm({
		schema: loginSchema,
		onSubmit: async (values) => {
			const result = await login(values);
			if (result.success) {
				await goto('/dashboard');
			}
		}
	});

	$effect(() => {
		if (error) {
			setTimeout(clearError, 5000);
		}
	});
</script>

<div class="grid-container min-h-screen flex-center">
	<div class="col-12 md:col-8 lg:col-4">
		{#if error}
			<Alert type="error" message={error} dismissible class="mb-4" />
		{/if}

		<form use:form>
			<UserCredentialsCard
				email={$data.email}
				password={$data.password}
				emailError={$errors.email}
				passwordError={$errors.password}
				loading={$isLoading}
				onSubmit={handleSubmit}
			/>
		</form>
	</div>
</div>
```

### app.css 汎用スタイル定義

```css
/* カードスタイル */
.card {
	background: var(--bg-surface);
	border-radius: var(--border-radius-lg);
}
.card-default {
	box-shadow: var(--shadow-sm);
}
.card-elevated {
	box-shadow: var(--shadow-lg);
}
.card-outlined {
	border: var(--border-width-1) solid var(--color-neutral);
}

/* ボタンスタイル */
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: all var(--transition-base);
}
.btn-primary {
	background: var(--color-primary);
	color: var(--bg-base);
}
.btn-loading {
	pointer-events: none;
	opacity: 0.7;
}

/* インプットスタイル */
.input {
	width: 100%;
	padding: var(--spacing-2) var(--spacing-3);
	background: var(--bg-surface);
	border: var(--border-width-1) solid var(--color-neutral);
	border-radius: var(--border-radius-md);
}
.input-error {
	border-color: var(--color-accent);
}

/* アラートスタイル */
.alert {
	padding: var(--spacing-4);
	border-radius: var(--border-radius-md);
}
.alert-error {
	background: var(--color-accent) / 10%;
	color: var(--color-accent);
}

/* グリッドシステム */
.grid-container {
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	gap: var(--grid-gap-md);
}
.col-12 {
	grid-column: span 12;
}
.col-4 {
	grid-column: span 4;
}

@media (max-width: 768px) {
	.md\:col-12 {
		grid-column: span 12;
	}
	.md\:col-8 {
		grid-column: span 8;
	}
}

/* ユーティリティ */
.min-h-screen {
	min-height: 100vh;
}
.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}
```

## 4. 実装ガイドライン

### 実装手順

1. **環境準備**

   ```bash
   # Supabase環境変数設定
   echo "PUBLIC_SUPABASE_URL=your_url" >> .env
   echo "PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env
   ```

2. **基本UIコンポーネント実装**
   - `src/shared/components/ui/` 配下のコンポーネントから実装
   - app.cssにスタイル定義を追加

3. **エンティティ層実装**
   - `UserCredentialsCard.svelte`の実装
   - ユーザー型定義の作成

4. **フィーチャー層実装**
   - Zodスキーマ定義
   - Supabase認証APIラッパー
   - useLoginコンポーザブル
   - LoginFormコンポーネント

5. **ルート層実装**
   - `/login/+page.svelte`の実装
   - レイアウト調整

### コード構成

```
実装順序:
1. shared/api/supabase.ts      # Supabaseクライアント初期化
2. shared/utils/validation.ts  # メールバリデーション等
3. shared/components/ui/*      # 基本UIコンポーネント
4. entities/user/model/types.ts # 型定義
5. entities/user/ui/*          # エンティティUIコンポーネント
6. features/auth-login/model/* # スキーマ定義
7. features/auth-login/api/*   # API実装
8. features/auth-login/composable/* # ビジネスロジック
9. features/auth-login/ui/*    # フィーチャーUI
10. routes/login/+page.svelte  # ページ実装
```

### 注意事項

1. **FSDアーキテクチャ厳守**
   - レイヤー依存順序を必ず守る
   - shared → entities → features → routes
   - 逆方向の依存は禁止

2. **Svelte 5 Runes使用**
   - `$state()`で状態管理
   - `$derived()`で派生状態
   - `$effect()`で副作用
   - `$props()`でプロパティ

3. **TypeScript厳密モード**
   - exactOptionalPropertyTypes: true
   - 全ての型を明示的に定義

4. **アクセシビリティ**
   - 適切なARIA属性
   - キーボードナビゲーション
   - フォーカス管理

## 5. テスト計画

### ユニットテスト

```typescript
// shared/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validation';

describe('validateEmail', () => {
	it('有効なメールアドレスを受け入れる', () => {
		expect(validateEmail('test@example.com')).toBe(true);
	});

	it('無効なメールアドレスを拒否する', () => {
		expect(validateEmail('invalid')).toBe(false);
	});
});
```

### E2Eテスト

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ログイン機能', () => {
	test('正常なログインフロー', async ({ page }) => {
		await page.goto('/login');

		// メールアドレス入力
		await page.fill('[name="email"]', 'test@example.com');

		// パスワード入力
		await page.fill('[name="password"]', 'password123');

		// ログインボタンクリック
		await page.click('[type="submit"]');

		// ダッシュボードへのリダイレクト確認
		await expect(page).toHaveURL('/dashboard');
	});

	test('エラー表示の確認', async ({ page }) => {
		await page.goto('/login');

		// 無効な認証情報を入力
		await page.fill('[name="email"]', 'wrong@example.com');
		await page.fill('[name="password"]', 'wrongpass');
		await page.click('[type="submit"]');

		// エラーアラート表示確認
		await expect(page.locator('.alert-error')).toBeVisible();
	});
});
```

### 検証コマンド

```bash
# リント実行
npm run lint

# フォーマット実行
npm run format

# 型チェック
npm run check

# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 6. Implementation-Agentへの引き継ぎ指示

### 実装開始方法（別チャットセッションで実行）

1. **新しいチャットセッションを開始**

2. **以下のコマンドでImplementation-Agentを起動:**

   ```
   Implementation-Agentを使用して、
   設計書: docs/01-orchestrator/login-card-design_implementation_design_20250902.md
   を基に実装を行ってください。

   詳細設計JSON: docs/05-detailed-design/login-card-design_detailed_design_20250902.json
   も参照してください。
   ```

3. **実装時の重要事項:**
   - FSDアーキテクチャルール（`.claude/agents/00-ARCHITECTURE-RULES/FSD-ARCHITECTURE-RULES.md`）を厳守
   - Svelte 5文法ルール（`.claude/agents/00-ARCHITECTURE-RULES/SVELTE5-SYNTAX-RULES.md`）を厳守
   - 実装計画（`docs/01-orchestrator/IMPLEMENTATION_PLAN_login-card-design_20250902.md`）に従う

### チェックポイント

- [ ] 全ファイルのFSDルール準拠
- [ ] TypeScript型安全性
- [ ] Svelte 5文法準拠
- [ ] 全受け入れ基準（AC-001〜AC-010）の実装
- [ ] テストケース完全性
- [ ] アクセシビリティ対応
- [ ] レスポンシブデザイン対応

### 実装ステージ

**Stage 1: 基本構造とルーティング**

- ログインページの作成
- 基本レイアウト設定

**Stage 2: UIコンポーネント実装**

- shared/components/ui の作成
- entities/user/ui の作成

**Stage 3: ビジネスロジック実装**

- Supabase認証統合
- フォームバリデーション

**Stage 4: エラーハンドリング**

- エラー表示実装
- ネットワークエラー対応

**Stage 5: テストと最適化**

- 全テスト実行
- パフォーマンス最適化

---

## 作成者

Orchestrator-Agent

## バージョン

1.0.0

## 最終更新

2025/09/02

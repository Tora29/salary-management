# ユーザー新規登録機能 実装用設計書

## 作成日: 2025/09/02

## 中間成果物リンク

- [ライブラリ選定JSON](../02-library-selector/user-registration_library_selection_20250902.json)
- [基本設計JSON](../04-basic-design/user-registration_basic_design_20250902.json)
- [承認済みハンドオフJSON](../04-basic-design/user-registration_handoff_approved_20250902.json)
- [UIコンポーネント設計ガイダンスJSON](../03-melt-ui/user-registration_ui_guidance_20250902.json)
- [詳細設計JSON](../05-detailed-design/user-registration_detailed_design_20250902.json)
- [実装計画](IMPLEMENTATION_PLAN_user-registration_20250902.md)

## 1. ライブラリ選定

### 1.1 技術スタック決定

#### 既存ライブラリで全要件を満たす

- **認証**: `@supabase/supabase-js` (既存) - Supabase Auth統合
- **UIフレームワーク**: `@melt-ui/svelte` (既存) + Tailwind CSS
- **バリデーション**: `zod` (既存) - スキーマベースバリデーション
- **パスワード強度**: カスタム実装（追加依存なし）
- **UIコンポーネント**: Melt UI Checkbox, Tooltip（既存ライブラリ）

### 1.2 新規ライブラリ不要の理由

- 既存ライブラリで要件の90%以上をカバー可能
- ログイン機能との統一性を保持
- バンドルサイズの増加を回避
- プロジェクトの保守性を維持

### 1.3 実装方針

- パスワード強度表示: 正規表現ベースの簡易チェック実装
- 利用規約チェックボックス: Melt UIのcreateCheckboxビルダー使用
- フォームバリデーション: Zodスキーマによるリアルタイム検証

## 2. 基本設計

### 2.1 問題定義と目標

**問題**: システムに新規ユーザーが登録する手段がなく、管理者が手動でユーザーを作成する必要がある

**目標**:

1. メール/パスワードによる新規ユーザー登録機能を実装し、セルフサービス化を実現
2. パスワード強度検証とメール確認プロセスによる安全な登録フローを構築
3. 既存のログイン機能とシームレスに連携する登録画面を提供
4. 利用規約への同意を必須とし、法的要件を満たす

### 2.2 受け入れ基準（AC）

| ID     | 内容                                              | 実装方法                                       |
| ------ | ------------------------------------------------- | ---------------------------------------------- |
| AC-001 | Supabase Authでの新規ユーザー作成と確認メール送信 | `/api/auth/register` エンドポイントで実装      |
| AC-002 | リアルタイムパスワード強度インジケーター          | PasswordStrengthコンポーネントで$derivedを使用 |
| AC-003 | メールアドレス形式検証                            | Zodスキーマとonblurイベントで実装              |
| AC-004 | パスワード一致確認                                | $effectによるリアルタイムチェック              |
| AC-005 | 利用規約同意チェック                              | TermsCheckboxとZodバリデーション               |
| AC-006 | メールアドレス重複チェック                        | サーバーサイドで409エラー返却                  |
| AC-007 | 登録成功後のログイン画面遷移                      | gotoによる/loginへのリダイレクト               |
| AC-008 | ログイン画面へのリンク                            | Linkコンポーネントでフッターに配置             |
| AC-009 | エラーハンドリング                                | try-catchとserverError状態で実装               |
| AC-010 | パスワード強度要件の検証                          | Zodスキーマで8文字以上・文字種チェック         |

### 2.3 API設計

#### エンドポイント: POST /api/auth/register

**リクエスト**:

```typescript
{
	email: string;
	password: string;
	agreedToTerms: boolean;
}
```

**レスポンス**:

```typescript
// 成功時 (200)
{
	success: true;
	message: string;
	userId: string;
}

// エラー時
// 400: バリデーションエラー
// 409: メールアドレス重複
// 422: パスワード要件不足
// 500: サーバーエラー
```

### 2.4 パスワード要件

- 最小8文字
- 大文字を含む
- 小文字を含む
- 数字を含む
- 特殊文字は任意

## 3. UIコンポーネント設計（Melt UIガイダンス）

### 3.1 TermsCheckbox（利用規約同意）

#### 設計方針

- **ビルダー**: `createCheckbox` from Melt UI
- **場所**: `src/shared/components/ui/TermsCheckbox.svelte`
- **双方向バインディング**: `$bindable`による実装

#### プロパティインターフェース

```typescript
{
  checked: $bindable<boolean>;
  disabled?: boolean;
  required?: boolean;
  label?: Snippet;
  class?: string;
}
```

#### アクセシビリティ

- `aria-checked`: チェック状態表示
- `aria-required`: 必須フィールド
- キーボード操作: Space キーでトグル

### 3.2 PasswordTooltip（パスワード要件説明）

#### 設計方針

- **ビルダー**: `createTooltip` from Melt UI
- **場所**: `src/shared/components/ui/PasswordTooltip.svelte`
- **表示トリガー**: ホバー/フォーカス時

#### プロパティインターフェース

```typescript
{
  content?: Snippet;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  openDelay?: number;
  closeDelay?: number;
  class?: string;
}
```

#### コンテンツ構造

```
✓ 最小8文字以上
✓ 大文字を1文字以上含む
✓ 小文字を1文字以上含む
✓ 数字を1文字以上含む
```

### 3.3 PasswordStrength（カスタム実装）

#### 設計方針

- **場所**: `src/shared/components/ui/PasswordStrength.svelte`
- **実装**: Svelte 5 $derivedによる効率的な強度計算
- **視覚表現**: プログレスバーまたは段階的インジケーター

## 4. 詳細設計

### 4.1 FSDアーキテクチャ構造

```
src/
├── routes/
│   ├── register/
│   │   └── +page.svelte                 # 登録ページ（features/uiをインポート）
│   └── api/auth/register/
│       └── +server.ts                   # 登録APIエンドポイント
│
├── features/auth-register/
│   ├── composable/
│   │   └── useRegister.svelte.ts        # 登録ロジック（Svelte 5 Runes）
│   ├── model/
│   │   └── types.ts                     # 型定義
│   ├── api/
│   │   └── registerUser.ts              # Supabase Auth API呼び出し
│   └── ui/
│       └── RegisterForm.svelte          # 登録フォーム
│
├── entities/auth-card/
│   ├── model/
│   │   └── types.ts                     # エンティティ型定義
│   └── ui/
│       └── RegistrationCard.svelte      # 登録カードコンテナ
│
└── shared/components/
    ├── model/
    │   └── melt-ui-common.ts            # Melt UI共通型定義
    └── ui/
        ├── TermsCheckbox.svelte         # Melt UI Checkbox
        ├── PasswordTooltip.svelte       # Melt UI Tooltip
        ├── PasswordStrength.svelte      # パスワード強度表示
        └── Link.svelte                  # 内部リンク
```

### 4.2 コンポーネント階層と依存関係

```
routes/register/+page.svelte
  └─> features/auth-register/ui/RegisterForm.svelte
      └─> entities/auth-card/ui/RegistrationCard.svelte
          └─> shared/components/ui/*
              ├─> TermsCheckbox.svelte
              ├─> PasswordTooltip.svelte
              └─> PasswordStrength.svelte
```

**重要**: 依存は必ず shared → entities → features → routes の順序

### 4.3 useRegister Composable設計

#### 状態管理（$state使用）

```typescript
// features/auth-register/composable/useRegister.svelte.ts
export function useRegister() {
	const formData = $state({
		email: '',
		password: '',
		confirmPassword: '',
		agreedToTerms: false
	});

	const errors = $state<Record<string, string>>({});
	const isSubmitting = $state(false);
	const serverError = $state<string | null>(null);

	// $derivedによる派生状態
	const isValid = $derived(/* バリデーションロジック */);

	// $effectによるパスワード一致チェック
	$effect(() => {
		if (formData.password && formData.confirmPassword) {
			// パスワード一致チェック
		}
	});

	return {
		formData,
		errors,
		isSubmitting,
		serverError,
		validateField,
		handleSubmit
	};
}
```

### 4.4 バリデーションスキーマ

```typescript
// features/auth-register/model/registerSchema.ts
import { z } from 'zod';

export const registerSchema = z
	.object({
		email: z.string().email('有効なメールアドレスを入力してください'),
		password: z
			.string()
			.min(8, 'パスワードは8文字以上必要です')
			.regex(/[A-Z]/, '大文字を1文字以上含めてください')
			.regex(/[a-z]/, '小文字を1文字以上含めてください')
			.regex(/[0-9]/, '数字を1文字以上含めてください'),
		confirmPassword: z.string(),
		agreedToTerms: z.boolean().refine((val) => val === true, '利用規約に同意してください')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'パスワードが一致しません',
		path: ['confirmPassword']
	});
```

## 5. 実装ガイドライン

### 5.1 実装手順（5段階）

#### Stage 1: 基本構造とルーティング

1. `/routes/register/+page.svelte` を作成
2. 基本レイアウトを設定
3. ログイン画面からのリンクを追加

#### Stage 2: UIコンポーネント実装

1. `shared/components/ui/PasswordStrength.svelte` を作成
2. `shared/components/ui/TermsCheckbox.svelte` を作成（Melt UI）
3. `shared/components/ui/PasswordTooltip.svelte` を作成（Melt UI）
4. `entities/auth-card/ui/RegistrationCard.svelte` を作成

#### Stage 3: ビジネスロジック実装

1. `features/auth-register/model/types.ts` で型定義
2. `features/auth-register/composable/useRegister.svelte.ts` を作成
3. `features/auth-register/api/registerUser.ts` でSupabase連携
4. `features/auth-register/ui/RegisterForm.svelte` で統合

#### Stage 4: エラーハンドリングとバリデーション

1. Zodスキーマによるバリデーション実装
2. エラーメッセージの表示ロジック
3. 重複メールアドレスのハンドリング

#### Stage 5: テストと最適化

1. ユニットテスト作成
2. E2Eテスト実装
3. パフォーマンス最適化

### 5.2 コード構成の重要ポイント

#### Svelte 5 Runes使用

- `$state`: リアクティブな状態管理
- `$derived`: 派生状態の効率的な計算
- `$effect`: 副作用の管理（最小限に）
- `$bindable`: プロパティの双方向バインディング

#### FSDルール厳守

- **レイヤー依存**: shared → entities → features → routes
- **composable拡張子**: 必ず `.svelte.ts` を使用
- **model配下**: 型定義のみ（ロジック実装禁止）
- **features同士**: 相互依存禁止

### 5.3 注意事項

1. **Melt UIの使用**
   - Componentsアプローチを使用（Buildersアプローチは使用しない）
   - snippetパターンで柔軟な構成を実現
   - アクセシビリティ属性を必ず設定

2. **TypeScript設定**
   - `exactOptionalPropertyTypes: true` に対応
   - undefined と optional を明確に区別

3. **エラーハンドリング**
   - ネットワークエラーは適切にキャッチ
   - ユーザーフレンドリーなメッセージ表示
   - リトライ機能の検討

## 6. テスト計画

### 6.1 ユニットテスト（Vitest）

#### 対象ファイル

- `features/auth-register/composable/useRegister.test.ts`
- `shared/components/ui/PasswordStrength.test.ts`

#### テストケース

```typescript
// バリデーションロジックのテスト
describe('useRegister', () => {
	test('メールアドレス形式の検証', () => {});
	test('パスワード強度の計算', () => {});
	test('パスワード一致の確認', () => {});
	test('利用規約同意の検証', () => {});
});

// パスワード強度計算のテスト
describe('PasswordStrength', () => {
	test('弱いパスワードの判定', () => {});
	test('中程度のパスワードの判定', () => {});
	test('強いパスワードの判定', () => {});
});
```

### 6.2 統合テスト（Vitest + MSW）

#### 対象

- Supabase Auth APIとの連携
- エラーレスポンスの処理

#### モックサーバー設定

```typescript
// MSWでSupabase APIをモック
const handlers = [
	rest.post('/auth/v1/signup', (req, res, ctx) => {
		// 成功/エラーレスポンスをモック
	})
];
```

### 6.3 E2Eテスト（Playwright）

#### テストシナリオ

```typescript
// tests/registration.spec.ts
test('完全な登録フロー', async ({ page }) => {
	await page.goto('/register');
	await page.fill('[name="email"]', 'test@example.com');
	await page.fill('[name="password"]', 'Password123');
	await page.fill('[name="confirmPassword"]', 'Password123');
	await page.check('[name="agreedToTerms"]');
	await page.click('button[type="submit"]');
	await expect(page).toHaveURL('/login');
});

test('バリデーションエラー表示', async ({ page }) => {
	// 各種バリデーションエラーのテスト
});

test('重複メールアドレス処理', async ({ page }) => {
	// 409エラーの処理テスト
});
```

### 6.4 検証コマンド

```bash
# リント実行
npm run lint

# フォーマット
npm run format

# 型チェック
npm run check

# ユニットテスト
npm run test:unit

# E2Eテスト
npm run test:e2e
```

## 7. Implementation-Agentへの引き継ぎ指示

### 7.1 実装開始方法（別チャットセッションで実行）

1. **新しいチャットセッションを開始**

2. **以下のメッセージでImplementation-Agentを起動**:

```
Implementation-Agentを使用して、
設計書: docs/01-orchestrator/user-registration_implementation_design_20250902.md
を基に実装を行ってください。

必ず以下のファイルを参照してください：
- FSDアーキテクチャルール: .claude/agents/00-ARCHITECTURE-RULES/FSD-ARCHITECTURE-RULES.md
- Svelte 5文法ルール: .claude/agents/00-ARCHITECTURE-RULES/SVELTE5-SYNTAX-RULES.md
- 実装計画: docs/01-orchestrator/IMPLEMENTATION_PLAN_user-registration_20250902.md
```

3. **実装時の優先順位**
   - Stage 1から順番に実装
   - 各Stageの完了を確認してから次へ
   - FSDルールとSvelte 5文法を厳守

### 7.2 チェックポイント

実装完了後、以下を確認：

- [ ] 全ファイルのFSDルール準拠
  - レイヤー依存順序の確認
  - composable拡張子 `.svelte.ts` の使用
  - model配下に型定義のみ配置
- [ ] TypeScript型安全性
  - exactOptionalPropertyTypes対応
  - 型エラーがないこと
- [ ] Svelte 5文法準拠
  - Runes API使用（$state, $derived, $effect, $bindable）
  - export let使用禁止
- [ ] テストケース完全性
  - 全ACのカバレッジ
  - エラーケースのテスト

### 7.3 成果物確認

実装完了時の成果物：

1. 動作する登録画面（/register）
2. Supabase Authとの連携
3. メール確認フロー
4. 全テストのパス

### 7.4 トラブルシューティング

問題が発生した場合：

1. FSDアーキテクチャルールを再確認
2. Svelte 5文法ルールを再確認
3. 詳細設計JSONを参照
4. エラーログを確認

## 8. セキュリティ考慮事項

- パスワードは常にHTTPS経由で送信
- パスワード強度の強制（8文字以上、文字種混在）
- 利用規約同意の記録（UserProfileテーブル）
- メール確認による本人確認
- レート制限の実装（将来的な拡張）

## 9. パフォーマンス最適化

- `$derived`による効率的な派生状態管理
- バリデーションの遅延実行（onblur）
- Melt UIによる軽量なUIコンポーネント
- 不要な再レンダリングの回避

## 10. 参考リンク

- [Melt UIドキュメント](https://next.melt-ui.com/components)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/runes)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Zod](https://zod.dev/)

---

## 設計完了確認

本設計書は、ユーザー新規登録機能の完全な実装に必要なすべての情報を含んでいます。
Implementation-Agentは、この設計書とFSDアーキテクチャルール、Svelte 5文法ルールを基に実装を行ってください。

作成者: Orchestrator-Agent
作成日: 2025-09-02

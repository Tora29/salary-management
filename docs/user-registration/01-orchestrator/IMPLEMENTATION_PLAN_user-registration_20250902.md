# Implementation Plan - ユーザー新規登録機能

## Stage 1: 基本構造とルーティング

Goal: 新規登録ページの作成とルーティング設定
Success Criteria:

- `/register`ページへのアクセスが可能
- 基本レイアウトの表示
- ログイン画面からのリンク設置
  Tests:
- ルーティングテスト（Playwright）
- レイアウト表示確認
  Status: [Not Started]

## Stage 2: UIコンポーネント実装

Goal: shared/components/uiとentities/uiの作成・拡張
Success Criteria:

- RegistrationCard（AuthCardの拡張版）完成
- パスワード強度インジケーター実装
- 利用規約チェックボックス（Melt UI）実装
- FSDレイヤー構造の遵守
  Tests:
- コンポーネントユニットテスト（Vitest）
- スナップショットテスト
  Status: [Not Started]

## Stage 3: ビジネスロジック実装

Goal: features層の実装とcomposable作成
Success Criteria:

- useRegister composable完成
- Supabase signUp API連携
- リアルタイムバリデーション
- データフローの確立
  Tests:
- ロジックのユニットテスト
- API呼び出しのモックテスト
- 統合テスト
  Status: [Not Started]

## Stage 4: エラーハンドリングとバリデーション

Goal: エラー処理とフォームバリデーション
Success Criteria:

- 適切なエラーメッセージ表示
- パスワード確認の一致チェック
- メールアドレス重複チェック
- 入力検証の動作
  Tests:
- エラーケースのテスト
- バリデーションテスト
- エッジケーステスト
  Status: [Not Started]

## Stage 5: テストと最適化

Goal: 完全なテストカバレッジとパフォーマンス最適化
Success Criteria:

- 全AC（受け入れ基準）の満足
- メール確認フローの動作確認
- ログイン画面との相互遷移
- パフォーマンス基準の達成
  Tests:
- E2Eテスト完全実行
- パフォーマンステスト
- セキュリティテスト
  Status: [Not Started]

## 技術スタック

- Framework: SvelteKit + Svelte 5
- Architecture: Feature-Sliced Design (FSD)
- Authentication: Supabase Auth
- UI Components: Melt UI + Custom Components
- State Management: Svelte 5 Runes
- Validation: Zod Schema
- Testing: Vitest + Playwright

## 主要な実装ファイル（予定）

```
src/
├── routes/
│   └── register/
│       └── +page.svelte
├── features/
│   └── auth-register/
│       ├── composable/
│       │   └── useRegister.svelte.ts
│       ├── api/
│       │   └── supabaseSignUp.ts
│       ├── model/
│       │   └── registerSchema.ts
│       └── ui/
│           └── RegisterForm.svelte
├── entities/
│   └── auth-card/
│       └── ui/
│           └── RegistrationCard.svelte
└── shared/
    └── components/
        └── ui/
            ├── PasswordStrength.svelte
            └── TermsCheckbox.svelte
```

# 給料・資産管理アプリ計画書

## 概要

個人の給料と資産（株式）を一元管理するWebアプリケーション。給料明細のPDF取り込みと株式ポートフォリオの時価評価を主要機能とする。

## 開発方針

Phase 1では認証機能を実装せず、ダッシュボード画面のみを構築する。ダミーデータを使用して画面表示とレイアウトを確認し、その後Phase 2以降で認証機能とデータ管理機能を追加していく。

## 技術スタック

- **Framework**: Svelte 5 + SvelteKit
- **Database ORM**: Prisma
- **Authentication**: Lucia Auth v3（Phase 2で実装）
- **Validation**: Zod
- **Database**: PostgreSQL

## 使用ライブラリ

### Phase 1（ダッシュボード構築）

```json
{
	"dependencies": {
		"@prisma/client": "^5.0.0",
		"zod": "^3.0.0",
		"@lucide/svelte": "^0.525.0"
	},
	"devDependencies": {
		"prisma": "^5.0.0",
		"tailwindcss": "^3.0.0",
		"autoprefixer": "^10.0.0",
		"postcss": "^8.0.0"
	}
}
```

### Phase 2以降（認証・PDF取込み等）

```json
{
	"dependencies": {
		"@lucia-auth/adapter-prisma": "^4.0.0",
		"lucia": "^3.0.0",
		"pdf-parse": "^1.1.1",
		"axios": "^1.0.0"
	},
	"devDependencies": {
		"@types/pdf-parse": "^1.1.1"
	}
}
```

## MVP機能仕様

### 1. ダッシュボード（Phase 1で実装）

シンプルな数値表示による財務状況の可視化

#### 表示項目

- **月収表示**:
  - 今月の給料額（初期はダミーデータ）
- **年収累計**:
  - 今年の給料合計（初期はダミーデータ）
- **総資産額**:
  - 預金残高（初期はダミーデータ）
  - 株式時価総額（初期はダミーデータ）
  - 合計資産額
- **株式評価額**:
  - 保有株式の現在価値（初期はダミーデータ）

#### Phase 1の実装方針

- 認証なしでアクセス可能
- ダミーデータを使用して表示を確認
- レスポンシブデザイン対応
- TailwindCSSでのスタイリング

### 2. 給料明細PDF取り込み機能

#### 機能詳細

- PDFファイルのドラッグ&ドロップアップロード
- PDF解析による自動データ抽出
  - 支給年月
  - 基本給
  - 各種手当
  - 控除額
  - 手取り額
- 抽出データの確認・手動修正画面
- 月別給料履歴の保存と管理

### 3. 株式ポートフォリオ管理

#### 登録情報

- 銘柄コード（例：7203）
- 銘柄名（例：トヨタ自動車）
- 購入数量
- 取得単価
- 購入日

#### 機能

- 保有株式の新規登録
- 既存株式の編集・削除
- 一覧表示（ソート・フィルタ機能）

### 4. 株価リアルタイム表示

#### 機能詳細

- 外部API連携による現在株価の取得
- 以下の情報を表示：
  - 現在株価
  - 前日比
  - 評価額（現在株価 × 保有数）
  - 評価損益（評価額 - 取得価額）
  - 損益率
- 株価の定期的な自動更新（15分間隔）

#### API候補

- Yahoo Finance API
- Alpha Vantage API
- 日本取引所グループAPI

## データベース設計

### Phase 1: 簡易版Schema（認証なし）

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Salary {
  id              String   @id @default(cuid())
  paymentDate     DateTime
  grossAmount     Decimal  @db.Decimal(10, 2)
  deduction       Decimal  @db.Decimal(10, 2)
  netAmount       Decimal  @db.Decimal(10, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([paymentDate])
}

model Stock {
  id              String   @id @default(cuid())
  symbol          String
  name            String
  quantity        Int
  purchasePrice   Decimal  @db.Decimal(10, 2)
  purchaseDate    DateTime
  currentPrice    Decimal? @db.Decimal(10, 2)
  lastUpdated     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([symbol])
}

model Asset {
  id              String   @id @default(cuid())
  type            String   // "cash", "deposit", etc.
  name            String
  amount          Decimal  @db.Decimal(12, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Phase 2: 完全版Schema（認証機能追加後）

```prisma
// User, Session モデルを追加
// 各モデルに userId を追加してリレーションを設定
```

## 画面構成

### Phase 1: ダッシュボード画面のみ

- ヘッダー（アプリ名のみ）
- 財務サマリーカード
  - 月収カード
  - 年収カード
  - 総資産カード
  - 株式評価額カード
- フッター

### Phase 2以降: 追加画面

1. **認証画面**
   - ログイン画面
   - 新規登録画面
   - パスワードリセット画面

2. **給料管理画面**
   - PDF アップロードエリア
   - 給料履歴テーブル
   - 詳細表示モーダル

3. **株式管理画面**
   - 保有株式一覧
   - 新規登録フォーム
   - 編集モーダル

## セキュリティ要件

### Phase 1（ダッシュボードのみ）

- XSS対策（Svelteの自動エスケープ）
- SQLインジェクション対策（Prisma使用）
- 環境変数による秘密情報管理

### Phase 2以降

- Lucia Auth v3による認証実装
- セッション管理
- CSRF対策
- HTTPSでの通信
- APIエンドポイントの保護

## 開発フェーズ

### Phase 1: ダッシュボード構築（3日）

- TailwindCSS設定
- Prisma設定（簡易版スキーマ）
- ダミーデータの準備
- ダッシュボード画面の実装
- レスポンシブ対応

### Phase 2: 認証機能（3日）

- Lucia Auth v3実装
- ユーザー登録・ログイン画面
- セッション管理
- 既存データのユーザー紐付け

### Phase 3: 給料管理機能（1週間）

- PDF アップロード機能
- PDF解析処理
- 給料データCRUD
- ダッシュボードとの連携

### Phase 4: 株式管理機能（1週間）

- 株式データCRUD
- 株価API連携
- リアルタイム更新機能
- ポートフォリオ表示

### Phase 5: 仕上げ（3日）

- UI/UXの改善
- エラーハンドリング
- パフォーマンス最適化
- デプロイ準備

## 今後の拡張案

- 支出管理機能
- 予算設定と通知
- データエクスポート（CSV/Excel）
- モバイルアプリ対応
- 複数通貨対応
- 投資信託・暗号資産対応

## 開発支援エージェント実装計画

プロジェクトの品質向上と開発効率化のため、以下の専用エージェントの実装を計画している。

### 実装済みエージェント

1. **svelte5-syntax-checker** ✅
   - Svelte 5の構文チェックとベストプラクティスの検証
   - ルーン（$state、$derived、$effect）の適切な使用確認

2. **typescript-type-checker** ✅
   - TypeScriptの型安全性検証
   - tsconfig.jsonの厳格な設定に基づく包括的な型チェック

### 将来実装予定のエージェント

#### Phase 1: 基盤系エージェント（優先度：高）

1. **prisma-schema-validator** 🗄️
   - Prismaスキーマファイルの構文チェック
   - リレーション定義の検証
   - インデックス最適化の提案
   - 型の整合性チェック

2. **security-analyzer** 🔒
   - XSS、SQLインジェクション、CSRF対策の確認
   - 環境変数の適切な使用チェック
   - 認証・認可の実装検証
   - 金融データ取り扱いのセキュリティ監査

3. **zod-schema-validator** ✅
   - Zodスキーマの検証
   - 型推論の確認
   - バリデーションルールの整合性チェック
   - フォームバリデーションの最適化提案

#### Phase 2: 品質向上系エージェント（優先度：中）

4. **tailwind-style-checker** 🎨
   - TailwindCSSクラスの正しい使用法確認
   - 未使用クラスの検出
   - カスタムクラスとの競合チェック
   - レスポンシブデザインの一貫性検証

5. **api-endpoint-tester** 🔌
   - SvelteKitのAPIエンドポイント（+server.ts）のテスト
   - レスポンス形式の検証
   - エラーハンドリングチェック
   - RESTful設計の準拠確認

6. **test-coverage-analyzer** 🧪
   - Vitestのテストカバレッジ分析
   - 未テストコードの特定
   - テストケースの品質評価
   - E2Eテストシナリオの提案

#### Phase 3: 最適化系エージェント（優先度：低）

7. **performance-optimizer** ⚡
   - バンドルサイズの分析
   - 不要なインポートの検出
   - レンダリングパフォーマンスの最適化提案
   - Core Web Vitalsの改善提案

8. **database-migration-helper** 📊
   - Prismaマイグレーションの生成支援
   - スキーマ変更の影響分析
   - ロールバック戦略の提案
   - データ移行スクリプトの生成

### エージェント実装のメリット

- **開発効率の向上**: 自動化されたコードレビューにより、問題を早期発見
- **品質の一貫性**: プロジェクト全体で統一されたコーディング標準を維持
- **セキュリティの強化**: 金融データを扱うアプリケーションとして必須のセキュリティチェック
- **保守性の向上**: 継続的なコード品質の監視と改善提案

### 実装スケジュール

- **Phase 1完了後**: prisma-schema-validator、security-analyzer、zod-schema-validator
- **Phase 3完了後**: tailwind-style-checker、api-endpoint-tester、test-coverage-analyzer
- **Phase 5完了後**: performance-optimizer、database-migration-helper

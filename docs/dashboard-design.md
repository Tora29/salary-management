# 給料管理システム ダッシュボード機能 設計書

## 1. 概要

### 1.1 目的

給料情報と株式資産の現在状況を一目で把握できる統合ダッシュボードを実装し、財務状況の全体像を即座に理解できるようにする。

### 1.2 主要機能

- 給料の月次推移と年間累計の視覚的表示
- 株式ポートフォリオの時価評価と損益のリアルタイム確認
- 総資産額（現金+株式）の自動計算と表示
- 最新の給料明細と株式取引の表示（各5件）
- PDF取り込みと株式登録への導線配置

## 2. アーキテクチャ

### 2.1 技術スタック

- **フロントエンド**: SvelteKit + Svelte 5（ルーンシステム）
- **アーキテクチャ**: Feature-Sliced Design (FSD)
- **データベース**: Supabase Postgres + Prisma ORM
- **認証**: Supabase Auth（サーバーサイドセッション）
- **スタイリング**: Tailwind CSS
- **グラフ**: LayerChart（Svelte専用、30KB）
- **日付処理**: date-fns
- **PDF処理**: pdf-lib
- **テーブル**: @tanstack/svelte-table

### 2.2 選定理由

| ライブラリ             | 選定理由                                             | スコア |
| ---------------------- | ---------------------------------------------------- | ------ |
| LayerChart             | Svelte 5ネイティブ、超軽量（30KB）、高パフォーマンス | 46/50  |
| date-fns               | ツリーシェイキング対応、軽量、日本語対応             | 48/50  |
| pdf-lib                | フレームワーク非依存、中量級（180KB）、高機能        | 46/50  |
| @tanstack/svelte-table | Svelte対応、軽量（20KB）、TanStack品質               | 45/50  |

## 3. 画面レイアウト

### 3.1 デスクトップレイアウト

```
┌─────────────────────────────────────────────────────┐
│                  ヘッダー（ロゴ・ユーザー情報）         │
├─────────────────────────────────────────────────────┤
│  今月の給料  │  年間推移   │ ポートフォリオ │  総資産  │
│   カード    │   カード    │    カード    │  カード  │
├─────────────────────────────────────────────────────┤
│                   年間収入推移グラフ                   │
│                 （12ヶ月分の折れ線グラフ）             │
├──────────────────────┬──────────────────────────────┤
│   クイックアクション   │     最近のアクティビティ       │
│   （3つのボタン）     │      （タイムライン）         │
└──────────────────────┴──────────────────────────────┘
```

### 3.2 モバイルレイアウト

- 全要素が縦並び（1カラム）に切り替わる
- グラフは横スクロール可能
- カードは上下マージンで区切られる

## 4. 受け入れ基準

| ID     | Given                        | When                             | Then                                             |
| ------ | ---------------------------- | -------------------------------- | ------------------------------------------------ |
| AC-001 | ユーザーがログイン済み       | ダッシュボードページにアクセス   | 今月の手取り額、支給総額、控除総額が大きく表示   |
| AC-002 | 過去12ヶ月の給料データが存在 | 年間推移グラフを表示             | 月別手取り額の折れ線グラフ、ボーナス月ハイライト |
| AC-003 | 株式資産が登録済み           | ポートフォリオセクション表示     | 総評価額、本日の損益、保有銘柄TOP5表示           |
| AC-004 | 給料と株式データが両方存在   | 総資産サマリーカード表示         | 現金資産+株式資産の合計が自動計算                |
| AC-005 | 前月のデータが存在           | 各種サマリーカード表示           | 前月比の増減が矢印とパーセンテージで表示         |
| AC-006 | ダッシュボード表示中         | クイックアクションボタンクリック | 各機能画面に遷移                                 |
| AC-007 | 直近の取引データが存在       | アクティビティセクション表示     | 時系列順に最大5件ずつ表示                        |
| AC-008 | データロード中               | ダッシュボード表示               | スケルトンローダー表示                           |
| AC-009 | APIエラー発生                | データ取得失敗                   | エラーメッセージと再試行ボタン表示               |
| AC-010 | モバイルデバイスアクセス     | ダッシュボード表示               | レスポンシブレイアウトで縦並び                   |

## 5. API設計

### 5.1 エンドポイント一覧

#### GET /api/dashboard/summary

**概要**: ダッシュボードのサマリー情報を取得

**リクエスト**:

```typescript
headers: {
	Authorization: 'Bearer token';
}
```

**レスポンス**:

```typescript
200 OK: {
  currentMonth: {
    netSalary: number;
    totalIncome: number;
    totalDeductions: number;
    previousMonthComparison: number;
  };
  yearlyTrend: Array<{
    month: string;
    netSalary: number;
    isBonus: boolean;
  }>;
  totalAssets: {
    cash: number;
    stocks: number;
    total: number;
    previousMonthComparison: number;
  };
}

401: { error: "Unauthorized" }
500: { error: "Internal Server Error" }
```

#### GET /api/dashboard/portfolio

**概要**: 株式ポートフォリオ情報を取得

**レスポンス**:

```typescript
200 OK: {
  totalValue: number;
  dailyChange: {
    amount: number;
    percentage: number;
  };
  topHoldings: Array<{
    symbol: string;
    name: string;
    value: number;
    change: number;
  }>;
}
```

#### GET /api/dashboard/activities

**概要**: 最近のアクティビティを取得

**クエリパラメータ**:

- `limit`: 取得件数（デフォルト: 5）

**レスポンス**:

```typescript
200 OK: {
  activities: Array<{
    id: string;
    type: "salary" | "stock";
    description: string;
    amount: number;
    date: string;
  }>;
}
```

## 6. コンポーネント設計

### 6.1 FSD階層構造

```
src/
├── features/dashboard/
│   ├── ui/
│   │   ├── DashboardLayout.svelte
│   │   ├── SummaryCards.svelte
│   │   ├── YearlyTrendChart.svelte
│   │   ├── PortfolioCard.svelte
│   │   ├── QuickActions.svelte
│   │   └── RecentActivities.svelte
│   ├── composable/
│   │   ├── useDashboardData.svelte.ts
│   │   └── usePortfolioCalculation.svelte.ts
│   ├── api/
│   │   ├── getDashboardSummary.ts
│   │   └── getPortfolio.ts
│   └── model/
│       └── types.ts
├── entities/
│   ├── salary/
│   │   ├── model/types.ts
│   │   └── ui/SalaryCard.svelte
│   ├── asset/
│   │   ├── model/types.ts
│   │   ├── ui/AssetCard.svelte
│   │   └── api/getAssetSummary.ts
│   └── chart/
│       └── ui/
│           ├── LineChart.svelte
│           └── PieChart.svelte
└── shared/
    ├── components/ui/
    │   ├── Skeleton.svelte
    │   └── ErrorBoundary.svelte
    └── utils/
        ├── date/formatters.ts
        ├── number/formatters.ts
        └── portfolio/calculatePortfolio.ts
```

### 6.2 主要コンポーネント仕様

#### DashboardLayout.svelte

- **責務**: ダッシュボード全体のレイアウト管理
- **Props**: なし
- **機能**: レスポンシブグリッドレイアウト、子コンポーネントの配置

#### SummaryCards.svelte

- **責務**: 4つのサマリーカード表示
- **Props**: `summary`, `loading`, `error`
- **機能**: 今月の給料、年間推移、ポートフォリオ、総資産の表示

#### YearlyTrendChart.svelte

- **責務**: 年間収入推移グラフ表示
- **Props**: `data`, `highlights`
- **機能**: entities/chart/ui/LineChartを使用した折れ線グラフ、ボーナス月ハイライト

#### PortfolioCard.svelte

- **責務**: 株式ポートフォリオサマリー表示
- **Props**: `portfolio`, `loading`, `error`
- **機能**: entities/chart/ui/PieChartを使用した円グラフ、評価額と損益表示

#### useDashboardData.svelte.ts

- **責務**: ダッシュボードデータの取得と状態管理
- **機能**:
  - 3つのAPIを並列呼び出し
  - ローディング/エラー状態管理
  - データリフレッシュ機能

#### usePortfolioCalculation.svelte.ts

- **責務**: ポートフォリオの計算ロジック管理
- **機能**:
  - 総評価額の計算
  - 損益の計算
  - shared/utils/portfolio/calculatePortfolioを使用

## 7. データモデル

### 7.1 既存モデル（変更なし）

```prisma
model Profile {
  id        String   @id @default(uuid())
  userId    String   @unique
  salaries  Salary[]
  assets    Asset[]
}

model Salary {
  id          String   @id @default(uuid())
  profileId   String
  yearMonth   String   // YYYY-MM形式
  netSalary   Decimal
  // ... 他フィールド
}

model Asset {
  id           String   @id @default(uuid())
  profileId    String
  assetType    String   // 'stock', 'bond', etc
  currentPrice Decimal
  // ... 他フィールド
}
```

### 7.2 型定義

```typescript
// features/dashboard/model/types.ts
export interface DashboardSummary {
	currentMonth: CurrentMonthData;
	yearlyTrend: YearlyTrendData[];
	totalAssets: TotalAssetsData;
}

export interface CurrentMonthData {
	netSalary: number;
	totalIncome: number;
	totalDeductions: number;
	previousMonthComparison: number;
}

export interface Portfolio {
	totalValue: number;
	dailyChange: ChangeData;
	topHoldings: Holding[];
}
```

## 8. 実装順序

### Phase 1: 基盤構築

1. 必要なライブラリのインストール
2. 型定義ファイルの作成（model/types.ts）
3. shared/utils のユーティリティ実装（formatters, calculatePortfolio）

### Phase 2: API実装

1. `/api/dashboard/summary` エンドポイント
2. `/api/dashboard/portfolio` エンドポイント
3. `/api/dashboard/activities` エンドポイント

### Phase 3: コンポーネント実装

1. shared/components/ui（Skeleton、ErrorBoundary）
2. entities/chart/ui（LineChart、PieChart）
3. entities層のカードコンポーネント（salary/asset）
4. features/dashboard層のコンポーネント

### Phase 4: 統合とテスト

1. useDashboardData composable実装
2. ダッシュボードページの統合
3. E2Eテストの作成と実行

## 9. テスト計画

### 9.1 単体テスト（Vitest）

- 各APIエンドポイントのテスト
- shared/utils/portfolio/calculatePortfolio関数のテスト
- フォーマッター関数のテスト

### 9.2 E2Eテスト（Playwright）

```typescript
test('ダッシュボード基本機能', async ({ page }) => {
	// ログイン
	await page.goto('/login');
	await login(page);

	// ダッシュボード表示
	await page.goto('/dashboard');

	// AC-001: 主要要素の表示
	await expect(page.locator('[data-testid="net-salary"]')).toBeVisible();

	// AC-006: クイックアクション
	await page.click('[data-testid="import-salary-btn"]');
	await expect(page).toHaveURL('/salary/import');
});
```

## 10. セキュリティ考慮事項

1. **認証**: 全APIエンドポイントで認証チェック必須
2. **認可**: ユーザーは自分のデータのみアクセス可能
3. **データ検証**: 入力値の型チェックとサニタイゼーション
4. **エラーハンドリング**: 詳細なエラー情報を外部に漏らさない

## 11. パフォーマンス最適化

1. **並列API呼び出し**: Promise.allで3つのAPIを同時実行
2. **遅延ローディング**: グラフライブラリは必要時のみインポート
3. **キャッシュ**: ダッシュボードデータは5分間キャッシュ
4. **スケルトンローダー**: 体感速度向上のため即座に表示

## 12. 今後の拡張予定（スコープ外）

- リアルタイム株価の自動更新
- 目標設定と達成率の計算機能
- 複数通貨対応
- ダッシュボードのカスタマイズ機能
- データのエクスポート機能

## 13. リリースチェックリスト

- [ ] 全受け入れ基準のテスト合格
- [ ] ESLintエラーなし（`npm run lint`）
- [ ] TypeScriptエラーなし（`npm run check`）
- [ ] Prettierフォーマット適用（`npm run format`）
- [ ] E2Eテスト全合格（`npm run test:e2e`）
- [ ] レスポンシブ表示確認（モバイル/タブレット/デスクトップ）
- [ ] ブラウザ互換性確認（Chrome/Firefox/Safari）

---

作成日: 2025-08-12
作成者: 給料管理システム開発チーム
バージョン: 1.0.0

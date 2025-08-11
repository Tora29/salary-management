# 機能要件定義書: 給料・資産管理システム

## 1. システム概要

### 1.1 システム名称

個人資産統合管理システム (Personal Asset Management System)

### 1.2 システムの目的

個人の給料明細と株式ポートフォリオを一元管理し、資産の見える化と投資判断支援を実現する

### 1.3 技術スタック

- フロントエンド: Svelte 5 + SvelteKit + TypeScript
- アーキテクチャ: Feature-Sliced Design (FSD)
- データベース: PostgreSQL (Prisma ORM)
- スタイリング: Tailwind CSS
- チャート: Chart.js

## 2. 機能要件一覧

### Phase 1 (MVP) - 優先度: 必須

#### FR-001: 給料明細PDF取込機能

**機能概要**
給料明細のPDFファイルをアップロードし、自動的にデータを抽出・保存する

**入力データ**

- PDFファイル（複数ファイル対応）
- ファイルサイズ上限: 10MB/ファイル

**処理内容**

1. PDFファイルの検証（形式、サイズ）
2. OCR処理によるテキスト抽出
3. パターンマッチングによるデータ解析
4. 重複チェック（同一年月の明細）
5. データベース保存

**出力データ**

```typescript
interface SalarySlipData {
	companyName: string;
	employeeName: string;
	employeeId: string;
	paymentDate: string;
	targetPeriodStart: string;
	targetPeriodEnd: string;

	// 勤怠情報
	overtimeHours: number;
	overtimeHoursOver60: number;
	lateNightHours: number;
	holidayWorkDays: number;
	paidLeaveDays: number;

	// 収入詳細
	baseSalary: number;
	overtimePay: number;
	overtimePayOver60: number;
	lateNightPay: number;
	fixedOvertimeAllowance: number;
	expenseReimbursement: number;
	transportationAllowance: number;
	stockPurchaseIncentive: number;
	totalEarnings: number;

	// 控除詳細
	healthInsurance: number;
	welfareInsurance: number;
	employmentInsurance: number;
	incomeTax: number;
	residentTax: number;
	otherDeductions: number;
	totalDeductions: number;

	// 差引支給額
	netPay: number;
}
```

**前提条件・制約事項**

- 対応PDF形式: 日本国内の標準的な給料明細フォーマット
- 初期対応: 単一企業のフォーマット（後に拡張可能）
- ブラウザ上でのPDF処理（pdf.js使用）

**受け入れ基準**

- [ ] PDFファイルのドラッグ&ドロップアップロードが可能
- [ ] 複数ファイルの一括アップロードが可能
- [ ] アップロード進捗表示
- [ ] パース成功/失敗の通知表示
- [ ] 抽出データのプレビュー表示と編集機能
- [ ] 重複データの警告表示

---

#### FR-002: 株式ポートフォリオ管理機能

**機能概要**
保有株式の登録・編集・削除と時価評価を管理する

**入力データ**

```typescript
interface StockInput {
	symbol: string; // 銘柄コード
	name: string; // 銘柄名
	quantity: number; // 保有数
	purchasePrice: number; // 取得単価
	purchaseDate: Date; // 取得日
}
```

**処理内容**

1. 株式情報の登録/更新/削除
2. 外部APIから最新株価を取得
3. 時価総額の計算
4. 損益の計算
5. ポートフォリオ構成比の算出

**出力データ**

```typescript
interface StockPortfolio {
	stocks: Stock[];
	totalInvestment: number; // 投資総額
	totalValue: number; // 現在価値
	totalGainLoss: number; // 損益合計
	totalGainLossRate: number; // 損益率
	composition: {
		symbol: string;
		percentage: number;
	}[];
}
```

**前提条件・制約事項**

- 日本株式（東証）を対象
- 株価更新頻度: 1日1回（バッチ処理）
- 初期は手動更新、後に自動更新実装

**受け入れ基準**

- [ ] 株式の新規登録フォーム
- [ ] 登録済み株式の一覧表示
- [ ] 編集・削除機能
- [ ] 現在価値の自動計算
- [ ] 損益のリアルタイム表示
- [ ] ポートフォリオ構成の円グラフ表示

---

#### FR-003: 統合ダッシュボード機能

**機能概要**
給料と資産の統合的な可視化と分析を提供する

**入力データ**

- 給料明細データ（DB）
- 株式ポートフォリオデータ（DB）
- 表示期間フィルター

**処理内容**

1. 指定期間のデータ集計
2. グラフデータの生成
3. 統計値の計算
4. トレンド分析

**出力データ**

```typescript
interface DashboardData {
	// サマリー
	totalAssets: number; // 総資産
	monthlyIncome: number; // 月収
	monthlyExpense: number; // 月支出
	savingsRate: number; // 貯蓄率

	// グラフデータ
	incomeChart: ChartData; // 収入推移
	assetChart: ChartData; // 資産推移
	portfolioChart: ChartData; // ポートフォリオ構成

	// 統計
	averageIncome: number; // 平均収入
	incomeGrowthRate: number; // 収入成長率
	portfolioROI: number; // ポートフォリオROI
}
```

**前提条件・制約事項**

- レスポンシブデザイン対応
- Chart.jsによるグラフ描画
- リアルタイム更新は不要

**受け入れ基準**

- [ ] 総資産サマリーの表示
- [ ] 月次収支グラフの表示
- [ ] 資産推移グラフの表示
- [ ] ポートフォリオ構成の可視化
- [ ] 期間フィルター機能（月/四半期/年）
- [ ] 主要指標のカード表示

---

### Phase 2 - 優先度: 推奨

#### FR-004: データエクスポート機能

**機能概要**
蓄積データをCSV/Excel形式でエクスポートする

**受け入れ基準**

- [ ] 給料明細データのエクスポート
- [ ] ポートフォリオデータのエクスポート
- [ ] カスタム期間の指定
- [ ] フォーマット選択（CSV/Excel）

---

#### FR-005: 予算管理機能

**機能概要**
月次予算の設定と実績比較を行う

**受け入れ基準**

- [ ] 予算カテゴリの設定
- [ ] 月次予算の入力
- [ ] 実績との比較表示
- [ ] アラート通知

---

### Phase 3 - 優先度: できれば

#### FR-006: 投資シミュレーション機能

**機能概要**
将来の資産推移をシミュレーションする

**受け入れ基準**

- [ ] 投資額のシミュレーション入力
- [ ] リターン率の設定
- [ ] 将来価値の計算
- [ ] シナリオ比較

---

## 3. 非機能要件

### 3.1 パフォーマンス要件

- ページロード時間: 3秒以内
- API応答時間: 1秒以内
- PDF処理時間: 10秒以内/ファイル
- 同時アクセス数: 5ユーザー（個人利用想定）

### 3.2 セキュリティ要件

- HTTPS通信必須
- PDFファイルの一時保存後削除
- 個人情報の暗号化保存
- **Auth.js認証システム**によるセッション管理
  - OAuth 2.0（Google認証）による安全なログイン
  - 自動的なCSRF攻撃対策
  - セキュアなセッション管理（JWT or データベースセッション選択可能）
  - PKCE（Proof Key for Code Exchange）自動対応

### 3.3 アクセシビリティ要件

- WCAG 2.1 Level AA準拠
- キーボードナビゲーション対応
- スクリーンリーダー対応
- カラーコントラスト比 4.5:1以上

### 3.4 ブラウザ互換性

- Chrome 最新版
- Firefox 最新版
- Safari 最新版
- Edge 最新版
- モバイルブラウザ対応

## 4. エラーハンドリング仕様

### 4.1 エラー分類

```typescript
enum ErrorType {
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	PARSE_ERROR = 'PARSE_ERROR',
	API_ERROR = 'API_ERROR',
	DATABASE_ERROR = 'DATABASE_ERROR',
	FILE_ERROR = 'FILE_ERROR',
	NETWORK_ERROR = 'NETWORK_ERROR'
}
```

### 4.2 エラー処理

- ユーザーフレンドリーなエラーメッセージ表示
- 詳細ログの記録
- リトライ機能（API/ネットワークエラー）
- フォールバック処理

## 5. データ保持ポリシー

- 給料明細データ: 無期限保持
- 株価履歴: 直近1年分
- アップロードファイル: 処理後即削除
- セッションデータ: 24時間

## 6. 次のステップ

1. ユーザーストーリーの詳細化
2. 画面設計・ワイヤーフレーム作成
3. API仕様の詳細設計
4. データモデルの最終化
5. テスト計画の策定

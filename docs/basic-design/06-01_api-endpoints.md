# APIエンドポイント仕様書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: APIアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 初版

---

## 1. API設計原則

### 1.1 基本原則

| 原則 | 説明 |
|------|------|
| **RESTful設計** | リソース指向URL、適切なHTTPメソッドの使用 |
| **一貫性** | 命名規則、レスポンス形式、エラー処理の統一 |
| **バージョニング** | URLパスベースのバージョニング (`/api/v1/`) |
| **セキュリティ** | HTTPS必須、認証/認可、入力検証 |
| **パフォーマンス** | ページネーション、キャッシング、レート制限 |
| **開発者体験** | 明確なドキュメント、予測可能な動作 |

### 1.2 URL設計規則

```
基本パターン:
/api/v1/{resource}              # コレクション
/api/v1/{resource}/{id}          # 個別リソース
/api/v1/{resource}/{id}/{action} # リソースアクション
/api/v1/{resource}/{id}/{nested} # ネストリソース

例:
/api/v1/salary-slips            # 給料明細一覧
/api/v1/salary-slips/123        # 特定の給料明細
/api/v1/salary-slips/123/pdf    # PDFダウンロード
/api/v1/portfolio/stocks        # 株式ポートフォリオ
```

### 1.3 HTTPメソッドの使用

| メソッド | 用途 | 冪等性 | 安全性 |
|---------|------|--------|--------|
| **GET** | リソース取得 | ✅ | ✅ |
| **POST** | リソース作成 | ❌ | ❌ |
| **PUT** | リソース全体更新 | ✅ | ❌ |
| **PATCH** | リソース部分更新 | ❌ | ❌ |
| **DELETE** | リソース削除 | ✅ | ❌ |

---

## 2. 認証・認可API

### 2.1 認証エンドポイント

#### POST /api/v1/auth/login
**説明**: ユーザーログイン（Google OAuth含む）

```typescript
// リクエスト
{
  email?: string;
  password?: string;
  googleToken?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl?: string;
    },
    session: {
      token: string;
      expiresAt: string;
    }
  }
}
```

#### POST /api/v1/auth/logout
**説明**: ユーザーログアウト

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    message: "Successfully logged out"
  }
}
```

#### GET /api/v1/auth/session
**説明**: 現在のセッション情報取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    user: User;
    session: UserSession;
  }
}
```

#### POST /api/v1/auth/refresh
**説明**: セッショントークンのリフレッシュ

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    token: string;
    expiresAt: string;
  }
}
```

---

## 3. ユーザー管理API

### 3.1 ユーザープロファイル

#### GET /api/v1/users/me
**説明**: 現在のユーザー情報取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    preferences: UserPreferences;
    createdAt: string;
    updatedAt: string;
  }
}
```

#### PATCH /api/v1/users/me
**説明**: ユーザー情報更新

```typescript
// リクエスト
{
  name?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

// レスポンス (200 OK)
{
  success: true,
  data: User
}
```

#### DELETE /api/v1/users/me
**説明**: アカウント削除

```typescript
// レスポンス (204 No Content)
// Body: なし
```

---

## 4. 給料明細API

### 4.1 CRUD操作

#### GET /api/v1/salary-slips
**説明**: 給料明細一覧取得

```typescript
// クエリパラメータ
{
  page?: number;           // デフォルト: 1
  limit?: number;          // デフォルト: 20
  sortBy?: string;         // デフォルト: paymentDate
  sortOrder?: 'asc'|'desc'; // デフォルト: desc
  status?: string;         // draft|confirmed|archived
  from?: string;           // ISO 8601
  to?: string;             // ISO 8601
  companyName?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: SalarySlip[],
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

#### GET /api/v1/salary-slips/{id}
**説明**: 特定の給料明細取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: SalarySlip
}
```

#### POST /api/v1/salary-slips
**説明**: 給料明細作成（手動入力）

```typescript
// リクエスト
{
  companyName: string;
  employeeName: string;
  employeeId: string;
  paymentDate: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
  attendance: AttendanceInfo;
  earnings: EarningsDetail;
  deductions: DeductionsDetail;
  currency?: CurrencyCode;
  status?: SalarySlipStatus;
}

// レスポンス (201 Created)
{
  success: true,
  data: SalarySlip
}
```

#### PUT /api/v1/salary-slips/{id}
**説明**: 給料明細全体更新

```typescript
// リクエスト
{
  companyName: string;
  employeeName: string;
  employeeId: string;
  paymentDate: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
  attendance: AttendanceInfo;
  earnings: EarningsDetail;
  deductions: DeductionsDetail;
  currency: CurrencyCode;
  status: SalarySlipStatus;
}

// レスポンス (200 OK)
{
  success: true,
  data: SalarySlip
}
```

#### PATCH /api/v1/salary-slips/{id}
**説明**: 給料明細部分更新

```typescript
// リクエスト
{
  status?: SalarySlipStatus;
  attendance?: Partial<AttendanceInfo>;
  earnings?: Partial<EarningsDetail>;
  deductions?: Partial<DeductionsDetail>;
}

// レスポンス (200 OK)
{
  success: true,
  data: SalarySlip
}
```

#### DELETE /api/v1/salary-slips/{id}
**説明**: 給料明細削除

```typescript
// レスポンス (204 No Content)
// Body: なし
```

### 4.2 PDF処理

#### POST /api/v1/salary-slips/upload
**説明**: PDF一括アップロード・解析

```typescript
// リクエスト (multipart/form-data)
{
  files: File[];  // 最大10ファイル、各10MB以下
  autoConfirm?: boolean; // 自動確定フラグ
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    processed: number;
    succeeded: number;
    failed: number;
    results: Array<{
      fileName: string;
      status: 'success' | 'failed' | 'duplicate';
      salarySlipId?: string;
      error?: string;
    }>;
  }
}
```

#### GET /api/v1/salary-slips/{id}/pdf
**説明**: 給料明細PDF再生成・ダウンロード

```typescript
// レスポンス (200 OK)
// Content-Type: application/pdf
// Content-Disposition: attachment; filename="salary_slip_202501.pdf"
// Body: PDF binary data
```

### 4.3 統計・集計

#### GET /api/v1/salary-slips/statistics
**説明**: 給料統計情報取得

```typescript
// クエリパラメータ
{
  year?: number;
  from?: string;
  to?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    averageMonthlyIncome: string;
    totalAnnualIncome: string;
    averageOvertimeHours: number;
    taxRate: number;
    savingsRate: number;
    incomeGrowthRate: number;
    monthlyBreakdown: Array<{
      month: string;
      income: string;
      deductions: string;
      netPay: string;
    }>;
  }
}
```

---

## 5. 株式ポートフォリオAPI

### 5.1 ポートフォリオ管理

#### GET /api/v1/portfolio
**説明**: ポートフォリオサマリー取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    totalInvestment: string;
    totalCurrentValue: string;
    totalUnrealizedGainLoss: string;
    totalUnrealizedGainLossRate: number;
    totalDividendReceived: string;
    composition: PortfolioComposition[];
  }
}
```

#### GET /api/v1/portfolio/stocks
**説明**: 保有株式一覧取得

```typescript
// クエリパラメータ
{
  sortBy?: 'symbol' | 'value' | 'gainLoss' | 'percentage';
  sortOrder?: 'asc' | 'desc';
}

// レスポンス (200 OK)
{
  success: true,
  data: StockPortfolio[]
}
```

#### GET /api/v1/portfolio/stocks/{id}
**説明**: 特定銘柄の詳細取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    portfolio: StockPortfolio;
    currentPrice: StockCurrentPrice;
    priceHistory: StockPriceHistory[];
    transactions: StockTransaction[];
  }
}
```

### 5.2 株式取引

#### POST /api/v1/portfolio/transactions
**説明**: 株式取引記録

```typescript
// リクエスト
{
  symbol: string;
  transactionType: 'buy' | 'sell' | 'dividend';
  quantity: string;
  pricePerShare: string;
  commission?: string;
  tax?: string;
  transactionDate: string;
  notes?: string;
}

// レスポンス (201 Created)
{
  success: true,
  data: StockTransaction
}
```

#### GET /api/v1/portfolio/transactions
**説明**: 取引履歴取得

```typescript
// クエリパラメータ
{
  page?: number;
  limit?: number;
  symbol?: string;
  type?: 'buy' | 'sell' | 'dividend';
  from?: string;
  to?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: StockTransaction[],
  meta: PaginationMeta
}
```

#### PUT /api/v1/portfolio/transactions/{id}
**説明**: 取引記録更新

```typescript
// リクエスト
{
  quantity: string;
  pricePerShare: string;
  commission: string;
  tax: string;
  transactionDate: string;
  notes?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: StockTransaction
}
```

#### DELETE /api/v1/portfolio/transactions/{id}
**説明**: 取引記録削除

```typescript
// レスポンス (204 No Content)
// Body: なし
```

### 5.3 株価情報

#### GET /api/v1/stocks/search
**説明**: 銘柄検索

```typescript
// クエリパラメータ
{
  q: string;          // 検索キーワード
  exchange?: string;  // 取引所フィルター
  limit?: number;     // デフォルト: 10
}

// レスポンス (200 OK)
{
  success: true,
  data: Array<{
    symbol: string;
    name: string;
    exchange: string;
    sector?: string;
    currentPrice?: string;
  }>
}
```

#### GET /api/v1/stocks/{symbol}/price
**説明**: 現在株価取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: StockCurrentPrice
}
```

#### GET /api/v1/stocks/{symbol}/history
**説明**: 株価履歴取得

```typescript
// クエリパラメータ
{
  period?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | '5y';
  from?: string;
  to?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: StockPriceHistory[]
}
```

#### POST /api/v1/stocks/prices/update
**説明**: 株価一括更新（バッチ処理）

```typescript
// リクエスト
{
  symbols?: string[];  // 指定なしの場合、全保有銘柄
  force?: boolean;     // キャッシュを無視
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    updated: number;
    failed: number;
    results: Array<{
      symbol: string;
      status: 'updated' | 'cached' | 'failed';
      error?: string;
    }>;
  }
}
```

---

## 6. 資産管理API

### 6.1 資産CRUD

#### GET /api/v1/assets
**説明**: 資産一覧取得

```typescript
// クエリパラメータ
{
  type?: AssetType;
  currency?: CurrencyCode;
}

// レスポンス (200 OK)
{
  success: true,
  data: Asset[]
}
```

#### GET /api/v1/assets/{id}
**説明**: 特定資産の詳細取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: Asset
}
```

#### POST /api/v1/assets
**説明**: 資産登録

```typescript
// リクエスト
{
  assetType: AssetType;
  name: string;
  description?: string;
  amount: string;
  currency: CurrencyCode;
  asOfDate: string;
  metadata?: AssetMetadata;
}

// レスポンス (201 Created)
{
  success: true,
  data: Asset
}
```

#### PUT /api/v1/assets/{id}
**説明**: 資産情報更新

```typescript
// リクエスト
{
  assetType: AssetType;
  name: string;
  description?: string;
  amount: string;
  currency: CurrencyCode;
  asOfDate: string;
  metadata?: AssetMetadata;
}

// レスポンス (200 OK)
{
  success: true,
  data: Asset
}
```

#### DELETE /api/v1/assets/{id}
**説明**: 資産削除

```typescript
// レスポンス (204 No Content)
// Body: なし
```

### 6.2 資産集計

#### GET /api/v1/assets/summary
**説明**: 資産サマリー取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    totalAssets: string;
    assetsByType: AssetByType[];
    assetsByCurrency: AssetByCurrency[];
    liquidAssets: string;
    illiquidAssets: string;
  }
}
```

---

## 7. 予算管理API

### 7.1 予算CRUD

#### GET /api/v1/budgets
**説明**: 予算一覧取得

```typescript
// クエリパラメータ
{
  status?: 'active' | 'completed' | 'cancelled';
  period?: 'monthly' | 'quarterly' | 'yearly';
}

// レスポンス (200 OK)
{
  success: true,
  data: Budget[]
}
```

#### GET /api/v1/budgets/{id}
**説明**: 特定予算の詳細取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    budget: Budget;
    categories: BudgetCategory[];
    summary: BudgetSummary;
  }
}
```

#### POST /api/v1/budgets
**説明**: 予算作成

```typescript
// リクエスト
{
  name: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  totalBudget: string;
  categories: Array<{
    categoryName: string;
    categoryType: BudgetCategoryType;
    allocatedAmount: string;
    icon?: string;
    color?: string;
  }>;
}

// レスポンス (201 Created)
{
  success: true,
  data: Budget
}
```

#### PATCH /api/v1/budgets/{id}
**説明**: 予算更新

```typescript
// リクエスト
{
  name?: string;
  totalBudget?: string;
  status?: BudgetStatus;
}

// レスポンス (200 OK)
{
  success: true,
  data: Budget
}
```

#### DELETE /api/v1/budgets/{id}
**説明**: 予算削除

```typescript
// レスポンス (204 No Content)
// Body: なし
```

### 7.2 予算追跡

#### POST /api/v1/budgets/{budgetId}/tracking
**説明**: 実績記録

```typescript
// リクエスト
{
  categoryId: string;
  amount: string;
  description?: string;
  transactionDate: string;
  source?: 'manual' | 'automated';
}

// レスポンス (201 Created)
{
  success: true,
  data: BudgetTracking
}
```

#### GET /api/v1/budgets/{budgetId}/tracking
**説明**: 実績履歴取得

```typescript
// クエリパラメータ
{
  categoryId?: string;
  from?: string;
  to?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: BudgetTracking[]
}
```

---

## 8. ダッシュボードAPI

### 8.1 統合ダッシュボード

#### GET /api/v1/dashboard
**説明**: ダッシュボードデータ取得

```typescript
// クエリパラメータ
{
  period?: '1m' | '3m' | '6m' | '1y' | 'all';
  widgets?: string[]; // 取得するウィジェットを指定
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    summary: {
      totalAssets: string;
      monthlyIncome: string;
      monthlyExpense: string;
      savingsRate: number;
      portfolioValue: string;
      portfolioGainLoss: string;
    };
    charts: {
      incomeChart: ChartData;
      assetChart: ChartData;
      portfolioChart: ChartData;
      budgetChart: ChartData;
    };
    recentActivities: Activity[];
    alerts: Alert[];
  }
}
```

### 8.2 ダッシュボード設定

#### GET /api/v1/dashboard/preferences
**説明**: ダッシュボード設定取得

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: DashboardPreference
}
```

#### PUT /api/v1/dashboard/preferences
**説明**: ダッシュボード設定更新

```typescript
// リクエスト
{
  layout?: DashboardLayout;
  widgets?: WidgetConfig[];
  chartPreferences?: ChartPreferences;
  theme?: ThemeMode;
  locale?: LocaleCode;
  timezone?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  notificationSettings?: NotificationSettings;
}

// レスポンス (200 OK)
{
  success: true,
  data: DashboardPreference
}
```

---

## 9. データエクスポートAPI

### 9.1 エクスポート機能

#### POST /api/v1/export/salary-slips
**説明**: 給料明細データエクスポート

```typescript
// リクエスト
{
  format: 'csv' | 'excel' | 'json';
  from?: string;
  to?: string;
  fields?: string[]; // エクスポートするフィールドを指定
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    downloadUrl: string;
    expiresAt: string;
  }
}
```

#### POST /api/v1/export/portfolio
**説明**: ポートフォリオデータエクスポート

```typescript
// リクエスト
{
  format: 'csv' | 'excel' | 'json';
  includeTransactions?: boolean;
  includePriceHistory?: boolean;
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    downloadUrl: string;
    expiresAt: string;
  }
}
```

#### POST /api/v1/export/report
**説明**: 統合レポート生成

```typescript
// リクエスト
{
  reportType: 'monthly' | 'quarterly' | 'annual' | 'tax';
  year: number;
  month?: number;
  format: 'pdf' | 'excel';
}

// レスポンス (200 OK)
{
  success: true,
  data: {
    downloadUrl: string;
    expiresAt: string;
  }
}
```

---

## 10. システム管理API

### 10.1 監査ログ

#### GET /api/v1/audit-logs
**説明**: 監査ログ取得

```typescript
// クエリパラメータ
{
  page?: number;
  limit?: number;
  entityType?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
}

// レスポンス (200 OK)
{
  success: true,
  data: AuditLog[],
  meta: PaginationMeta
}
```

### 10.2 ヘルスチェック

#### GET /api/v1/health
**説明**: システムヘルスチェック

```typescript
// レスポンス (200 OK)
{
  success: true,
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    timestamp: string;
    services: {
      database: 'up' | 'down';
      cache: 'up' | 'down';
      stockApi: 'up' | 'down';
    };
  }
}
```

---

## 11. エラーレスポンス

### 11.1 エラー形式

全てのエラーレスポンスは以下の形式で統一：

```typescript
{
  success: false,
  error: {
    code: ErrorCode;
    message: string;
    details?: {
      field?: string;
      reason?: string;
      [key: string]: any;
    };
  }
}
```

### 11.2 HTTPステータスコード

| ステータスコード | 説明 | エラーコード |
|----------------|------|-------------|
| **400** | Bad Request | VALIDATION_ERROR |
| **401** | Unauthorized | AUTHENTICATION_ERROR |
| **403** | Forbidden | AUTHORIZATION_ERROR |
| **404** | Not Found | NOT_FOUND |
| **409** | Conflict | CONFLICT |
| **422** | Unprocessable Entity | PARSE_ERROR |
| **429** | Too Many Requests | RATE_LIMIT_EXCEEDED |
| **500** | Internal Server Error | INTERNAL_SERVER_ERROR |
| **503** | Service Unavailable | SERVICE_UNAVAILABLE |

### 11.3 エラー例

```typescript
// 400 Bad Request
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "入力データが無効です",
    details: {
      field: "email",
      reason: "有効なメールアドレスを入力してください"
    }
  }
}

// 401 Unauthorized
{
  success: false,
  error: {
    code: "AUTHENTICATION_ERROR",
    message: "認証が必要です"
  }
}

// 404 Not Found
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "指定されたリソースが見つかりません",
    details: {
      resource: "salary-slip",
      id: "123"
    }
  }
}

// 429 Too Many Requests
{
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "リクエスト数が制限を超えました",
    details: {
      limit: 100,
      window: "15m",
      retryAfter: "2025-08-10T12:00:00Z"
    }
  }
}
```

---

## 12. 共通仕様

### 12.1 認証ヘッダー

```http
Authorization: Bearer {token}
```

### 12.2 リクエストヘッダー

```http
Content-Type: application/json
Accept: application/json
Accept-Language: ja
X-Request-ID: {uuid}
```

### 12.3 レスポンスヘッダー

```http
Content-Type: application/json
X-Request-ID: {uuid}
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1628640000
```

### 12.4 ページネーション

```typescript
// リクエスト
GET /api/v1/resource?page=2&limit=20

// レスポンス
{
  success: true,
  data: [...],
  meta: {
    page: 2,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

### 12.5 フィルタリング

```typescript
// 単一値フィルター
GET /api/v1/resource?status=active

// 複数値フィルター
GET /api/v1/resource?status=active,pending

// 範囲フィルター
GET /api/v1/resource?from=2025-01-01&to=2025-12-31

// 検索
GET /api/v1/resource?q=keyword
```

### 12.6 ソート

```typescript
// 昇順
GET /api/v1/resource?sortBy=createdAt&sortOrder=asc

// 降順
GET /api/v1/resource?sortBy=amount&sortOrder=desc

// 複数フィールド
GET /api/v1/resource?sort=+name,-createdAt
```

---

## 13. レート制限

### 13.1 制限値

| エンドポイント | 制限 | ウィンドウ |
|--------------|------|-----------|
| **認証API** | 5回 | 15分 |
| **読み取りAPI** | 100回 | 15分 |
| **書き込みAPI** | 50回 | 15分 |
| **ファイルアップロード** | 10回 | 60分 |
| **エクスポート** | 5回 | 60分 |
| **外部API連携** | 30回 | 60分 |

### 13.2 レート制限超過時の対応

```typescript
// 429 Too Many Requests
{
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "API rate limit exceeded",
    details: {
      limit: 100,
      window: "15m",
      retryAfter: "2025-08-10T12:00:00Z"
    }
  }
}

// ヘッダー情報
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1628640000
Retry-After: 900
```

---

## 14. バージョニング戦略

### 14.1 バージョン管理

```
現在のバージョン: v1
次期バージョン: v2 (計画中)

URL形式:
/api/v1/...  # 現行版
/api/v2/...  # 次期版

廃止予定:
- v1: 2026年12月31日（サポート終了）
```

### 14.2 後方互換性

- マイナーバージョン: 後方互換性を維持
- メジャーバージョン: 破壊的変更を含む可能性
- 廃止予定: 最低6ヶ月前に通知
- 移行期間: 新旧バージョン並行稼働

---

## 15. セキュリティ考慮事項

### 15.1 認証・認可

- OAuth 2.0 (Google)
- JWTトークン
- セッション管理
- RBAC（将来実装）

### 15.2 データ保護

- HTTPS必須
- 入力検証・サニタイゼーション
- SQLインジェクション対策
- XSS対策
- CSRF対策

### 15.3 監査・ログ

- 全APIアクセスログ
- 変更履歴の記録
- 異常検知アラート
- 定期的なセキュリティ監査

---

## 16. 次のステップ

1. ✅ APIエンドポイント仕様（本書）
2. → リクエスト/レスポンススキーマ詳細定義
3. → OpenAPI仕様書作成
4. → API実装
5. → APIテスト作成
6. → APIドキュメント自動生成

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| APIアーキテクト | APIアーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | APIアーキテクト |
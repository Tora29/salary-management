# APIリクエスト/レスポンススキーマ定義書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: APIアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 初版

---

## 1. スキーマ定義原則

### 1.1 データ型規約

| 型 | 説明 | 例 |
|---|------|-----|
| **string** | 文字列 | `"hello"` |
| **number** | 数値（整数・小数） | `123.45` |
| **boolean** | 真偽値 | `true` |
| **array** | 配列 | `[1, 2, 3]` |
| **object** | オブジェクト | `{ key: "value" }` |
| **null** | null値 | `null` |
| **ISODateString** | ISO 8601形式の日時 | `"2025-08-10T09:00:00Z"` |
| **MoneyAmount** | 金額（文字列で精度保持） | `"1234567.89"` |
| **Percentage** | パーセンテージ | `12.5` |
| **EntityId** | CUID形式のID | `"clh1234567890abcdefghijk"` |

### 1.2 バリデーションルール

```typescript
// 共通バリデーションルール
interface ValidationRules {
  // 文字列
  string: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
  };
  
  // 数値
  number: {
    min?: number;
    max?: number;
    multipleOf?: number;
    integer?: boolean;
  };
  
  // 配列
  array: {
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
  };
  
  // 日付
  date: {
    min?: Date;
    max?: Date;
    futureOnly?: boolean;
    pastOnly?: boolean;
  };
}
```

---

## 2. 認証・認可スキーマ

### 2.1 ログイン

#### リクエスト

```typescript
// POST /api/v1/auth/login
interface LoginRequest {
  // メール/パスワード認証
  email?: string;        // Email形式, 必須（Googleトークンがない場合）
  password?: string;     // 8文字以上, 必須（Googleトークンがない場合）
  
  // Google OAuth認証
  googleToken?: string;  // JWT形式
  
  // デバイス情報（オプション）
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };
}

// バリデーション
const loginRequestSchema = z.union([
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
    deviceInfo: deviceInfoSchema.optional(),
  }),
  z.object({
    googleToken: z.string().min(1),
    deviceInfo: deviceInfoSchema.optional(),
  }),
]);
```

#### レスポンス

```typescript
// 200 OK
interface LoginResponse {
  success: true;
  data: {
    user: {
      id: EntityId;
      email: string;
      name: string;
      avatarUrl?: string | null;
      isActive: boolean;
      preferences: UserPreferences;
    };
    session: {
      token: string;           // JWT
      refreshToken: string;    // リフレッシュトークン
      expiresAt: ISODateString;
      refreshExpiresAt: ISODateString;
    };
  };
}

// 401 Unauthorized
interface LoginErrorResponse {
  success: false;
  error: {
    code: 'AUTHENTICATION_ERROR';
    message: '認証に失敗しました';
    details?: {
      field?: 'email' | 'password' | 'googleToken';
      reason?: string;
    };
  };
}
```

### 2.2 トークンリフレッシュ

#### リクエスト

```typescript
// POST /api/v1/auth/refresh
interface RefreshTokenRequest {
  refreshToken: string;  // 必須
}
```

#### レスポンス

```typescript
// 200 OK
interface RefreshTokenResponse {
  success: true;
  data: {
    token: string;
    refreshToken: string;
    expiresAt: ISODateString;
    refreshExpiresAt: ISODateString;
  };
}
```

---

## 3. 給料明細スキーマ

### 3.1 給料明細作成

#### リクエスト

```typescript
// POST /api/v1/salary-slips
interface CreateSalarySlipRequest {
  // 基本情報
  companyName: string;           // 1-100文字, 必須
  employeeName: string;          // 1-100文字, 必須
  employeeId: string;            // 1-50文字, 必須
  
  // 支給期間
  paymentDate: ISODateString;        // 必須
  targetPeriodStart: ISODateString;  // 必須
  targetPeriodEnd: ISODateString;    // 必須, >= targetPeriodStart
  
  // 勤怠情報
  attendance: {
    overtimeHours: number;          // >= 0, デフォルト: 0
    overtimeHoursOver60: number;    // >= 0, デフォルト: 0
    lateNightHours: number;         // >= 0, デフォルト: 0
    holidayWorkDays: number;        // >= 0, 整数, デフォルト: 0
    paidLeaveDays: number;          // >= 0, デフォルト: 0
    absenceDays: number;            // >= 0, デフォルト: 0
    workingDays: number;            // >= 0, 整数, デフォルト: 0
    scheduledWorkDays: number;      // >= 0, 整数, デフォルト: 20
    lateCount?: number;             // >= 0, 整数
    earlyLeaveCount?: number;       // >= 0, 整数
  };
  
  // 収入詳細
  earnings: {
    baseSalary: MoneyAmount;              // 必須, 正の数
    overtimePay?: MoneyAmount;            // >= 0
    overtimePayOver60?: MoneyAmount;      // >= 0
    lateNightPay?: MoneyAmount;           // >= 0
    holidayWorkPay?: MoneyAmount;         // >= 0
    fixedOvertimeAllowance?: MoneyAmount; // >= 0
    transportationAllowance?: MoneyAmount; // >= 0
    housingAllowance?: MoneyAmount;       // >= 0
    familyAllowance?: MoneyAmount;        // >= 0
    qualificationAllowance?: MoneyAmount; // >= 0
    expenseReimbursement?: MoneyAmount;   // >= 0
    stockPurchaseIncentive?: MoneyAmount; // >= 0
    bonus?: MoneyAmount;                  // >= 0
    otherEarnings?: MoneyAmount;          // >= 0
    [key: string]: MoneyAmount | undefined; // 追加フィールド許可
  };
  
  // 控除詳細
  deductions: {
    healthInsurance?: MoneyAmount;        // >= 0
    welfareInsurance?: MoneyAmount;       // >= 0
    employmentInsurance?: MoneyAmount;    // >= 0
    incomeTax?: MoneyAmount;              // >= 0
    residentTax?: MoneyAmount;            // >= 0
    stockPurchase?: MoneyAmount;          // >= 0
    loan?: MoneyAmount;                   // >= 0
    unionFee?: MoneyAmount;               // >= 0
    otherDeductions?: MoneyAmount;        // >= 0
    [key: string]: MoneyAmount | undefined; // 追加フィールド許可
  };
  
  // オプション
  currency?: CurrencyCode;               // デフォルト: 'JPY'
  status?: 'draft' | 'confirmed';        // デフォルト: 'draft'
  sourceType?: 'pdf' | 'manual' | 'api'; // デフォルト: 'manual'
}

// バリデーション例
const createSalarySlipSchema = z.object({
  companyName: z.string().min(1).max(100),
  employeeName: z.string().min(1).max(100),
  employeeId: z.string().min(1).max(50),
  paymentDate: z.string().datetime(),
  targetPeriodStart: z.string().datetime(),
  targetPeriodEnd: z.string().datetime(),
  attendance: attendanceSchema,
  earnings: earningsSchema,
  deductions: deductionsSchema,
  currency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY']).optional(),
  status: z.enum(['draft', 'confirmed']).optional(),
  sourceType: z.enum(['pdf', 'manual', 'api']).optional(),
}).refine(
  data => new Date(data.targetPeriodStart) <= new Date(data.targetPeriodEnd),
  {
    message: '対象期間の開始日は終了日より前である必要があります',
    path: ['targetPeriodEnd'],
  }
);
```

#### レスポンス

```typescript
// 201 Created
interface CreateSalarySlipResponse {
  success: true;
  data: SalarySlip;
}

// SalarySlip型
interface SalarySlip {
  id: EntityId;
  userId: EntityId;
  companyName: string;
  employeeName: string;
  employeeId: string;
  paymentDate: ISODateString;
  targetPeriodStart: ISODateString;
  targetPeriodEnd: ISODateString;
  attendance: AttendanceInfo;
  earnings: EarningsDetail;
  deductions: DeductionsDetail;
  baseSalary: MoneyAmount;
  totalEarnings: MoneyAmount;      // 自動計算
  totalDeductions: MoneyAmount;    // 自動計算
  netPay: MoneyAmount;              // 自動計算
  currency: CurrencyCode;
  status: 'draft' | 'confirmed' | 'archived';
  sourceType: 'pdf' | 'manual' | 'api';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
```

### 3.2 PDF一括アップロード

#### リクエスト

```typescript
// POST /api/v1/salary-slips/upload (multipart/form-data)
interface UploadSalarySlipPdfRequest {
  files: File[];           // 最大10ファイル
  autoConfirm?: boolean;   // 自動確定フラグ, デフォルト: false
  overwriteExisting?: boolean; // 既存データ上書き, デフォルト: false
}

// ファイル制約
interface FileConstraints {
  maxFiles: 10;
  maxFileSize: 10 * 1024 * 1024; // 10MB
  allowedTypes: ['application/pdf'];
  allowedExtensions: ['.pdf'];
}
```

#### レスポンス

```typescript
// 200 OK
interface UploadSalarySlipPdfResponse {
  success: true;
  data: {
    processed: number;      // 処理ファイル数
    succeeded: number;      // 成功数
    failed: number;         // 失敗数
    duplicates: number;     // 重複数
    
    results: Array<{
      fileName: string;
      status: 'success' | 'failed' | 'duplicate';
      salarySlipId?: EntityId;  // 成功時のみ
      
      // エラー詳細（失敗時のみ）
      error?: {
        code: string;
        message: string;
        details?: {
          line?: number;
          field?: string;
          value?: any;
        };
      };
      
      // 重複情報（重複時のみ）
      duplicate?: {
        existingId: EntityId;
        paymentDate: ISODateString;
        companyName: string;
      };
      
      // 抽出データ（プレビュー用）
      extractedData?: Partial<SalarySlip>;
    }>;
    
    // 処理時間統計
    statistics: {
      totalProcessingTime: number;  // ミリ秒
      averagePerFile: number;       // ミリ秒
    };
  };
}
```

---

## 4. 株式ポートフォリオスキーマ

### 4.1 株式取引記録

#### リクエスト

```typescript
// POST /api/v1/portfolio/transactions
interface CreateStockTransactionRequest {
  // 銘柄情報
  symbol: string;                    // 1-10文字, 必須
  
  // 取引情報
  transactionType: 'buy' | 'sell' | 'dividend'; // 必須
  quantity: string;                  // 正の数, 小数点4桁まで, 必須
  pricePerShare: string;             // 正の数, 小数点2桁まで, 必須
  
  // 手数料・税金
  commission?: string;               // >= 0, 小数点2桁まで
  tax?: string;                      // >= 0, 小数点2桁まで
  
  // その他
  transactionDate: ISODateString;    // 必須
  notes?: string;                    // 最大500文字
  
  // 通貨（将来拡張用）
  currency?: CurrencyCode;           // デフォルト: 'JPY'
}

// バリデーション
const createTransactionSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  transactionType: z.enum(['buy', 'sell', 'dividend']),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  pricePerShare: z.string().regex(/^\d+(\.\d{1,2})?$/),
  commission: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  transactionDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
  currency: currencyCodeSchema.optional(),
}).refine(
  data => parseFloat(data.quantity) > 0,
  {
    message: '数量は0より大きい値を入力してください',
    path: ['quantity'],
  }
);
```

#### レスポンス

```typescript
// 201 Created
interface CreateStockTransactionResponse {
  success: true;
  data: {
    transaction: StockTransaction;
    portfolio: StockPortfolio;  // 更新後のポートフォリオ
    impact: {
      averagePriceChange: MoneyAmount;
      totalInvestmentChange: MoneyAmount;
      quantityChange: string;
    };
  };
}

// StockTransaction型
interface StockTransaction {
  id: EntityId;
  portfolioId: EntityId;
  stockId: EntityId;
  userId: EntityId;
  transactionType: 'buy' | 'sell' | 'dividend';
  quantity: string;
  pricePerShare: MoneyAmount;
  totalAmount: MoneyAmount;       // 自動計算
  commission: MoneyAmount;
  tax: MoneyAmount;
  netAmount: MoneyAmount;          // 自動計算
  transactionDate: ISODateString;
  notes?: string | null;
  createdAt: ISODateString;
}

// StockPortfolio型
interface StockPortfolio {
  id: EntityId;
  userId: EntityId;
  stockId: EntityId;
  stock: StockMaster;              // リレーション
  quantity: string;
  averagePurchasePrice: MoneyAmount;
  totalInvestment: MoneyAmount;
  currentValue: MoneyAmount;
  unrealizedGainLoss: MoneyAmount;
  unrealizedGainLossRate: Percentage;
  firstPurchaseDate?: ISODateString | null;
  lastPurchaseDate?: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
```

### 4.2 株価更新

#### リクエスト

```typescript
// POST /api/v1/stocks/prices/update
interface UpdateStockPricesRequest {
  symbols?: string[];      // 更新対象銘柄, 未指定時は全保有銘柄
  force?: boolean;         // キャッシュ無視フラグ, デフォルト: false
  source?: 'alpha_vantage' | 'yahoo_finance'; // データソース
}
```

#### レスポンス

```typescript
// 200 OK
interface UpdateStockPricesResponse {
  success: true;
  data: {
    updated: number;        // 更新成功数
    cached: number;         // キャッシュ使用数
    failed: number;         // 失敗数
    
    results: Array<{
      symbol: string;
      status: 'updated' | 'cached' | 'failed';
      
      // 価格情報（成功時）
      price?: {
        currentPrice: MoneyAmount;
        previousClose: MoneyAmount;
        dayChange: MoneyAmount;
        dayChangePercent: Percentage;
        lastUpdated: ISODateString;
      };
      
      // エラー情報（失敗時）
      error?: {
        code: string;
        message: string;
        retryable: boolean;
      };
      
      // キャッシュ情報
      cache?: {
        hitRate: Percentage;
        ttl: number;  // 秒
        expiresAt: ISODateString;
      };
    }>;
    
    // API使用状況
    apiUsage: {
      provider: string;
      callsMade: number;
      callsRemaining: number;
      resetAt: ISODateString;
    };
  };
}
```

---

## 5. ダッシュボードスキーマ

### 5.1 ダッシュボードデータ取得

#### リクエスト（クエリパラメータ）

```typescript
// GET /api/v1/dashboard
interface DashboardRequest {
  // 期間フィルター
  period?: '1m' | '3m' | '6m' | '1y' | 'all' | 'custom';
  customFrom?: ISODateString;   // period='custom'時のみ
  customTo?: ISODateString;     // period='custom'時のみ
  
  // ウィジェット選択
  widgets?: Array<
    | 'salary-summary'
    | 'portfolio-summary'
    | 'asset-summary'
    | 'budget-summary'
    | 'income-chart'
    | 'expense-chart'
    | 'portfolio-chart'
    | 'asset-chart'
    | 'recent-activities'
    | 'alerts'
  >;
  
  // データ粒度
  granularity?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  // キャッシュ制御
  noCache?: boolean;
}
```

#### レスポンス

```typescript
// 200 OK
interface DashboardResponse {
  success: true;
  data: {
    // 期間情報
    period: {
      from: ISODateString;
      to: ISODateString;
      label: string;
    };
    
    // サマリー統計
    summary: {
      // 資産総額
      totalAssets: {
        amount: MoneyAmount;
        change: MoneyAmount;
        changePercent: Percentage;
        trend: 'up' | 'down' | 'stable';
      };
      
      // 月次収支
      monthlyIncome: {
        amount: MoneyAmount;
        average: MoneyAmount;
        lastMonth: MoneyAmount;
        changePercent: Percentage;
      };
      
      monthlyExpense: {
        amount: MoneyAmount;
        average: MoneyAmount;
        lastMonth: MoneyAmount;
        changePercent: Percentage;
      };
      
      // 貯蓄率
      savingsRate: {
        current: Percentage;
        average: Percentage;
        target: Percentage;
        achievement: Percentage;
      };
      
      // ポートフォリオ
      portfolio: {
        totalValue: MoneyAmount;
        totalGainLoss: MoneyAmount;
        totalGainLossPercent: Percentage;
        dayChange: MoneyAmount;
        dayChangePercent: Percentage;
      };
    };
    
    // グラフデータ
    charts: {
      // 収入推移
      incomeChart?: {
        type: 'line' | 'bar';
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          backgroundColor?: string;
          borderColor?: string;
        }>;
        options?: ChartOptions;
      };
      
      // 資産推移
      assetChart?: {
        type: 'line' | 'area';
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          fill?: boolean;
        }>;
      };
      
      // ポートフォリオ構成
      portfolioChart?: {
        type: 'pie' | 'doughnut';
        labels: string[];
        datasets: Array<{
          data: number[];
          backgroundColor: string[];
        }>;
      };
      
      // 予算実績
      budgetChart?: {
        type: 'bar' | 'radar';
        labels: string[];
        datasets: Array<{
          label: string;
          data: number[];
          borderWidth?: number;
        }>;
      };
    };
    
    // 最近のアクティビティ
    recentActivities?: Array<{
      id: EntityId;
      type: 'salary' | 'transaction' | 'budget' | 'asset';
      action: string;
      description: string;
      amount?: MoneyAmount;
      timestamp: ISODateString;
      icon?: string;
      color?: string;
    }>;
    
    // アラート
    alerts?: Array<{
      id: EntityId;
      level: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      category: string;
      timestamp: ISODateString;
      read: boolean;
      actionUrl?: string;
      actionLabel?: string;
    }>;
    
    // メタデータ
    meta: {
      generatedAt: ISODateString;
      cacheHit: boolean;
      processingTime: number;  // ミリ秒
      dataCompleteness: Percentage;
    };
  };
}
```

---

## 6. 予算管理スキーマ

### 6.1 予算作成

#### リクエスト

```typescript
// POST /api/v1/budgets
interface CreateBudgetRequest {
  // 基本情報
  name: string;                       // 1-100文字, 必須
  period: 'monthly' | 'quarterly' | 'yearly'; // 必須
  
  // 期間
  startDate: ISODateString;           // 必須
  endDate: ISODateString;             // 必須, > startDate
  
  // 予算総額
  totalBudget: MoneyAmount;           // 正の数, 必須
  
  // カテゴリ
  categories: Array<{
    categoryName: string;             // 1-50文字, 必須
    categoryType: 'income' | 'expense' | 'saving'; // 必須
    allocatedAmount: MoneyAmount;     // >= 0, 必須
    icon?: string;                    // アイコン名
    color?: string;                   // HEX形式 (#RRGGBB)
    displayOrder?: number;            // 表示順, デフォルト: 0
    
    // 自動追跡ルール（将来拡張）
    autoTrackingRules?: {
      source: 'salary' | 'transaction';
      matchPattern?: string;
      categoryMapping?: string;
    };
  }>;
  
  // オプション設定
  settings?: {
    rolloverUnused: boolean;          // 未使用分の繰越, デフォルト: false
    alertThreshold: Percentage;       // アラート閾値, デフォルト: 80
    autoArchive: boolean;             // 自動アーカイブ, デフォルト: true
  };
}

// バリデーション
const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalBudget: moneyAmountSchema,
  categories: z.array(budgetCategorySchema).min(1).max(20),
  settings: budgetSettingsSchema.optional(),
}).refine(
  data => new Date(data.startDate) < new Date(data.endDate),
  {
    message: '開始日は終了日より前である必要があります',
    path: ['endDate'],
  }
).refine(
  data => {
    const total = data.categories
      .filter(c => c.categoryType === 'expense')
      .reduce((sum, c) => sum + parseFloat(c.allocatedAmount), 0);
    return total <= parseFloat(data.totalBudget);
  },
  {
    message: 'カテゴリ合計が予算総額を超えています',
    path: ['categories'],
  }
);
```

#### レスポンス

```typescript
// 201 Created
interface CreateBudgetResponse {
  success: true;
  data: {
    budget: Budget;
    categories: BudgetCategory[];
    summary: {
      totalAllocated: MoneyAmount;
      totalUnallocated: MoneyAmount;
      allocationRate: Percentage;
      daysRemaining: number;
    };
  };
}

// Budget型
interface Budget {
  id: EntityId;
  userId: EntityId;
  name: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: ISODateString;
  endDate: ISODateString;
  totalBudget: MoneyAmount;
  status: 'active' | 'completed' | 'cancelled';
  settings: BudgetSettings;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// BudgetCategory型
interface BudgetCategory {
  id: EntityId;
  budgetId: EntityId;
  categoryName: string;
  categoryType: 'income' | 'expense' | 'saving';
  allocatedAmount: MoneyAmount;
  actualAmount: MoneyAmount;      // 実績額（自動計算）
  variance: MoneyAmount;           // 差異（自動計算）
  variancePercent: Percentage;    // 差異率（自動計算）
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
  trackingCount: number;           // 追跡レコード数
}
```

---

## 7. エクスポートスキーマ

### 7.1 データエクスポート

#### リクエスト

```typescript
// POST /api/v1/export/{resource}
interface ExportRequest {
  // エクスポート形式
  format: 'csv' | 'excel' | 'json' | 'pdf'; // 必須
  
  // フィルター条件
  filters?: {
    dateRange?: {
      from: ISODateString;
      to: ISODateString;
    };
    status?: string[];
    categories?: string[];
    [key: string]: any;
  };
  
  // フィールド選択
  fields?: string[];              // 含めるフィールド
  excludeFields?: string[];       // 除外するフィールド
  
  // オプション
  options?: {
    includeHeaders?: boolean;     // ヘッダー行を含む, デフォルト: true
    dateFormat?: string;          // 日付形式
    numberFormat?: string;        // 数値形式
    timezone?: string;            // タイムゾーン
    language?: 'ja' | 'en';      // 言語
    
    // PDF専用オプション
    pdfOptions?: {
      orientation?: 'portrait' | 'landscape';
      pageSize?: 'A4' | 'A3' | 'Letter';
      margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    
    // Excel専用オプション
    excelOptions?: {
      sheetName?: string;
      autoFilter?: boolean;
      freezePanes?: boolean;
      formatting?: boolean;
    };
  };
}
```

#### レスポンス

```typescript
// 200 OK (非同期処理の場合)
interface ExportResponse {
  success: true;
  data: {
    exportId: EntityId;           // エクスポートID
    status: 'processing' | 'completed' | 'failed';
    downloadUrl?: string;         // 完了時のダウンロードURL
    expiresAt?: ISODateString;   // URL有効期限
    
    // 進捗情報
    progress?: {
      current: number;
      total: number;
      percentage: Percentage;
      estimatedTimeRemaining?: number; // 秒
    };
    
    // ファイル情報
    file?: {
      name: string;
      size: number;               // バイト
      mimeType: string;
      checksum: string;           // MD5
    };
    
    // エラー情報（失敗時）
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  };
}

// 200 OK (同期処理の場合 - 小規模データ)
// Content-Type: application/octet-stream
// Content-Disposition: attachment; filename="export.csv"
// Body: ファイルデータ
```

---

## 8. エラースキーマ

### 8.1 統一エラーレスポンス

```typescript
interface ErrorResponse {
  success: false;
  error: {
    // エラーコード（機械可読）
    code: ErrorCode;
    
    // エラーメッセージ（人間可読）
    message: string;
    
    // 詳細情報
    details?: {
      // バリデーションエラー
      validation?: Array<{
        field: string;
        rule: string;
        message: string;
        received?: any;
        expected?: any;
      }>;
      
      // リソース情報
      resource?: {
        type: string;
        id?: string;
        action?: string;
      };
      
      // デバッグ情報（開発環境のみ）
      debug?: {
        stack?: string;
        query?: any;
        params?: any;
        body?: any;
      };
      
      // リトライ情報
      retry?: {
        retryable: boolean;
        retryAfter?: number;      // 秒
        maxRetries?: number;
        retriesRemaining?: number;
      };
      
      // 追加の任意情報
      [key: string]: any;
    };
    
    // リクエストID（トレーシング用）
    requestId?: string;
    
    // タイムスタンプ
    timestamp: ISODateString;
  };
}

// エラーコード定義
type ErrorCode =
  // 4xx クライアントエラー
  | 'VALIDATION_ERROR'           // 400: 入力検証エラー
  | 'AUTHENTICATION_ERROR'       // 401: 認証エラー
  | 'AUTHORIZATION_ERROR'        // 403: 認可エラー
  | 'NOT_FOUND'                  // 404: リソース不存在
  | 'METHOD_NOT_ALLOWED'         // 405: メソッド不許可
  | 'CONFLICT'                   // 409: 競合・重複
  | 'GONE'                       // 410: リソース削除済み
  | 'PAYLOAD_TOO_LARGE'          // 413: ペイロード過大
  | 'UNSUPPORTED_MEDIA_TYPE'     // 415: 非対応メディアタイプ
  | 'UNPROCESSABLE_ENTITY'       // 422: 処理不能エンティティ
  | 'RATE_LIMIT_EXCEEDED'        // 429: レート制限超過
  
  // 5xx サーバーエラー
  | 'INTERNAL_SERVER_ERROR'      // 500: 内部エラー
  | 'NOT_IMPLEMENTED'            // 501: 未実装
  | 'BAD_GATEWAY'                // 502: ゲートウェイエラー
  | 'SERVICE_UNAVAILABLE'        // 503: サービス利用不可
  | 'GATEWAY_TIMEOUT'            // 504: ゲートウェイタイムアウト
  
  // ビジネスロジックエラー
  | 'PARSE_ERROR'                // PDF解析エラー
  | 'FILE_ERROR'                 // ファイル処理エラー
  | 'NETWORK_ERROR'              // ネットワークエラー
  | 'DATABASE_ERROR'             // データベースエラー
  | 'EXTERNAL_API_ERROR'         // 外部APIエラー
  | 'INSUFFICIENT_FUNDS'         // 残高不足
  | 'DUPLICATE_ENTRY'            // 重複エントリ
  | 'QUOTA_EXCEEDED'             // クォータ超過
  | 'MAINTENANCE_MODE';          // メンテナンスモード
```

### 8.2 エラーレスポンス例

```typescript
// 400 Bad Request - バリデーションエラー
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "入力データが無効です",
    details: {
      validation: [
        {
          field: "email",
          rule: "email",
          message: "有効なメールアドレスを入力してください",
          received: "invalid-email",
          expected: "email@example.com"
        },
        {
          field: "amount",
          rule: "min",
          message: "金額は0以上である必要があります",
          received: -100,
          expected: ">= 0"
        }
      ]
    },
    requestId: "req_abc123",
    timestamp: "2025-08-10T09:00:00Z"
  }
}

// 404 Not Found - リソース不存在
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "指定されたリソースが見つかりません",
    details: {
      resource: {
        type: "salary-slip",
        id: "clh1234567890",
        action: "get"
      }
    },
    requestId: "req_def456",
    timestamp: "2025-08-10T09:00:00Z"
  }
}

// 429 Too Many Requests - レート制限
{
  success: false,
  error: {
    code: "RATE_LIMIT_EXCEEDED",
    message: "APIリクエスト数が制限を超えました",
    details: {
      retry: {
        retryable: true,
        retryAfter: 900,
        maxRetries: 3,
        retriesRemaining: 2
      },
      rateLimit: {
        limit: 100,
        window: "15m",
        remaining: 0,
        resetAt: "2025-08-10T09:15:00Z"
      }
    },
    requestId: "req_ghi789",
    timestamp: "2025-08-10T09:00:00Z"
  }
}

// 500 Internal Server Error
{
  success: false,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "サーバー内部エラーが発生しました",
    details: {
      debug: {
        // 開発環境のみ
        stack: "Error: Database connection failed\n  at...",
        query: "SELECT * FROM...",
        params: { userId: "123" }
      }
    },
    requestId: "req_jkl012",
    timestamp: "2025-08-10T09:00:00Z"
  }
}
```

---

## 9. ページネーション・フィルタリングスキーマ

### 9.1 ページネーション

```typescript
// リクエスト（クエリパラメータ）
interface PaginationRequest {
  page?: number;        // ページ番号, デフォルト: 1, 最小: 1
  limit?: number;       // 件数/ページ, デフォルト: 20, 最大: 100
  cursor?: string;      // カーソルベースページネーション用
}

// レスポンス
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string;  // カーソルベース用
      prevCursor?: string;  // カーソルベース用
    };
  };
  links?: {
    first: string;
    last: string;
    next?: string;
    prev?: string;
  };
}
```

### 9.2 フィルタリング・ソート

```typescript
// リクエスト（クエリパラメータ）
interface FilterSortRequest {
  // フィルタリング
  filter?: {
    [field: string]: string | string[] | {
      operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between';
      value: any;
    };
  };
  
  // ソート
  sort?: string | string[];  // 例: "name", "-createdAt", ["name", "-createdAt"]
  
  // 検索
  q?: string;               // 全文検索
  search?: {
    fields: string[];       // 検索対象フィールド
    query: string;          // 検索クエリ
    fuzzy?: boolean;        // あいまい検索
  };
  
  // フィールド選択
  fields?: string[];        // 含めるフィールド
  exclude?: string[];       // 除外するフィールド
  
  // 関連データ
  include?: string[];       // 含める関連データ
  expand?: string[];        // 展開する関連データ
}

// 使用例
GET /api/v1/salary-slips?
  filter[status]=confirmed&
  filter[paymentDate][operator]=between&
  filter[paymentDate][value]=2025-01-01,2025-12-31&
  sort=-paymentDate&
  q=ボーナス&
  fields=id,paymentDate,netPay&
  include=attachments
```

---

## 10. WebSocket/リアルタイムスキーマ

### 10.1 WebSocket接続

```typescript
// 接続確立
interface WebSocketConnect {
  type: 'connect';
  data: {
    token: string;          // 認証トークン
    subscriptions?: string[]; // 購読チャンネル
  };
}

// 接続確認
interface WebSocketConnected {
  type: 'connected';
  data: {
    connectionId: string;
    subscribedChannels: string[];
  };
}
```

### 10.2 リアルタイム更新

```typescript
// 株価更新通知
interface StockPriceUpdate {
  type: 'stock_price_update';
  channel: 'portfolio';
  data: {
    symbol: string;
    price: MoneyAmount;
    change: MoneyAmount;
    changePercent: Percentage;
    timestamp: ISODateString;
  };
}

// アラート通知
interface AlertNotification {
  type: 'alert';
  channel: 'notifications';
  data: {
    id: EntityId;
    level: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    category: string;
    actionRequired: boolean;
  };
}

// 進捗更新
interface ProgressUpdate {
  type: 'progress';
  channel: string;
  data: {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: Percentage;
    message?: string;
  };
}
```

---

## 11. 次のステップ

1. ✅ APIエンドポイント仕様
2. ✅ リクエスト/レスポンススキーマ定義（本書）
3. → OpenAPI仕様書作成
4. → Zodスキーマ実装
5. → APIクライアント生成
6. → E2Eテスト作成

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
# TypeScriptインターフェース定義書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: データモデリングアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 初版

---

## 1. ドメインモデル型定義

### 1.1 基本型定義

```typescript
// src/shared/components/model/common.ts

/**
 * データベースID型（CUID）
 */
export type EntityId = string;

/**
 * ISO 8601形式の日時文字列
 */
export type ISODateString = string;

/**
 * 通貨コード（ISO 4217）
 */
export type CurrencyCode = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CNY';

/**
 * 金額を表す型（文字列で精度を保持）
 */
export type MoneyAmount = string;

/**
 * パーセンテージ（-100.00 ~ 10000.00）
 */
export type Percentage = number;

/**
 * 共通のタイムスタンプフィールド
 */
export interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * ページネーション用の型
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * ページネーションレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * APIエラーレスポンス
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

---

## 2. ユーザー管理ドメイン

### 2.1 User型定義

```typescript
// src/entities/user/model/types.ts

import type { EntityId, ISODateString, Timestamps } from '@/shared/types/common';

/**
 * ユーザーエンティティ
 */
export interface User extends Timestamps {
  id: EntityId;
  email: string;
  name: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  preferences: UserPreferences;
  emailVerifiedAt?: ISODateString | null;
  lastLoginAt?: ISODateString | null;
}

/**
 * ユーザー設定
 */
export interface UserPreferences {
  defaultCurrency: CurrencyCode;
  fiscalYearStart: number;        // 1-12
  salaryDayOfMonth: number;        // 1-31
  notificationEmail: boolean;
  notificationPush: boolean;
  privacyMode: boolean;
  dataRetentionYears: number;
}

/**
 * ユーザーセッション
 */
export interface UserSession extends Timestamps {
  id: EntityId;
  userId: EntityId;
  sessionToken: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: DeviceInfo | null;
  expiresAt: ISODateString;
  lastActivityAt: ISODateString;
}

/**
 * デバイス情報
 */
export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  isMobile: boolean;
}

/**
 * 監査ログ
 */
export interface AuditLog {
  id: EntityId;
  userId?: EntityId | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: ISODateString;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'view';
```

### 2.2 User Zodスキーマ

```typescript
// src/entities/user/model/schema.ts

import { z } from 'zod';

/**
 * ユーザー設定のスキーマ
 */
export const userPreferencesSchema = z.object({
  defaultCurrency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY']).default('JPY'),
  fiscalYearStart: z.number().min(1).max(12).default(4),
  salaryDayOfMonth: z.number().min(1).max(31).default(25),
  notificationEmail: z.boolean().default(false),
  notificationPush: z.boolean().default(false),
  privacyMode: z.boolean().default(false),
  dataRetentionYears: z.number().min(1).max(10).default(5),
});

/**
 * ユーザー作成入力スキーマ
 */
export const createUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  googleId: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  preferences: userPreferencesSchema.optional(),
});

/**
 * ユーザー更新入力スキーマ
 */
export const updateUserSchema = createUserSchema.partial();

/**
 * ログイン入力スキーマ
 */
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(), // OAuth使用時は不要
  googleToken: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

---

## 3. 給料管理ドメイン

### 3.1 SalarySlip型定義

```typescript
// src/entities/salary-slip/model/types.ts

import type { EntityId, ISODateString, MoneyAmount, CurrencyCode, Timestamps } from '@/shared/types/common';

/**
 * 給料明細エンティティ
 */
export interface SalarySlip extends Timestamps {
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
  totalEarnings: MoneyAmount;
  totalDeductions: MoneyAmount;
  netPay: MoneyAmount;
  currency: CurrencyCode;
  status: SalarySlipStatus;
  sourceType: SalarySlipSourceType;
}

export type SalarySlipStatus = 'draft' | 'confirmed' | 'archived';
export type SalarySlipSourceType = 'pdf' | 'manual' | 'api';

/**
 * 勤怠情報
 */
export interface AttendanceInfo {
  overtimeHours: number;
  overtimeHoursOver60: number;
  lateNightHours: number;
  holidayWorkDays: number;
  paidLeaveDays: number;
  absenceDays: number;
  workingDays: number;
  scheduledWorkDays: number;
  lateCount?: number;
  earlyLeaveCount?: number;
}

/**
 * 収入詳細
 */
export interface EarningsDetail {
  baseSalary: MoneyAmount;
  overtimePay: MoneyAmount;
  overtimePayOver60: MoneyAmount;
  lateNightPay: MoneyAmount;
  holidayWorkPay: MoneyAmount;
  fixedOvertimeAllowance: MoneyAmount;
  transportationAllowance: MoneyAmount;
  housingAllowance: MoneyAmount;
  familyAllowance: MoneyAmount;
  qualificationAllowance: MoneyAmount;
  expenseReimbursement: MoneyAmount;
  stockPurchaseIncentive: MoneyAmount;
  bonus: MoneyAmount;
  otherEarnings: MoneyAmount;
  [key: string]: MoneyAmount;
}

/**
 * 控除詳細
 */
export interface DeductionsDetail {
  healthInsurance: MoneyAmount;
  welfareInsurance: MoneyAmount;
  employmentInsurance: MoneyAmount;
  incomeTax: MoneyAmount;
  residentTax: MoneyAmount;
  stockPurchase: MoneyAmount;
  loan: MoneyAmount;
  unionFee: MoneyAmount;
  otherDeductions: MoneyAmount;
  [key: string]: MoneyAmount;
}

/**
 * 給料明細添付ファイル
 */
export interface SalarySlipAttachment {
  id: EntityId;
  salarySlipId: EntityId;
  fileName: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  checksum: string;
  uploadedAt: ISODateString;
}

/**
 * 給料統計
 */
export interface SalaryStatistics {
  averageMonthlyIncome: MoneyAmount;
  totalAnnualIncome: MoneyAmount;
  averageOvertimeHours: number;
  taxRate: Percentage;
  savingsRate: Percentage;
  incomeGrowthRate: Percentage;
}
```

### 3.2 SalarySlip Zodスキーマ

```typescript
// src/entities/salary-slip/model/schema.ts

import { z } from 'zod';

/**
 * 金額の検証スキーマ
 */
const moneyAmountSchema = z.string().regex(
  /^\d+(\.\d{1,2})?$/,
  '有効な金額を入力してください'
);

/**
 * 勤怠情報スキーマ
 */
export const attendanceInfoSchema = z.object({
  overtimeHours: z.number().min(0).default(0),
  overtimeHoursOver60: z.number().min(0).default(0),
  lateNightHours: z.number().min(0).default(0),
  holidayWorkDays: z.number().min(0).int().default(0),
  paidLeaveDays: z.number().min(0).default(0),
  absenceDays: z.number().min(0).default(0),
  workingDays: z.number().min(0).int().default(0),
  scheduledWorkDays: z.number().min(0).int().default(20),
  lateCount: z.number().min(0).int().optional(),
  earlyLeaveCount: z.number().min(0).int().optional(),
});

/**
 * 収入詳細スキーマ
 */
export const earningsDetailSchema = z.object({
  baseSalary: moneyAmountSchema,
  overtimePay: moneyAmountSchema.default('0'),
  overtimePayOver60: moneyAmountSchema.default('0'),
  lateNightPay: moneyAmountSchema.default('0'),
  holidayWorkPay: moneyAmountSchema.default('0'),
  fixedOvertimeAllowance: moneyAmountSchema.default('0'),
  transportationAllowance: moneyAmountSchema.default('0'),
  housingAllowance: moneyAmountSchema.default('0'),
  familyAllowance: moneyAmountSchema.default('0'),
  qualificationAllowance: moneyAmountSchema.default('0'),
  expenseReimbursement: moneyAmountSchema.default('0'),
  stockPurchaseIncentive: moneyAmountSchema.default('0'),
  bonus: moneyAmountSchema.default('0'),
  otherEarnings: moneyAmountSchema.default('0'),
}).catchall(moneyAmountSchema);

/**
 * 控除詳細スキーマ
 */
export const deductionsDetailSchema = z.object({
  healthInsurance: moneyAmountSchema.default('0'),
  welfareInsurance: moneyAmountSchema.default('0'),
  employmentInsurance: moneyAmountSchema.default('0'),
  incomeTax: moneyAmountSchema.default('0'),
  residentTax: moneyAmountSchema.default('0'),
  stockPurchase: moneyAmountSchema.default('0'),
  loan: moneyAmountSchema.default('0'),
  unionFee: moneyAmountSchema.default('0'),
  otherDeductions: moneyAmountSchema.default('0'),
}).catchall(moneyAmountSchema);

/**
 * 給料明細作成スキーマ
 */
export const createSalarySlipSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です'),
  employeeName: z.string().min(1, '従業員名は必須です'),
  employeeId: z.string().min(1, '従業員IDは必須です'),
  paymentDate: z.string().datetime(),
  targetPeriodStart: z.string().datetime(),
  targetPeriodEnd: z.string().datetime(),
  attendance: attendanceInfoSchema,
  earnings: earningsDetailSchema,
  deductions: deductionsDetailSchema,
  currency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY']).default('JPY'),
  status: z.enum(['draft', 'confirmed', 'archived']).default('draft'),
  sourceType: z.enum(['pdf', 'manual', 'api']).default('manual'),
}).refine(
  (data) => new Date(data.targetPeriodStart) <= new Date(data.targetPeriodEnd),
  {
    message: '対象期間の開始日は終了日より前である必要があります',
    path: ['targetPeriodEnd'],
  }
);

/**
 * PDFアップロードスキーマ
 */
export const uploadPdfSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, '10MB以下のファイルを選択してください')
    .refine((file) => file.type === 'application/pdf', 'PDFファイルを選択してください'),
});

export type CreateSalarySlipInput = z.infer<typeof createSalarySlipSchema>;
export type UploadPdfInput = z.infer<typeof uploadPdfSchema>;
```

---

## 4. 株式ポートフォリオドメイン

### 4.1 Stock型定義

```typescript
// src/entities/stock/model/types.ts

import type { EntityId, ISODateString, MoneyAmount, Percentage, CurrencyCode, Timestamps } from '@/shared/types/common';

/**
 * 株式マスタ
 */
export interface StockMaster extends Timestamps {
  id: EntityId;
  symbol: string;
  name: string;
  exchange: StockExchange;
  sector?: string | null;
  industry?: string | null;
  marketCap?: MoneyAmount | null;
  currency: CurrencyCode;
  isActive: boolean;
  listedDate?: ISODateString | null;
  delistedDate?: ISODateString | null;
}

export type StockExchange = 'TSE' | 'NYSE' | 'NASDAQ' | 'LSE' | 'HKEX' | 'SSE' | 'SZSE';

/**
 * 株式ポートフォリオ
 */
export interface StockPortfolio extends Timestamps {
  id: EntityId;
  userId: EntityId;
  stockId: EntityId;
  stock?: StockMaster;
  quantity: string;  // Decimal型なので文字列
  averagePurchasePrice: MoneyAmount;
  totalInvestment: MoneyAmount;
  currentValue: MoneyAmount;
  unrealizedGainLoss: MoneyAmount;
  unrealizedGainLossRate: Percentage;
  firstPurchaseDate?: ISODateString | null;
  lastPurchaseDate?: ISODateString | null;
}

/**
 * 株式取引
 */
export interface StockTransaction {
  id: EntityId;
  portfolioId: EntityId;
  stockId: EntityId;
  userId: EntityId;
  transactionType: TransactionType;
  quantity: string;
  pricePerShare: MoneyAmount;
  totalAmount: MoneyAmount;
  commission: MoneyAmount;
  tax: MoneyAmount;
  transactionDate: ISODateString;
  notes?: string | null;
  createdAt: ISODateString;
}

export type TransactionType = 'buy' | 'sell' | 'dividend';

/**
 * 現在株価
 */
export interface StockCurrentPrice {
  id: EntityId;
  stockId: EntityId;
  currentPrice: MoneyAmount;
  previousClose: MoneyAmount;
  dayChange: MoneyAmount;
  dayChangePercent: Percentage;
  dayHigh: MoneyAmount;
  dayLow: MoneyAmount;
  volume: string;  // BigInt型なので文字列
  marketTime: ISODateString;
  lastUpdated: ISODateString;
}

/**
 * 株価履歴
 */
export interface StockPriceHistory {
  id: EntityId;
  stockId: EntityId;
  date: ISODateString;
  open: MoneyAmount;
  high: MoneyAmount;
  low: MoneyAmount;
  close: MoneyAmount;
  adjustedClose: MoneyAmount;
  volume: string;
  createdAt: ISODateString;
}

/**
 * ポートフォリオサマリー
 */
export interface PortfolioSummary {
  totalInvestment: MoneyAmount;
  totalCurrentValue: MoneyAmount;
  totalUnrealizedGainLoss: MoneyAmount;
  totalUnrealizedGainLossRate: Percentage;
  totalDividendReceived: MoneyAmount;
  composition: PortfolioComposition[];
}

/**
 * ポートフォリオ構成
 */
export interface PortfolioComposition {
  stockId: EntityId;
  symbol: string;
  name: string;
  value: MoneyAmount;
  percentage: Percentage;
  gainLoss: MoneyAmount;
  gainLossRate: Percentage;
}
```

### 4.2 Stock Zodスキーマ

```typescript
// src/entities/stock/model/schema.ts

import { z } from 'zod';

/**
 * 株式取引作成スキーマ
 */
export const createStockTransactionSchema = z.object({
  symbol: z.string().min(1, '銘柄コードは必須です'),
  transactionType: z.enum(['buy', 'sell', 'dividend']),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/, '有効な数量を入力してください'),
  pricePerShare: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な単価を入力してください'),
  commission: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な手数料を入力してください').default('0'),
  tax: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な税金を入力してください').default('0'),
  transactionDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const quantity = parseFloat(data.quantity);
    return quantity > 0;
  },
  {
    message: '数量は0より大きい値を入力してください',
    path: ['quantity'],
  }
);

/**
 * 株式検索スキーマ
 */
export const searchStockSchema = z.object({
  query: z.string().min(1, '検索キーワードを入力してください'),
  exchange: z.enum(['TSE', 'NYSE', 'NASDAQ', 'LSE', 'HKEX', 'SSE', 'SZSE']).optional(),
  sector: z.string().optional(),
});

/**
 * 株価更新リクエストスキーマ
 */
export const updateStockPriceSchema = z.object({
  symbols: z.array(z.string()).min(1, '少なくとも1つの銘柄を指定してください'),
  force: z.boolean().default(false),
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionSchema>;
export type SearchStockInput = z.infer<typeof searchStockSchema>;
export type UpdateStockPriceInput = z.infer<typeof updateStockPriceSchema>;
```

---

## 5. 資産管理ドメイン

### 5.1 Asset型定義

```typescript
// src/entities/asset/model/types.ts

import type { EntityId, ISODateString, MoneyAmount, CurrencyCode, Timestamps } from '@/shared/types/common';

/**
 * 資産エンティティ
 */
export interface Asset extends Timestamps {
  id: EntityId;
  userId: EntityId;
  assetType: AssetType;
  name: string;
  description?: string | null;
  amount: MoneyAmount;
  currency: CurrencyCode;
  asOfDate: ISODateString;
  metadata?: AssetMetadata | null;
}

export type AssetType = 'cash' | 'deposit' | 'bond' | 'realestate' | 'crypto' | 'other';

/**
 * 資産メタデータ
 */
export interface AssetMetadata {
  // 預金用
  bankName?: string;
  accountNumber?: string;
  interestRate?: number;
  maturityDate?: ISODateString;
  
  // 不動産用
  address?: string;
  area?: number;
  purchaseDate?: ISODateString;
  purchasePrice?: MoneyAmount;
  
  // 暗号資産用
  walletAddress?: string;
  quantity?: string;
  exchangeName?: string;
  
  // その他の拡張フィールド
  [key: string]: any;
}

/**
 * 資産サマリー
 */
export interface AssetSummary {
  totalAssets: MoneyAmount;
  assetsByType: AssetByType[];
  assetsByCurrency: AssetByCurrency[];
  liquidAssets: MoneyAmount;
  illiquidAssets: MoneyAmount;
}

/**
 * タイプ別資産
 */
export interface AssetByType {
  assetType: AssetType;
  totalAmount: MoneyAmount;
  percentage: Percentage;
  count: number;
}

/**
 * 通貨別資産
 */
export interface AssetByCurrency {
  currency: CurrencyCode;
  totalAmount: MoneyAmount;
  convertedAmount: MoneyAmount;  // JPY換算
  percentage: Percentage;
}
```

### 5.2 Asset Zodスキーマ

```typescript
// src/entities/asset/model/schema.ts

import { z } from 'zod';

/**
 * 資産作成スキーマ
 */
export const createAssetSchema = z.object({
  assetType: z.enum(['cash', 'deposit', 'bond', 'realestate', 'crypto', 'other']),
  name: z.string().min(1, '資産名は必須です').max(100),
  description: z.string().max(500).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な金額を入力してください'),
  currency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY']).default('JPY'),
  asOfDate: z.string().datetime().default(() => new Date().toISOString()),
  metadata: z.record(z.any()).optional(),
});

/**
 * 資産更新スキーマ
 */
export const updateAssetSchema = createAssetSchema.partial();

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
```

---

## 6. 予算管理ドメイン

### 6.1 Budget型定義

```typescript
// src/entities/budget/model/types.ts

import type { EntityId, ISODateString, MoneyAmount, Timestamps } from '@/shared/types/common';

/**
 * 予算エンティティ
 */
export interface Budget extends Timestamps {
  id: EntityId;
  userId: EntityId;
  name: string;
  period: BudgetPeriod;
  startDate: ISODateString;
  endDate: ISODateString;
  totalBudget: MoneyAmount;
  status: BudgetStatus;
  categories?: BudgetCategory[];
}

export type BudgetPeriod = 'monthly' | 'quarterly' | 'yearly';
export type BudgetStatus = 'active' | 'completed' | 'cancelled';

/**
 * 予算カテゴリ
 */
export interface BudgetCategory {
  id: EntityId;
  budgetId: EntityId;
  categoryName: string;
  categoryType: BudgetCategoryType;
  allocatedAmount: MoneyAmount;
  actualAmount: MoneyAmount;
  variance: MoneyAmount;
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
  trackings?: BudgetTracking[];
}

export type BudgetCategoryType = 'income' | 'expense' | 'saving';

/**
 * 予算追跡
 */
export interface BudgetTracking {
  id: EntityId;
  categoryId: EntityId;
  amount: MoneyAmount;
  description?: string | null;
  transactionDate: ISODateString;
  source: TrackingSource;
  createdAt: ISODateString;
}

export type TrackingSource = 'manual' | 'automated';

/**
 * 予算サマリー
 */
export interface BudgetSummary {
  totalBudget: MoneyAmount;
  totalActual: MoneyAmount;
  totalVariance: MoneyAmount;
  variancePercentage: Percentage;
  categorySummaries: CategorySummary[];
  isOnTrack: boolean;
  projectedEndAmount: MoneyAmount;
}

/**
 * カテゴリサマリー
 */
export interface CategorySummary {
  categoryId: EntityId;
  categoryName: string;
  categoryType: BudgetCategoryType;
  allocatedAmount: MoneyAmount;
  actualAmount: MoneyAmount;
  variance: MoneyAmount;
  variancePercentage: Percentage;
  trend: 'up' | 'down' | 'stable';
}
```

### 6.2 Budget Zodスキーマ

```typescript
// src/entities/budget/model/schema.ts

import { z } from 'zod';

/**
 * 予算カテゴリスキーマ
 */
const budgetCategorySchema = z.object({
  categoryName: z.string().min(1, 'カテゴリ名は必須です'),
  categoryType: z.enum(['income', 'expense', 'saving']),
  allocatedAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な金額を入力してください'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

/**
 * 予算作成スキーマ
 */
export const createBudgetSchema = z.object({
  name: z.string().min(1, '予算名は必須です').max(100),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalBudget: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な金額を入力してください'),
  categories: z.array(budgetCategorySchema).min(1, '少なくとも1つのカテゴリが必要です'),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: '開始日は終了日より前である必要があります',
    path: ['endDate'],
  }
);

/**
 * 予算追跡作成スキーマ
 */
export const createBudgetTrackingSchema = z.object({
  categoryId: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, '有効な金額を入力してください'),
  description: z.string().max(200).optional(),
  transactionDate: z.string().datetime(),
  source: z.enum(['manual', 'automated']).default('manual'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateBudgetTrackingInput = z.infer<typeof createBudgetTrackingSchema>;
```

---

## 7. ダッシュボード設定

### 7.1 Dashboard型定義

```typescript
// src/entities/dashboard/model/types.ts

import type { EntityId, ISODateString } from '@/shared/types/common';

/**
 * ダッシュボード設定
 */
export interface DashboardPreference {
  id: EntityId;
  userId: EntityId;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  chartPreferences: ChartPreferences;
  theme: ThemeMode;
  locale: LocaleCode;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationSettings: NotificationSettings;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type ThemeMode = 'light' | 'dark' | 'auto';
export type LocaleCode = 'ja' | 'en';

/**
 * ダッシュボードレイアウト
 */
export interface DashboardLayout {
  gridColumns: number;
  gridGap: number;
  containerPadding: number;
  breakpoints: {
    lg: number;
    md: number;
    sm: number;
    xs: number;
  };
}

/**
 * ウィジェット設定
 */
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  isVisible: boolean;
  refreshInterval?: number;
}

export type WidgetType = 
  | 'salary-summary'
  | 'portfolio-summary'
  | 'asset-summary'
  | 'budget-summary'
  | 'income-chart'
  | 'expense-chart'
  | 'portfolio-chart'
  | 'asset-chart'
  | 'recent-transactions'
  | 'alerts';

/**
 * グラフ設定
 */
export interface ChartPreferences {
  defaultChartType: 'line' | 'bar' | 'pie' | 'doughnut';
  colorScheme: string[];
  showLegend: boolean;
  showTooltip: boolean;
  animationDuration: number;
  dateFormat: string;
  numberFormat: string;
}

/**
 * 通知設定
 */
export interface NotificationSettings {
  salaryAlert: boolean;
  portfolioAlert: boolean;
  budgetAlert: boolean;
  priceAlert: boolean;
  alertThresholds: {
    portfolioChangePercent: number;
    budgetOverrunPercent: number;
    priceChangePercent: number;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
  };
}
```

### 7.2 Dashboard Zodスキーマ

```typescript
// src/entities/dashboard/model/schema.ts

import { z } from 'zod';

/**
 * ウィジェット設定スキーマ
 */
const widgetConfigSchema = z.object({
  id: z.string(),
  type: z.enum([
    'salary-summary',
    'portfolio-summary',
    'asset-summary',
    'budget-summary',
    'income-chart',
    'expense-chart',
    'portfolio-chart',
    'asset-chart',
    'recent-transactions',
    'alerts',
  ]),
  title: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
  config: z.record(z.any()).default({}),
  isVisible: z.boolean().default(true),
  refreshInterval: z.number().optional(),
});

/**
 * ダッシュボード設定更新スキーマ
 */
export const updateDashboardPreferenceSchema = z.object({
  layout: z.object({
    gridColumns: z.number().min(1).max(24).default(12),
    gridGap: z.number().min(0).default(16),
    containerPadding: z.number().min(0).default(24),
    breakpoints: z.object({
      lg: z.number().default(1200),
      md: z.number().default(996),
      sm: z.number().default(768),
      xs: z.number().default(480),
    }),
  }).optional(),
  widgets: z.array(widgetConfigSchema).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  locale: z.enum(['ja', 'en']).optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

export type UpdateDashboardPreferenceInput = z.infer<typeof updateDashboardPreferenceSchema>;
```

---

## 8. APIレスポンス型定義

### 8.1 統一APIレスポンス

```typescript
// src/shared/components/model/api.ts

/**
 * 成功レスポンス
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * エラーレスポンス
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
    stack?: string;  // 開発環境のみ
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * エラーコード
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'PARSE_ERROR'
  | 'FILE_ERROR'
  | 'NETWORK_ERROR';
```

### 8.2 APIクライアント型定義

```typescript
// src/shared/components/model/types.ts

/**
 * APIクライアント設定
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  retryConfig?: RetryConfig;
}

/**
 * リトライ設定
 */
export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryOn?: number[];
  onRetry?: (error: any, retryCount: number) => void;
}

/**
 * リクエスト設定
 */
export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onUploadProgress?: (progress: number) => void;
  onDownloadProgress?: (progress: number) => void;
}
```

---

## 9. ユーティリティ型定義

### 9.1 型ヘルパー

```typescript
// src/shared/components/model/helpers.ts

/**
 * 深いPartial型
 */
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * 深いRequired型
 */
export type DeepRequired<T> = T extends object ? {
  [P in keyof T]-?: DeepRequired<T[P]>;
} : T;

/**
 * Nullable型
 */
export type Nullable<T> = T | null;

/**
 * Optional型
 */
export type Optional<T> = T | undefined;

/**
 * Maybe型
 */
export type Maybe<T> = T | null | undefined;

/**
 * 除外キー型
 */
export type OmitStrict<T, K extends keyof T> = Omit<T, K>;

/**
 * 判別共用体のヘルパー
 */
export type DiscriminatedUnion<T extends Record<string, any>, K extends keyof T> = 
  T extends Record<K, infer V> ? T : never;

/**
 * 配列要素の型を取得
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Promise解決型を取得
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 関数の引数型を取得
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * 関数の戻り値型を取得
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

### 9.2 ブランド型

```typescript
// src/shared/components/model/brand.ts

/**
 * ブランド型の作成
 */
type Brand<K, T> = K & { __brand: T };

/**
 * Email型
 */
export type Email = Brand<string, 'Email'>;

export const Email = (email: string): Email => {
  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }
  return email as Email;
};

/**
 * UserId型
 */
export type UserId = Brand<string, 'UserId'>;

export const UserId = (id: string): UserId => {
  if (!id || id.length !== 25) {  // CUID length
    throw new Error('Invalid user ID format');
  }
  return id as UserId;
};

/**
 * 正の数型
 */
export type PositiveNumber = Brand<number, 'PositiveNumber'>;

export const PositiveNumber = (n: number): PositiveNumber => {
  if (n <= 0) {
    throw new Error('Number must be positive');
  }
  return n as PositiveNumber;
};
```

---

## 10. 型の使用例

### 10.1 サービス層での使用例

```typescript
// src/features/salary-slip/api/salarySlipService.ts

import type { 
  SalarySlip, 
  CreateSalarySlipInput, 
  SalaryStatistics 
} from '@/entities/salary-slip/model/types';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

export class SalarySlipService {
  async create(input: CreateSalarySlipInput): Promise<ApiResponse<SalarySlip>> {
    try {
      // バリデーション
      const validated = createSalarySlipSchema.parse(input);
      
      // データベース操作
      const salarySlip = await prisma.salarySlip.create({
        data: {
          ...validated,
          totalEarnings: this.calculateTotalEarnings(validated.earnings),
          totalDeductions: this.calculateTotalDeductions(validated.deductions),
          netPay: this.calculateNetPay(validated.earnings, validated.deductions),
        },
      });
      
      return {
        success: true,
        data: this.toSalarySlip(salarySlip),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      };
    }
  }
  
  async findMany(
    userId: string,
    params: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<SalarySlip>>> {
    const { page = 1, limit = 20, sortBy = 'paymentDate', sortOrder = 'desc' } = params;
    
    const [data, total] = await Promise.all([
      prisma.salarySlip.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.salarySlip.count({ where: { userId } }),
    ]);
    
    return {
      success: true,
      data: {
        data: data.map(this.toSalarySlip),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
  
  async getStatistics(userId: string): Promise<ApiResponse<SalaryStatistics>> {
    // 統計計算ロジック
    const stats = await this.calculateStatistics(userId);
    
    return {
      success: true,
      data: stats,
    };
  }
  
  private toSalarySlip(data: any): SalarySlip {
    // Prismaの結果をドメインモデルに変換
    return {
      ...data,
      paymentDate: data.paymentDate.toISOString(),
      targetPeriodStart: data.targetPeriodStart.toISOString(),
      targetPeriodEnd: data.targetPeriodEnd.toISOString(),
      baseSalary: data.baseSalary.toString(),
      totalEarnings: data.totalEarnings.toString(),
      totalDeductions: data.totalDeductions.toString(),
      netPay: data.netPay.toString(),
    };
  }
}
```

---

## 11. 次のステップ

1. ✅ ERD作成
2. ✅ データベーススキーマ詳細定義
3. ✅ TypeScriptインターフェース定義（本書）
4. → Prismaマイグレーションの実行
5. → APIエンドポイントの実装
6. → フロントエンドコンポーネントの実装

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| データアーキテクト | データモデリングアーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | データモデリングアーキテクト |
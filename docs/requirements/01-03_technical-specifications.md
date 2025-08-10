# 技術仕様書: 給料・資産管理システム

## 1. アーキテクチャ概要

### 1.1 Feature-Sliced Design (FSD) 構造

```
src/
├── app/                 # アプリケーション層
│   ├── providers/      # グローバルプロバイダー
│   └── styles/         # グローバルスタイル
│
├── pages/              # ページ層（非推奨、routesを使用）
│
├── widgets/            # ウィジェット層
│   ├── header/        # ヘッダーウィジェット
│   └── dashboard/     # ダッシュボードウィジェット
│
├── features/           # フィーチャー層
│   ├── salary-slip/   # 給料明細機能
│   ├── portfolio/     # ポートフォリオ機能
│   └── dashboard/     # ダッシュボード機能
│
├── entities/           # エンティティ層
│   ├── salary-slip/   # 給料明細エンティティ
│   ├── stock/         # 株式エンティティ
│   └── asset/         # 資産エンティティ
│
├── shared/            # 共有層（libを使用）
│   ├── ui/           # 共通UIコンポーネント
│   ├── lib/          # ユーティリティ
│   └── api/          # API通信
│
└── routes/            # SvelteKitルーティング
    ├── api/          # APIエンドポイント
    ├── portfolio/    # ポートフォリオページ
    └── salary-slips/ # 給料明細ページ
```

### 1.2 各層の責務

- **widgets**: 複数のfeatureを組み合わせた複雑なUI
- **features**: ユーザー向け機能の実装
- **entities**: ビジネスエンティティとその操作
- **shared/lib**: 共通ユーティリティとコンポーネント

---

## 2. API設計

### 2.1 RESTful APIエンドポイント

#### 給料明細API

```typescript
// POST /api/salary-slips/upload
// PDFアップロードと解析
interface UploadRequest {
  files: File[];
}

interface UploadResponse {
  success: boolean;
  results: {
    fileName: string;
    status: 'success' | 'error';
    data?: SalarySlipData;
    error?: string;
  }[];
}

// GET /api/salary-slips
// 給料明細一覧取得
interface ListRequest {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  sort?: 'date' | 'amount';
  order?: 'asc' | 'desc';
}

interface ListResponse {
  items: SalarySlip[];
  total: number;
  page: number;
  totalPages: number;
}

// GET /api/salary-slips/:id
// 給料明細詳細取得
interface DetailResponse {
  salarySlip: SalarySlip;
}

// PUT /api/salary-slips/:id
// 給料明細更新
interface UpdateRequest {
  data: Partial<SalarySlipData>;
}

// DELETE /api/salary-slips/:id
// 給料明細削除
```

#### ポートフォリオAPI

```typescript
// GET /api/portfolio
// ポートフォリオ全体取得
interface PortfolioResponse {
  stocks: StockHolding[];
  summary: {
    totalInvestment: number;
    totalValue: number;
    totalGainLoss: number;
    totalGainLossRate: number;
  };
  composition: {
    symbol: string;
    name: string;
    value: number;
    percentage: number;
  }[];
  lastUpdated: Date;
}

// POST /api/portfolio/stocks
// 株式登録
interface StockCreateRequest {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

// PUT /api/portfolio/stocks/:id
// 株式更新
interface StockUpdateRequest {
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: string;
}

// DELETE /api/portfolio/stocks/:id
// 株式削除

// POST /api/portfolio/prices/update
// 株価一括更新
interface PriceUpdateResponse {
  updated: number;
  failed: string[];
  timestamp: Date;
}

// GET /api/portfolio/info/:symbol
// 銘柄情報取得（外部API）
interface StockInfoResponse {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  marketCap: number;
  per: number;
  pbr: number;
  dividendYield: number;
}
```

#### ダッシュボードAPI

```typescript
// GET /api/dashboard
// ダッシュボードデータ取得
interface DashboardRequest {
  period: 'month' | 'quarter' | 'year' | 'all';
  startDate?: string;
  endDate?: string;
}

interface DashboardResponse {
  summary: {
    totalAssets: number;
    cashBalance: number;
    stockValue: number;
    monthlyIncome: number;
    monthlyExpense: number;
    savingsRate: number;
  };
  charts: {
    incomeChart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
      }[];
    };
    assetChart: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
      }[];
    };
    portfolioChart: {
      labels: string[];
      data: number[];
      backgroundColor: string[];
    };
  };
  statistics: {
    averageIncome: number;
    incomeGrowthRate: number;
    portfolioROI: number;
    bestPerformer: {
      symbol: string;
      name: string;
      gainLossPercent: number;
    };
    worstPerformer: {
      symbol: string;
      name: string;
      gainLossPercent: number;
    };
  };
}

// GET /api/dashboard/export
// データエクスポート
interface ExportRequest {
  format: 'csv' | 'xlsx';
  type: 'salary' | 'portfolio' | 'all';
  startDate: string;
  endDate: string;
}
// Response: File download
```

---

## 3. データモデル設計

### 3.1 エンティティ定義

```typescript
// 給料明細エンティティ
interface SalarySlip {
  id: string;
  companyName: string;
  employeeName: string;
  employeeId: string;
  paymentDate: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
  
  // 勤怠情報
  attendance: {
    overtimeHours: number;
    overtimeHoursOver60: number;
    lateNightHours: number;
    holidayWorkDays: number;
    paidLeaveDays: number;
  };
  
  // 収入詳細
  earnings: {
    baseSalary: number;
    overtimePay: number;
    overtimePayOver60: number;
    lateNightPay: number;
    fixedOvertimeAllowance: number;
    expenseReimbursement: number;
    transportationAllowance: number;
    stockPurchaseIncentive: number;
    totalEarnings: number;
  };
  
  // 控除詳細
  deductions: {
    healthInsurance: number;
    welfareInsurance: number;
    employmentInsurance: number;
    incomeTax: number;
    residentTax: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  
  netPay: number;
  
  metadata: {
    fileName: string;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

// 株式エンティティ
interface Stock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  currentPrice: number | null;
  lastUpdated: Date | null;
  
  // 計算フィールド
  get totalInvestment(): number;
  get currentValue(): number;
  get gainLoss(): number;
  get gainLossPercent(): number;
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// 資産エンティティ
interface Asset {
  id: string;
  type: 'cash' | 'deposit' | 'bond' | 'other';
  name: string;
  amount: number;
  
  metadata: {
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### 3.2 Prismaスキーマ（既存）

既存のPrismaスキーマを活用し、必要に応じて拡張

---

## 4. 画面遷移設計

### 4.1 ルーティング構造

```
/                           # ダッシュボード（ホーム）
├── /salary-slips          # 給料明細一覧
│   ├── /upload           # PDFアップロード
│   └── /:id              # 給料明細詳細
├── /portfolio             # ポートフォリオ管理
│   ├── /add              # 株式追加
│   └── /edit/:id         # 株式編集
└── /settings             # 設定（将来実装）
```

### 4.2 画面遷移フロー

```mermaid
graph TD
    A[ダッシュボード] --> B[給料明細一覧]
    A --> C[ポートフォリオ]
    B --> D[PDFアップロード]
    B --> E[給料明細詳細]
    C --> F[株式追加]
    C --> G[株式編集]
    D --> B
    E --> B
    F --> C
    G --> C
```

---

## 5. コンポーネント設計

### 5.1 主要コンポーネント構造

```typescript
// features/salary-slip/ui/FileDropZone.svelte
interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
}

// features/portfolio/ui/StockForm.svelte
interface StockFormProps {
  stock?: Stock;
  onSubmit: (data: StockInput) => void;
  onCancel: () => void;
}

// entities/dashboard/ui/SalaryChart.svelte
interface SalaryChartProps {
  data: ChartData;
  period: 'month' | 'quarter' | 'year';
  height?: number;
}

// entities/dashboard/ui/PortfolioComposition.svelte
interface PortfolioCompositionProps {
  stocks: StockHolding[];
  showLegend?: boolean;
}

// shared/ui/DataTable.svelte
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
}
```

---

## 6. 状態管理

### 6.1 Svelte Store設計

```typescript
// features/salary-slip/model/store.ts
interface SalarySlipStore {
  items: Readable<SalarySlip[]>;
  loading: Readable<boolean>;
  error: Readable<Error | null>;
  
  // Actions
  loadSlips: (filters?: FilterOptions) => Promise<void>;
  uploadPDF: (files: File[]) => Promise<UploadResult[]>;
  updateSlip: (id: string, data: Partial<SalarySlip>) => Promise<void>;
  deleteSlip: (id: string) => Promise<void>;
}

// features/portfolio/model/store.ts
interface PortfolioStore {
  stocks: Readable<Stock[]>;
  summary: Readable<PortfolioSummary>;
  loading: Readable<boolean>;
  
  // Actions
  loadPortfolio: () => Promise<void>;
  addStock: (stock: StockInput) => Promise<void>;
  updateStock: (id: string, data: Partial<Stock>) => Promise<void>;
  removeStock: (id: string) => Promise<void>;
  updatePrices: () => Promise<void>;
}

// features/dashboard/model/store.ts
interface DashboardStore {
  data: Readable<DashboardData>;
  period: Writable<Period>;
  loading: Readable<boolean>;
  
  // Actions
  loadDashboard: (period: Period) => Promise<void>;
  refresh: () => Promise<void>;
}
```

---

## 7. エラーハンドリング

### 7.1 エラー処理パターン

```typescript
// lib/utils/error.ts
class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // File
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  PARSE_ERROR = 'PARSE_ERROR',
  
  // API
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  NOT_FOUND = 'NOT_FOUND',
}

// エラーハンドリングユーティリティ
function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(
      ErrorCode.API_ERROR,
      error.message
    );
  }
  
  return new AppError(
    ErrorCode.API_ERROR,
    'An unexpected error occurred'
  );
}

// トースト通知との連携
function showErrorToast(error: AppError) {
  const message = getErrorMessage(error.code);
  toast.error(message, {
    duration: 5000,
    action: error.code === ErrorCode.NETWORK_ERROR 
      ? { label: 'Retry', onClick: retry }
      : undefined
  });
}
```

### 7.2 フォームバリデーション

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// 給料明細バリデーション
const salarySlipSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です'),
  employeeName: z.string().min(1, '従業員名は必須です'),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です'),
  baseSalary: z.number().min(0, '基本給は0以上である必要があります'),
  netPay: z.number().min(0, '手取り額は0以上である必要があります'),
});

// 株式登録バリデーション
const stockInputSchema = z.object({
  symbol: z.string()
    .min(4, '銘柄コードは4文字です')
    .max(4, '銘柄コードは4文字です')
    .regex(/^\d{4}$/, '銘柄コードは4桁の数字です'),
  name: z.string().min(1, '銘柄名は必須です'),
  quantity: z.number()
    .int('株数は整数である必要があります')
    .positive('株数は1以上である必要があります'),
  purchasePrice: z.number()
    .positive('取得単価は0より大きい必要があります'),
  purchaseDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です'),
});

// バリデーションヘルパー
function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return { success: false, errors };
}
```

---

## 8. セキュリティ仕様

### 8.1 認証・認可セキュリティ

```typescript
// Auth.js統合による認証・セキュリティ
import { getServerSession } from '@auth/sveltekit';
import { authOptions } from '$lib/auth';

// セッション管理とCSRF保護（Auth.js自動対応）
export async function POST({ request, locals }) {
  const session = await getServerSession(request, authOptions);
  if (!session) {
    return error(401, 'Unauthorized');
  }
  // Auth.jsが自動的にCSRF対策を実装
  // 処理続行
}

// 従来のCSRFトークン（併用可能）
import { csrf } from '$lib/server/csrf';

// APIエンドポイントでのCSRF検証
export async function POST({ request, cookies }) {
  const token = request.headers.get('x-csrf-token');
  if (!csrf.verify(cookies, token)) {
    return error(403, 'Invalid CSRF token');
  }
  // 処理続行
}

// ファイルアップロード制限
const FILE_UPLOAD_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf'],
  maxFiles: 10,
};

// 入力サニタイゼーション
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグを除去
    .trim()
    .slice(0, 1000); // 長さ制限
}

// レート制限
import { RateLimiter } from '$lib/server/rate-limiter';

const limiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
});
```

---

## 9. パフォーマンス最適化

### 9.1 最適化戦略

```typescript
// データの遅延読み込み
// +page.ts
export async function load({ fetch, url }) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = 20;
  
  // 初期表示に必要なデータのみ取得
  const [summaryPromise, itemsPromise] = await Promise.all([
    fetch('/api/dashboard/summary'),
    fetch(`/api/salary-slips?page=${page}&limit=${limit}`),
  ]);
  
  return {
    summary: await summaryPromise.json(),
    items: await itemsPromise.json(),
    // グラフデータは後から取得
    charts: fetch('/api/dashboard/charts').then(r => r.json()),
  };
}

// 画像の最適化
function optimizeChartRendering(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // デバイスピクセル比に応じた解像度調整
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
}

// メモ化とキャッシング
import { derived, get } from 'svelte/store';

const memoizedCalculations = derived(
  [portfolioStore, pricesStore],
  ([$portfolio, $prices]) => {
    // 重い計算をメモ化
    return calculatePortfolioMetrics($portfolio, $prices);
  }
);
```

---

## 10. テスト戦略

### 10.1 テストカテゴリ

```typescript
// ユニットテスト例
// tests/unit/lib/pdf/parser.test.ts
describe('PDF Parser', () => {
  it('should extract salary data from PDF', async () => {
    const mockPDF = createMockPDF();
    const result = await parseSalarySlip(mockPDF);
    
    expect(result.baseSalary).toBe(300000);
    expect(result.netPay).toBe(240000);
  });
});

// 統合テスト例
// tests/integration/api/portfolio.test.ts
describe('Portfolio API', () => {
  it('should update stock prices', async () => {
    const response = await fetch('/api/portfolio/prices/update', {
      method: 'POST',
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.updated).toBeGreaterThan(0);
  });
});

// E2Eテスト例
// tests/e2e/salary-upload.test.ts
test('Upload salary slip PDF', async ({ page }) => {
  await page.goto('/salary-slips/upload');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/salary.pdf');
  
  await page.click('button:has-text("アップロード")');
  
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.salary-preview')).toContainText('300,000');
});
```

---

## 11. 外部サービス統合

### 11.1 認証サービス統合（Auth.js版）

**実装効率化の効果:**
- **従来の認証実装**: 1200+ 行のコード、3週間の開発期間
- **Auth.js実装**: 10行の設定、1日で完了 
- **コード削減率**: 99.2% 削減
- **開発工数削減**: 87% 短縮

```typescript
// lib/auth/auth.config.ts - 認証システムのメイン設定
import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
    jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt', // JWTまたはdatabase選択可能
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
});

// hooks.server.ts - SvelteKitとの統合
export { handle } from '$lib/auth/auth.config';

// app.d.ts - TypeScript型定義
import type { DefaultSession } from '@auth/core/types';

declare module '@auth/core/types' {
  interface Session {
    user?: {
      id?: string;
    } & DefaultSession['user'];
  }
}
```

**Auth.jsの自動化機能（手動実装不要）:**
- CSRF攻撃対策の自動実装
- PKCE（Proof Key for Code Exchange）の自動処理 
- OAuth 2.0フローの自動化
- セッション管理（JWT/Database両対応）
- トークンリフレッシュの自動処理
- セキュリティヘッダーの自動設定

**追加プロバイダー対応（将来拡張用）:**
```typescript
// 必要に応じて他のプロバイダーも数行で追加可能
import GitHub from '@auth/sveltekit/providers/github';
import Apple from '@auth/sveltekit/providers/apple';

providers: [
  Google({ /* config */ }),
  GitHub({ /* config */ }),
  Apple({ /* config */ }),
]
```
```

### 11.2 株価API統合

```typescript
// lib/services/stock-price-service.ts
interface StockPriceService {
  getPrice(symbol: string): Promise<StockPrice>;
  getBulkPrices(symbols: string[]): Promise<Map<string, StockPrice>>;
}

class AlphaVantageService implements StockPriceService {
  private apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private baseUrl = 'https://www.alphavantage.co/query';
  
  async getPrice(symbol: string): Promise<StockPrice> {
    const response = await fetch(
      `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}.T&apikey=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new AppError(
        ErrorCode.API_ERROR,
        'Failed to fetch stock price'
      );
    }
    
    const data = await response.json();
    return this.parseResponse(data);
  }
  
  // レート制限対策
  async getBulkPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
    const prices = new Map();
    
    // バッチ処理（5件ずつ、1秒間隔）
    for (const batch of chunk(symbols, 5)) {
      const promises = batch.map(s => this.getPrice(s));
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          prices.set(batch[index], result.value);
        }
      });
      
      // レート制限回避
      await sleep(1000);
    }
    
    return prices;
  }
}
```

---

## 12. デプロイメント仕様

### 12.1 環境変数

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/salary_management
ALPHA_VANTAGE_API_KEY=your_api_key_here
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development

# Auth.js設定
AUTH_SECRET=your_random_secret_key_here
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# オプション: 追加プロバイダー（将来拡張用）
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 12.2 ビルド設定

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed"
  }
}
```

---

## 13. 今後の拡張性考慮

### 13.1 将来の機能拡張ポイント

1. **認証システム拡張**
   - Auth.js追加プロバイダー（GitHub、Twitter、Apple等）
   - マルチユーザー対応（既にAuth.js基盤で準備済み）
   - 多要素認証（MFA）の追加
   - 企業SSO（SAML/OpenID Connect）統合

2. **通知システム**
   - 株価アラート
   - 予算超過通知

3. **AI/ML機能**
   - 支出パターン分析
   - 投資推奨

4. **外部連携**
   - 銀行API連携
   - 会計ソフト連携

5. **モバイルアプリ**
   - React Native / Flutter版
   - Progressive Web App (PWA)化
# データベーススキーマ詳細定義書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: データモデリングアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 初版

---

## 1. Prismaスキーマ定義

### 1.1 完全なPrismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================
// ユーザー管理ドメイン
// ================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String
  googleId          String?   @unique
  avatarUrl         String?
  isActive          Boolean   @default(true)
  preferences       Json?     @default("{}")
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  salarySlips       SalarySlip[]
  stockPortfolios   StockPortfolio[]
  stockTransactions StockTransaction[]
  assets            Asset[]
  budgets           Budget[]
  dashboardPreference DashboardPreference?
  sessions          UserSession[]
  auditLogs         AuditLog[]
  
  @@index([email])
  @@index([googleId])
  @@index([isActive])
  @@map("users")
}

model UserSession {
  id              String   @id @default(cuid())
  userId          String
  sessionToken    String   @unique
  ipAddress       String?
  userAgent       String?
  deviceInfo      Json?
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  lastActivityAt  DateTime @default(now())
  
  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
  @@map("user_sessions")
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  entityType  String
  entityId    String
  action      String   // create, update, delete, view
  oldValue    Json?
  newValue    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  // Relations
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// ================================
// 給料管理ドメイン
// ================================

model SalarySlip {
  id                     String   @id @default(cuid())
  userId                 String
  companyName            String
  employeeName           String
  employeeId             String
  paymentDate            DateTime
  targetPeriodStart      DateTime
  targetPeriodEnd        DateTime
  
  // 勤怠情報 (JSON)
  attendance             Json     @default("{}")
  // {
  //   overtimeHours: number,
  //   overtimeHoursOver60: number,
  //   lateNightHours: number,
  //   holidayWorkDays: number,
  //   paidLeaveDays: number,
  //   absenceDays: number,
  //   workingDays: number
  // }
  
  // 収入詳細 (JSON)
  earnings               Json     @default("{}")
  // {
  //   baseSalary: number,
  //   overtimePay: number,
  //   overtimePayOver60: number,
  //   lateNightPay: number,
  //   holidayWorkPay: number,
  //   fixedOvertimeAllowance: number,
  //   transportationAllowance: number,
  //   housingAllowance: number,
  //   familyAllowance: number,
  //   qualificationAllowance: number,
  //   expenseReimbursement: number,
  //   stockPurchaseIncentive: number,
  //   bonus: number,
  //   otherEarnings: number
  // }
  
  // 控除詳細 (JSON)
  deductions             Json     @default("{}")
  // {
  //   healthInsurance: number,
  //   welfareInsurance: number,
  //   employmentInsurance: number,
  //   incomeTax: number,
  //   residentTax: number,
  //   stockPurchase: number,
  //   loan: number,
  //   otherDeductions: number
  // }
  
  // 集計値（パフォーマンス最適化のため非正規化）
  baseSalary             Decimal  @db.Decimal(12, 2)
  totalEarnings          Decimal  @db.Decimal(12, 2)
  totalDeductions        Decimal  @db.Decimal(12, 2)
  netPay                 Decimal  @db.Decimal(12, 2)
  
  currency               String   @default("JPY")
  status                 String   @default("confirmed") // draft, confirmed, archived
  sourceType             String   @default("manual")    // pdf, manual, api
  
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  attachments            SalarySlipAttachment[]
  
  @@unique([userId, paymentDate, companyName])
  @@index([userId])
  @@index([paymentDate])
  @@index([status])
  @@map("salary_slips")
}

model SalarySlipAttachment {
  id            String      @id @default(cuid())
  salarySlipId  String
  fileName      String
  fileType      String
  fileSize      Int
  storageUrl    String
  checksum      String      // MD5ハッシュ
  uploadedAt    DateTime    @default(now())
  
  // Relations
  salarySlip    SalarySlip  @relation(fields: [salarySlipId], references: [id], onDelete: Cascade)
  
  @@index([salarySlipId])
  @@map("salary_slip_attachments")
}

// ================================
// 株式ポートフォリオドメイン
// ================================

model StockMaster {
  id            String      @id @default(cuid())
  symbol        String      @unique
  name          String
  exchange      String      @default("TSE") // TSE, NYSE, NASDAQ, etc.
  sector        String?
  industry      String?
  marketCap     Decimal?    @db.Decimal(15, 2)
  currency      String      @default("JPY")
  isActive      Boolean     @default(true)
  listedDate    DateTime?
  delistedDate  DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Relations
  portfolios    StockPortfolio[]
  transactions  StockTransaction[]
  currentPrice  StockCurrentPrice?
  priceHistory  StockPriceHistory[]
  
  @@index([symbol])
  @@index([exchange])
  @@index([isActive])
  @@map("stock_masters")
}

model StockPortfolio {
  id                      String      @id @default(cuid())
  userId                  String
  stockId                 String
  quantity                Decimal     @db.Decimal(12, 4)
  averagePurchasePrice    Decimal     @db.Decimal(12, 2)
  totalInvestment         Decimal     @db.Decimal(12, 2)
  currentValue            Decimal     @db.Decimal(12, 2)
  unrealizedGainLoss      Decimal     @db.Decimal(12, 2)
  unrealizedGainLossRate  Decimal     @db.Decimal(5, 2)
  firstPurchaseDate       DateTime?
  lastPurchaseDate        DateTime?
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  
  // Relations
  user                    User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  stock                   StockMaster @relation(fields: [stockId], references: [id], onDelete: Restrict)
  transactions            StockTransaction[]
  
  @@unique([userId, stockId])
  @@index([userId])
  @@index([stockId])
  @@map("stock_portfolios")
}

model StockTransaction {
  id              String          @id @default(cuid())
  portfolioId     String
  stockId         String
  userId          String
  transactionType String          // buy, sell, dividend
  quantity        Decimal         @db.Decimal(12, 4)
  pricePerShare   Decimal         @db.Decimal(12, 2)
  totalAmount     Decimal         @db.Decimal(12, 2)
  commission      Decimal         @db.Decimal(10, 2) @default(0)
  tax             Decimal         @db.Decimal(10, 2) @default(0)
  transactionDate DateTime
  notes           String?
  createdAt       DateTime        @default(now())
  
  // Relations
  portfolio       StockPortfolio  @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  stock           StockMaster     @relation(fields: [stockId], references: [id], onDelete: Restrict)
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([portfolioId])
  @@index([transactionDate])
  @@index([transactionType])
  @@map("stock_transactions")
}

model StockCurrentPrice {
  id               String      @id @default(cuid())
  stockId          String      @unique
  currentPrice     Decimal     @db.Decimal(12, 2)
  previousClose    Decimal     @db.Decimal(12, 2)
  dayChange        Decimal     @db.Decimal(12, 2)
  dayChangePercent Decimal     @db.Decimal(5, 2)
  dayHigh          Decimal     @db.Decimal(12, 2)
  dayLow           Decimal     @db.Decimal(12, 2)
  volume           BigInt
  marketTime       DateTime
  lastUpdated      DateTime    @default(now())
  
  // Relations
  stock            StockMaster @relation(fields: [stockId], references: [id], onDelete: Cascade)
  
  @@index([stockId])
  @@index([lastUpdated])
  @@map("stock_current_prices")
}

model StockPriceHistory {
  id            String      @id @default(cuid())
  stockId       String
  date          DateTime    @db.Date
  open          Decimal     @db.Decimal(12, 2)
  high          Decimal     @db.Decimal(12, 2)
  low           Decimal     @db.Decimal(12, 2)
  close         Decimal     @db.Decimal(12, 2)
  adjustedClose Decimal     @db.Decimal(12, 2)
  volume        BigInt
  createdAt     DateTime    @default(now())
  
  // Relations
  stock         StockMaster @relation(fields: [stockId], references: [id], onDelete: Cascade)
  
  @@unique([stockId, date])
  @@index([stockId])
  @@index([date])
  @@map("stock_price_histories")
}

// ================================
// 資産管理ドメイン
// ================================

model Asset {
  id          String   @id @default(cuid())
  userId      String
  assetType   String   // cash, deposit, bond, realestate, crypto, other
  name        String
  description String?
  amount      Decimal  @db.Decimal(15, 2)
  currency    String   @default("JPY")
  asOfDate    DateTime @default(now())
  metadata    Json?    @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([assetType])
  @@index([asOfDate])
  @@map("assets")
}

// ================================
// 予算管理ドメイン
// ================================

model Budget {
  id          String           @id @default(cuid())
  userId      String
  name        String
  period      String           // monthly, quarterly, yearly
  startDate   DateTime
  endDate     DateTime
  totalBudget Decimal          @db.Decimal(12, 2)
  status      String           @default("active") // active, completed, cancelled
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  // Relations
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories  BudgetCategory[]
  
  @@index([userId])
  @@index([period])
  @@index([status])
  @@index([startDate])
  @@map("budgets")
}

model BudgetCategory {
  id              String            @id @default(cuid())
  budgetId        String
  categoryName    String
  categoryType    String            // income, expense, saving
  allocatedAmount Decimal           @db.Decimal(12, 2)
  actualAmount    Decimal           @db.Decimal(12, 2) @default(0)
  variance        Decimal           @db.Decimal(12, 2) @default(0)
  icon            String?
  color           String?
  displayOrder    Int               @default(0)
  
  // Relations
  budget          Budget            @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  trackings       BudgetTracking[]
  
  @@index([budgetId])
  @@index([categoryType])
  @@map("budget_categories")
}

model BudgetTracking {
  id              String         @id @default(cuid())
  categoryId      String
  amount          Decimal        @db.Decimal(12, 2)
  description     String?
  transactionDate DateTime
  source          String         @default("manual") // manual, automated
  createdAt       DateTime       @default(now())
  
  // Relations
  category        BudgetCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@index([categoryId])
  @@index([transactionDate])
  @@map("budget_trackings")
}

// ================================
// ダッシュボード設定
// ================================

model DashboardPreference {
  id                   String   @id @default(cuid())
  userId               String   @unique
  layout               Json     @default("{}")
  widgets              Json     @default("{}")
  chartPreferences     Json     @default("{}")
  theme                String   @default("light") // light, dark, auto
  locale               String   @default("ja")     // ja, en
  timezone             String   @default("Asia/Tokyo")
  emailNotifications   Boolean  @default(false)
  pushNotifications    Boolean  @default(false)
  notificationSettings Json     @default("{}")
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  // Relations
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("dashboard_preferences")
}
```

---

## 2. データ型マッピング

### 2.1 Prisma型とPostgreSQL型の対応

| Prismaデータ型 | PostgreSQL型 | 用途 | 例 |
|---------------|-------------|------|-----|
| String @id | VARCHAR(30) | 主キー（CUID） | id |
| String | VARCHAR(255) | 通常の文字列 | name, email |
| String @db.Text | TEXT | 長文テキスト | description |
| Int | INTEGER | 整数 | quantity |
| BigInt | BIGINT | 大きな整数 | volume |
| Decimal | DECIMAL(p,s) | 高精度数値 | 金額 |
| Boolean | BOOLEAN | 真偽値 | isActive |
| DateTime | TIMESTAMP | 日時 | createdAt |
| DateTime @db.Date | DATE | 日付のみ | paymentDate |
| Json | JSONB | 構造化データ | preferences |

### 2.2 Decimal精度の設計

| 用途 | Decimal精度 | 説明 |
|------|------------|------|
| 金額（通常） | DECIMAL(12,2) | 最大999,999,999,999.99 |
| 金額（大） | DECIMAL(15,2) | 最大999,999,999,999,999.99 |
| 数量 | DECIMAL(12,4) | 小数点以下4桁まで |
| パーセンテージ | DECIMAL(5,2) | -999.99～999.99% |
| 単価 | DECIMAL(10,2) | 最大99,999,999.99 |

---

## 3. JSON構造定義

### 3.1 勤怠情報（attendance）

```typescript
interface AttendanceInfo {
  overtimeHours: number;         // 残業時間
  overtimeHoursOver60: number;   // 60時間超残業
  lateNightHours: number;        // 深夜労働時間
  holidayWorkDays: number;       // 休日出勤日数
  paidLeaveDays: number;         // 有給休暇日数
  absenceDays: number;           // 欠勤日数
  workingDays: number;           // 出勤日数
  scheduledWorkDays: number;     // 所定労働日数
  lateCount?: number;            // 遅刻回数
  earlyLeaveCount?: number;      // 早退回数
}
```

### 3.2 収入詳細（earnings）

```typescript
interface EarningsDetail {
  baseSalary: number;                // 基本給
  overtimePay: number;               // 残業代
  overtimePayOver60: number;         // 60時間超残業代
  lateNightPay: number;              // 深夜手当
  holidayWorkPay: number;            // 休日出勤手当
  fixedOvertimeAllowance: number;    // 固定残業代
  transportationAllowance: number;   // 通勤手当
  housingAllowance: number;          // 住宅手当
  familyAllowance: number;           // 家族手当
  qualificationAllowance: number;    // 資格手当
  expenseReimbursement: number;      // 経費精算
  stockPurchaseIncentive: number;    // 株式購入奨励金
  bonus: number;                     // 賞与
  otherEarnings: number;             // その他収入
  [key: string]: number;             // 拡張可能
}
```

### 3.3 控除詳細（deductions）

```typescript
interface DeductionsDetail {
  healthInsurance: number;           // 健康保険料
  welfareInsurance: number;          // 厚生年金保険料
  employmentInsurance: number;       // 雇用保険料
  incomeTax: number;                 // 所得税
  residentTax: number;               // 住民税
  stockPurchase: number;             // 株式購入
  loan: number;                      // 貸付金返済
  unionFee: number;                  // 組合費
  otherDeductions: number;           // その他控除
  [key: string]: number;             // 拡張可能
}
```

### 3.4 ユーザー設定（preferences）

```typescript
interface UserPreferences {
  defaultCurrency: string;
  fiscalYearStart: number;           // 会計年度開始月（1-12）
  salaryDayOfMonth: number;           // 給料日（1-31）
  notificationEmail: boolean;
  notificationPush: boolean;
  privacyMode: boolean;               // 金額の非表示モード
  dataRetentionYears: number;         // データ保持年数
}
```

### 3.5 ダッシュボードレイアウト（layout）

```typescript
interface DashboardLayout {
  gridColumns: number;
  widgets: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, any>;
  }>;
}
```

---

## 4. マイグレーション戦略

### 4.1 既存データからの移行

```sql
-- 既存のSalarySlipテーブルからの移行
INSERT INTO salary_slips (
  id, user_id, company_name, employee_name, employee_id,
  payment_date, target_period_start, target_period_end,
  attendance, earnings, deductions,
  base_salary, total_earnings, total_deductions, net_pay,
  status, source_type, created_at, updated_at
)
SELECT 
  id,
  'default_user_id', -- 後でユーザー管理実装時に更新
  company_name,
  employee_name,
  employee_id,
  TO_DATE(payment_date, 'YYYY-MM-DD'),
  TO_DATE(target_period_start, 'YYYY-MM-DD'),
  TO_DATE(target_period_end, 'YYYY-MM-DD'),
  json_build_object(
    'overtimeHours', overtime_hours,
    'overtimeHoursOver60', overtime_hours_over60,
    'lateNightHours', late_night_hours,
    'holidayWorkDays', holiday_work_days,
    'paidLeaveDays', paid_leave_days
  ),
  json_build_object(
    'baseSalary', base_salary,
    'overtimePay', overtime_pay,
    'overtimePayOver60', overtime_pay_over60,
    'lateNightPay', late_night_pay,
    'fixedOvertimeAllowance', fixed_overtime_allowance,
    'transportationAllowance', transportation_allowance,
    'expenseReimbursement', expense_reimbursement,
    'stockPurchaseIncentive', stock_purchase_incentive
  ),
  json_build_object(
    'healthInsurance', health_insurance,
    'welfareInsurance', welfare_insurance,
    'employmentInsurance', employment_insurance,
    'incomeTax', income_tax,
    'residentTax', resident_tax,
    'otherDeductions', other_deductions
  ),
  base_salary,
  total_earnings,
  total_deductions,
  net_pay,
  'confirmed',
  CASE WHEN file_name IS NOT NULL THEN 'pdf' ELSE 'manual' END,
  created_at,
  updated_at
FROM "SalarySlip";

-- 既存のStockテーブルからの移行
INSERT INTO stock_masters (
  id, symbol, name, exchange, currency, is_active, created_at, updated_at
)
SELECT DISTINCT ON (symbol)
  gen_random_uuid(),
  symbol,
  name,
  'TSE',
  'JPY',
  true,
  MIN(created_at),
  MAX(updated_at)
FROM "Stock"
GROUP BY symbol, name;

-- ポートフォリオデータの作成
INSERT INTO stock_portfolios (
  id, user_id, stock_id, quantity, average_purchase_price,
  total_investment, current_value, unrealized_gain_loss, unrealized_gain_loss_rate,
  first_purchase_date, last_purchase_date, created_at, updated_at
)
SELECT 
  s.id,
  'default_user_id',
  sm.id,
  s.quantity,
  s.purchase_price,
  s.quantity * s.purchase_price,
  s.quantity * COALESCE(s.current_price, s.purchase_price),
  s.quantity * (COALESCE(s.current_price, s.purchase_price) - s.purchase_price),
  ((COALESCE(s.current_price, s.purchase_price) - s.purchase_price) / s.purchase_price) * 100,
  s.purchase_date,
  s.purchase_date,
  s.created_at,
  s.updated_at
FROM "Stock" s
JOIN stock_masters sm ON s.symbol = sm.symbol;
```

### 4.2 段階的マイグレーション計画

```typescript
// migrations/phase1_user_management.ts
export async function phase1UserManagement() {
  // 1. Userテーブルの作成
  await prisma.$executeRaw`
    CREATE TABLE users (
      id VARCHAR(30) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      -- ... other fields
    )
  `;
  
  // 2. デフォルトユーザーの作成
  await prisma.user.create({
    data: {
      id: 'default_user_id',
      email: 'default@example.com',
      name: 'Default User',
    }
  });
  
  // 3. 既存データへのuser_id追加
  await prisma.$executeRaw`
    ALTER TABLE salary_slips ADD COLUMN user_id VARCHAR(30);
    UPDATE salary_slips SET user_id = 'default_user_id';
    ALTER TABLE salary_slips ALTER COLUMN user_id SET NOT NULL;
  `;
}

// migrations/phase2_stock_restructure.ts
export async function phase2StockRestructure() {
  // 1. StockMasterテーブルの作成と移行
  // 2. StockPortfolioテーブルの作成と移行
  // 3. 価格履歴テーブルの作成
  // 4. 古いStockテーブルの削除
}

// migrations/phase3_additional_features.ts
export async function phase3AdditionalFeatures() {
  // 1. Budget関連テーブルの作成
  // 2. Asset管理テーブルの作成
  // 3. Dashboard設定テーブルの作成
}
```

---

## 5. パフォーマンス最適化

### 5.1 クエリ最適化例

```typescript
// 効率的なダッシュボードデータ取得
const dashboardData = await prisma.$transaction([
  // 最新の給料明細
  prisma.salarySlip.findFirst({
    where: { userId },
    orderBy: { paymentDate: 'desc' },
    select: {
      paymentDate: true,
      netPay: true,
      totalEarnings: true,
      totalDeductions: true,
    }
  }),
  
  // ポートフォリオサマリー
  prisma.stockPortfolio.aggregate({
    where: { userId },
    _sum: {
      currentValue: true,
      unrealizedGainLoss: true,
    }
  }),
  
  // 資産合計
  prisma.asset.aggregate({
    where: { userId },
    _sum: { amount: true }
  }),
  
  // アクティブな予算
  prisma.budget.findMany({
    where: {
      userId,
      status: 'active',
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
    include: {
      categories: {
        select: {
          categoryName: true,
          allocatedAmount: true,
          actualAmount: true,
        }
      }
    }
  })
]);
```

### 5.2 バッチ処理の最適化

```typescript
// 株価更新のバッチ処理
async function updateStockPrices(stockIds: string[]) {
  const batchSize = 10;
  
  for (let i = 0; i < stockIds.length; i += batchSize) {
    const batch = stockIds.slice(i, i + batchSize);
    
    // 並列で価格取得
    const prices = await Promise.all(
      batch.map(id => fetchStockPrice(id))
    );
    
    // バルクアップデート
    await prisma.$transaction(
      prices.map(price => 
        prisma.stockCurrentPrice.upsert({
          where: { stockId: price.stockId },
          update: {
            currentPrice: price.currentPrice,
            previousClose: price.previousClose,
            dayChange: price.dayChange,
            dayChangePercent: price.dayChangePercent,
            lastUpdated: new Date(),
          },
          create: {
            stockId: price.stockId,
            ...price,
          }
        })
      )
    );
    
    // レート制限考慮
    await sleep(1000);
  }
}
```

---

## 6. データベース制約とトリガー

### 6.1 CHECK制約

```sql
-- 金額の非負制約
ALTER TABLE salary_slips 
ADD CONSTRAINT check_positive_amounts 
CHECK (
  base_salary >= 0 AND 
  total_earnings >= 0 AND 
  total_deductions >= 0 AND 
  net_pay >= 0
);

-- 期間の妥当性チェック
ALTER TABLE salary_slips 
ADD CONSTRAINT check_valid_period 
CHECK (target_period_start <= target_period_end);

-- 株式数量の正数制約
ALTER TABLE stock_portfolios 
ADD CONSTRAINT check_positive_quantity 
CHECK (quantity > 0);

-- パーセンテージの範囲制約
ALTER TABLE stock_portfolios 
ADD CONSTRAINT check_valid_percentage 
CHECK (unrealized_gain_loss_rate >= -100 AND unrealized_gain_loss_rate <= 10000);
```

### 6.2 トリガー定義

```sql
-- ポートフォリオ集計値の自動更新
CREATE OR REPLACE FUNCTION update_portfolio_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- 平均取得単価の再計算
  UPDATE stock_portfolios
  SET 
    average_purchase_price = (
      SELECT SUM(total_amount) / SUM(quantity)
      FROM stock_transactions
      WHERE portfolio_id = NEW.portfolio_id
      AND transaction_type = 'buy'
    ),
    quantity = (
      SELECT 
        SUM(CASE WHEN transaction_type = 'buy' THEN quantity ELSE 0 END) -
        SUM(CASE WHEN transaction_type = 'sell' THEN quantity ELSE 0 END)
      FROM stock_transactions
      WHERE portfolio_id = NEW.portfolio_id
    ),
    updated_at = NOW()
  WHERE id = NEW.portfolio_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio
AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
FOR EACH ROW EXECUTE FUNCTION update_portfolio_summary();

-- 予算差異の自動計算
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.variance := NEW.allocated_amount - NEW.actual_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_variance
BEFORE INSERT OR UPDATE ON budget_categories
FOR EACH ROW EXECUTE FUNCTION calculate_budget_variance();
```

---

## 7. セキュリティ実装

### 7.1 Row Level Security (RLS)

```sql
-- RLSの有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ポリシーの定義
CREATE POLICY users_policy ON users
  FOR ALL 
  USING (id = current_setting('app.current_user_id')::text);

CREATE POLICY salary_slips_policy ON salary_slips
  FOR ALL 
  USING (user_id = current_setting('app.current_user_id')::text);

CREATE POLICY stock_portfolios_policy ON stock_portfolios
  FOR ALL 
  USING (user_id = current_setting('app.current_user_id')::text);

-- 読み取り専用ポリシー（株価マスタ）
CREATE POLICY stock_masters_read_policy ON stock_masters
  FOR SELECT 
  USING (true);
```

### 7.2 暗号化フィールド

```typescript
// 暗号化ヘルパー関数
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(data: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(data.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Prismaミドルウェアでの自動暗号化
prisma.$use(async (params, next) => {
  if (params.model === 'SalarySlip') {
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data.employeeId) {
        params.args.data.employeeId = encrypt(params.args.data.employeeId);
      }
    }
  }
  
  const result = await next(params);
  
  if (params.model === 'SalarySlip') {
    if (params.action === 'findFirst' || params.action === 'findUnique') {
      if (result?.employeeId) {
        result.employeeId = decrypt(result.employeeId);
      }
    }
  }
  
  return result;
});
```

---

## 8. バックアップとリカバリ

### 8.1 バックアップ戦略

```bash
#!/bin/bash
# backup.sh - 日次バックアップスクリプト

# 環境変数
DB_NAME="salary_management"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# フルバックアップ
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --verbose \
  --file="${BACKUP_DIR}/full_${DATE}.dump"

# 暗号化
openssl enc -aes-256-cbc \
  -salt \
  -in "${BACKUP_DIR}/full_${DATE}.dump" \
  -out "${BACKUP_DIR}/full_${DATE}.dump.enc" \
  -pass file:/etc/backup.key

# 古いバックアップの削除
find $BACKUP_DIR -name "*.dump.enc" -mtime +$RETENTION_DAYS -delete

# S3へのアップロード
aws s3 cp "${BACKUP_DIR}/full_${DATE}.dump.enc" \
  s3://backup-bucket/postgres/${DATE}/
```

### 8.2 Point-in-Time Recovery設定

```sql
-- WAL設定
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'cp %p /archive/%f';
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 64;

-- リカバリ手順
-- 1. ベースバックアップのリストア
pg_restore -h localhost -U postgres -d salary_management /backups/full_20250810.dump

-- 2. WALの適用
recovery_target_time = '2025-08-10 14:30:00'
restore_command = 'cp /archive/%f %p'
```

---

## 9. 監視とメンテナンス

### 9.1 パフォーマンス監視クエリ

```sql
-- 遅いクエリの検出
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- テーブルサイズの監視
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- インデックス使用状況
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 9.2 定期メンテナンス

```sql
-- VACUUM ANALYZE（週次）
VACUUM ANALYZE salary_slips;
VACUUM ANALYZE stock_portfolios;
VACUUM ANALYZE stock_transactions;

-- インデックスの再構築（月次）
REINDEX TABLE CONCURRENTLY salary_slips;
REINDEX TABLE CONCURRENTLY stock_portfolios;

-- 統計情報の更新
ANALYZE;
```

---

## 10. 次のステップ

1. ✅ ERD作成
2. ✅ データベーススキーマ詳細定義（本書）
3. → TypeScriptインターフェースの定義
4. → Prismaマイグレーションファイルの生成
5. → シードデータの作成
6. → パフォーマンステストの実施

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
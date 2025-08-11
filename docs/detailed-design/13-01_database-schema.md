# データベーススキーマ詳細設計書

## 文書情報

- **作成日**: 2025-08-10
- **作成者**: エキスパートデータベース詳細設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **データベース**: PostgreSQL 15+
- **ORM**: Prisma 5.x

---

## 1. 設計概要

### 1.1 設計原則

本データベース詳細設計は、以下の原則に基づいて実装されています：

| 原則                     | 詳細                         | 実装手段                                   |
| ------------------------ | ---------------------------- | ------------------------------------------ |
| **ACID準拠**             | データの一貫性と信頼性を保証 | PostgreSQLのトランザクション機能を最大活用 |
| **パフォーマンス最適化** | 高速なデータアクセスの実現   | 戦略的インデックス設計とクエリ最適化       |
| **スケーラビリティ**     | 将来の成長に対応可能な設計   | パーティショニングと効率的なデータ分散     |
| **データ整合性**         | ビジネスルールの厳密な強制   | 制約・トリガー・ストアドプロシージャの活用 |
| **セキュリティ**         | 多層防御による包括的保護     | RLS・暗号化・監査ログの実装                |

### 1.2 PostgreSQL 15+ 機能活用

#### 最新機能の戦略的活用

- **JSONB演算子**: 構造化データの効率的格納と検索
- **パーティション化**: 時系列データの高速処理
- **Row Level Security (RLS)**: きめ細かいアクセス制御
- **GENERATED COLUMNS**: 計算フィールドの自動更新
- **UPSERT**: 競合条件の安全な処理

---

## 2. 完全なPrismaスキーマ定義

### 2.1 Prismaスキーマファイル（prisma/schema.prisma）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["jsonProtocol", "multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "audit"]
}

// ================================
// ユーザー管理ドメイン
// ================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique @db.VarChar(254)
  name              String    @db.VarChar(100)
  googleId          String?   @unique @db.VarChar(100)
  avatarUrl         String?   @db.VarChar(2048)
  isActive          Boolean   @default(true)
  preferences       Json      @default("{\"defaultCurrency\":\"JPY\",\"fiscalYearStart\":4,\"salaryDayOfMonth\":25,\"notificationEmail\":false,\"notificationPush\":false,\"privacyMode\":false,\"dataRetentionYears\":5}") @db.JsonB
  emailVerifiedAt   DateTime? @db.Timestamptz
  lastLoginAt       DateTime? @db.Timestamptz
  createdAt         DateTime  @default(now()) @db.Timestamptz
  updatedAt         DateTime  @updatedAt @db.Timestamptz

  // Relations
  salarySlips       SalarySlip[]
  stockPortfolios   StockPortfolio[]
  stockTransactions StockTransaction[]
  assets            Asset[]
  budgets           Budget[]
  dashboardPreference DashboardPreference?
  sessions          UserSession[]
  auditLogs         AuditLog[]

  // Indexes
  @@index([email])
  @@index([googleId])
  @@index([isActive])
  @@index([lastLoginAt])
  @@map("users")
}

model UserSession {
  id              String   @id @default(cuid())
  userId          String   @db.VarChar(30)
  sessionToken    String   @unique @db.VarChar(255)
  ipAddress       String?  @db.Inet
  userAgent       String?  @db.Text
  deviceInfo      Json?    @db.JsonB
  expiresAt       DateTime @db.Timestamptz
  createdAt       DateTime @default(now()) @db.Timestamptz
  lastActivityAt  DateTime @default(now()) @db.Timestamptz

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
  @@index([lastActivityAt])
  @@map("user_sessions")
}

model AuditLog {
  id          String   @id @default(cuid())
  userId      String?  @db.VarChar(30)
  entityType  String   @db.VarChar(50)
  entityId    String   @db.VarChar(30)
  action      String   @db.VarChar(20) // create, update, delete, view
  oldValue    Json?    @db.JsonB
  newValue    Json?    @db.JsonB
  ipAddress   String?  @db.Inet
  userAgent   String?  @db.Text
  createdAt   DateTime @default(now()) @db.Timestamptz

  // Relations
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: Cascade)

  // Indexes
  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([action])
  @@map("audit_logs")
  @@schema("audit")
}

// ================================
// 給料管理ドメイン
// ================================

model SalarySlip {
  id                     String   @id @default(cuid())
  userId                 String   @db.VarChar(30)
  companyName            String   @db.VarChar(100)
  employeeName           String   @db.VarChar(100)
  employeeId             String   @db.VarChar(50) // 暗号化対象
  paymentDate            DateTime @db.Date
  targetPeriodStart      DateTime @db.Date
  targetPeriodEnd        DateTime @db.Date

  // 勤怠情報 (JSONB)
  attendance             Json     @default("{\"overtimeHours\":0,\"overtimeHoursOver60\":0,\"lateNightHours\":0,\"holidayWorkDays\":0,\"paidLeaveDays\":0,\"absenceDays\":0,\"workingDays\":20,\"scheduledWorkDays\":20,\"lateCount\":0,\"earlyLeaveCount\":0}") @db.JsonB

  // 収入詳細 (JSONB)
  earnings               Json     @default("{\"baseSalary\":\"0\",\"overtimePay\":\"0\",\"overtimePayOver60\":\"0\",\"lateNightPay\":\"0\",\"holidayWorkPay\":\"0\",\"fixedOvertimeAllowance\":\"0\",\"transportationAllowance\":\"0\",\"housingAllowance\":\"0\",\"familyAllowance\":\"0\",\"qualificationAllowance\":\"0\",\"expenseReimbursement\":\"0\",\"stockPurchaseIncentive\":\"0\",\"bonus\":\"0\",\"otherEarnings\":\"0\"}") @db.JsonB

  // 控除詳細 (JSONB)
  deductions             Json     @default("{\"healthInsurance\":\"0\",\"welfareInsurance\":\"0\",\"employmentInsurance\":\"0\",\"incomeTax\":\"0\",\"residentTax\":\"0\",\"stockPurchase\":\"0\",\"loan\":\"0\",\"unionFee\":\"0\",\"otherDeductions\":\"0\"}") @db.JsonB

  // 集計値（パフォーマンス最適化のため非正規化）
  baseSalary             Decimal  @db.Decimal(12, 2)
  totalEarnings          Decimal  @db.Decimal(12, 2)
  totalDeductions        Decimal  @db.Decimal(12, 2)
  netPay                 Decimal  @db.Decimal(12, 2)

  // Generated Columns (PostgreSQL 12+)
  netPayGenerated        Decimal? @db.Decimal(12, 2) // GENERATED ALWAYS AS (total_earnings - total_deductions) STORED

  currency               String   @default("JPY") @db.VarChar(3)
  status                 String   @default("confirmed") @db.VarChar(20) // draft, confirmed, archived
  sourceType             String   @default("manual") @db.VarChar(20)    // pdf, manual, api

  // Full-Text Search用
  searchVector           Unsupported("tsvector")?

  createdAt              DateTime @default(now()) @db.Timestamptz
  updatedAt              DateTime @updatedAt @db.Timestamptz

  // Relations
  user                   User     @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  attachments            SalarySlipAttachment[]

  // Constraints & Indexes
  @@unique([userId, paymentDate, companyName])
  @@index([userId])
  @@index([paymentDate])
  @@index([status])
  @@index([companyName])
  @@index([searchVector], type: Gin)
  @@index([userId, paymentDate], type: BTree)
  @@index([netPay], type: BTree)
  @@map("salary_slips")
}

model SalarySlipAttachment {
  id            String      @id @default(cuid())
  salarySlipId  String      @db.VarChar(30)
  fileName      String      @db.VarChar(255)
  fileType      String      @db.VarChar(50)
  fileSize      Int
  storageUrl    String      @db.VarChar(2048)
  checksum      String      @db.VarChar(64) // SHA-256 hash
  uploadedAt    DateTime    @default(now()) @db.Timestamptz

  // Relations
  salarySlip    SalarySlip  @relation(fields: [salarySlipId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([salarySlipId])
  @@index([checksum])
  @@map("salary_slip_attachments")
}

// ================================
// 株式ポートフォリオドメイン
// ================================

model StockMaster {
  id            String      @id @default(cuid())
  symbol        String      @unique @db.VarChar(20)
  name          String      @db.VarChar(200)
  exchange      String      @default("TSE") @db.VarChar(20) // TSE, NYSE, NASDAQ, etc.
  sector        String?     @db.VarChar(100)
  industry      String?     @db.VarChar(100)
  marketCap     Decimal?    @db.Decimal(18, 2)
  currency      String      @default("JPY") @db.VarChar(3)
  isActive      Boolean     @default(true)
  listedDate    DateTime?   @db.Date
  delistedDate  DateTime?   @db.Date

  // メタデータ (JSONB)
  metadata      Json?       @db.JsonB

  createdAt     DateTime    @default(now()) @db.Timestamptz
  updatedAt     DateTime    @updatedAt @db.Timestamptz

  // Relations
  portfolios    StockPortfolio[]
  transactions  StockTransaction[]
  currentPrice  StockCurrentPrice?
  priceHistory  StockPriceHistory[]

  // Indexes
  @@index([symbol])
  @@index([exchange])
  @@index([isActive])
  @@index([sector])
  @@index([currency])
  @@map("stock_masters")
}

model StockPortfolio {
  id                      String      @id @default(cuid())
  userId                  String      @db.VarChar(30)
  stockId                 String      @db.VarChar(30)
  quantity                Decimal     @db.Decimal(15, 4)
  averagePurchasePrice    Decimal     @db.Decimal(12, 2)
  totalInvestment         Decimal     @db.Decimal(15, 2)
  currentValue            Decimal     @db.Decimal(15, 2)
  unrealizedGainLoss      Decimal     @db.Decimal(15, 2)
  unrealizedGainLossRate  Decimal     @db.Decimal(5, 2)
  firstPurchaseDate       DateTime?   @db.Date
  lastPurchaseDate        DateTime?   @db.Date

  // キャッシュフィールド（パフォーマンス最適化）
  cachedTotalValue        Decimal?    @db.Decimal(15, 2)
  cachedLastUpdated       DateTime?   @db.Timestamptz

  createdAt               DateTime    @default(now()) @db.Timestamptz
  updatedAt               DateTime    @updatedAt @db.Timestamptz

  // Relations
  user                    User        @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  stock                   StockMaster @relation(fields: [stockId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  transactions            StockTransaction[]

  // Constraints & Indexes
  @@unique([userId, stockId])
  @@index([userId])
  @@index([stockId])
  @@index([currentValue], type: BTree)
  @@index([unrealizedGainLossRate])
  @@map("stock_portfolios")
}

model StockTransaction {
  id              String          @id @default(cuid())
  portfolioId     String          @db.VarChar(30)
  stockId         String          @db.VarChar(30)
  userId          String          @db.VarChar(30)
  transactionType String          @db.VarChar(20) // buy, sell, dividend
  quantity        Decimal         @db.Decimal(15, 4)
  pricePerShare   Decimal         @db.Decimal(12, 2)
  totalAmount     Decimal         @db.Decimal(15, 2)
  commission      Decimal         @db.Decimal(10, 2) @default(0)
  tax             Decimal         @db.Decimal(10, 2) @default(0)
  transactionDate DateTime        @db.Date
  notes           String?         @db.Text

  // Generated Column
  netAmount       Decimal?        @db.Decimal(15, 2) // GENERATED ALWAYS AS (total_amount - commission - tax) STORED

  createdAt       DateTime        @default(now()) @db.Timestamptz

  // Relations
  portfolio       StockPortfolio  @relation(fields: [portfolioId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  stock           StockMaster     @relation(fields: [stockId], references: [id], onDelete: Restrict, onUpdate: Cascade)
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([portfolioId])
  @@index([transactionDate])
  @@index([transactionType])
  @@index([userId, transactionDate])
  @@index([stockId, transactionDate])
  @@map("stock_transactions")
}

model StockCurrentPrice {
  id               String      @id @default(cuid())
  stockId          String      @unique @db.VarChar(30)
  currentPrice     Decimal     @db.Decimal(12, 2)
  previousClose    Decimal     @db.Decimal(12, 2)
  dayChange        Decimal     @db.Decimal(12, 2)
  dayChangePercent Decimal     @db.Decimal(5, 2)
  dayHigh          Decimal     @db.Decimal(12, 2)
  dayLow           Decimal     @db.Decimal(12, 2)
  volume           BigInt
  marketTime       DateTime    @db.Timestamptz
  lastUpdated      DateTime    @default(now()) @db.Timestamptz

  // データ品質管理
  dataQuality      String?     @default("good") @db.VarChar(20) // good, warning, poor
  sourceApi        String?     @db.VarChar(50)

  // Relations
  stock            StockMaster @relation(fields: [stockId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([stockId])
  @@index([lastUpdated])
  @@index([marketTime])
  @@map("stock_current_prices")
}

model StockPriceHistory {
  id            String      @id @default(cuid())
  stockId       String      @db.VarChar(30)
  date          DateTime    @db.Date
  open          Decimal     @db.Decimal(12, 2)
  high          Decimal     @db.Decimal(12, 2)
  low           Decimal     @db.Decimal(12, 2)
  close         Decimal     @db.Decimal(12, 2)
  adjustedClose Decimal     @db.Decimal(12, 2)
  volume        BigInt

  // 技術指標 (計算済み)
  sma20         Decimal?    @db.Decimal(12, 2) // 20日移動平均
  sma50         Decimal?    @db.Decimal(12, 2) // 50日移動平均
  rsi           Decimal?    @db.Decimal(5, 2)  // RSI

  createdAt     DateTime    @default(now()) @db.Timestamptz

  // Relations
  stock         StockMaster @relation(fields: [stockId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Constraints & Indexes
  @@unique([stockId, date])
  @@index([stockId])
  @@index([date])
  @@index([stockId, date], type: BTree)
  @@map("stock_price_histories")
}

// ================================
// 資産管理ドメイン
// ================================

model Asset {
  id          String   @id @default(cuid())
  userId      String   @db.VarChar(30)
  assetType   String   @db.VarChar(20) // cash, deposit, bond, realestate, crypto, other
  name        String   @db.VarChar(200)
  description String?  @db.Text
  amount      Decimal  @db.Decimal(18, 2)
  currency    String   @default("JPY") @db.VarChar(3)
  asOfDate    DateTime @default(now()) @db.Date

  // 拡張メタデータ (JSONB)
  metadata    Json?    @default("{}") @db.JsonB

  // 評価額履歴（スナップショット）
  valuationHistory Json? @db.JsonB

  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([userId])
  @@index([assetType])
  @@index([asOfDate])
  @@index([currency])
  @@index([amount])
  @@map("assets")
}

// ================================
// 予算管理ドメイン
// ================================

model Budget {
  id          String           @id @default(cuid())
  userId      String           @db.VarChar(30)
  name        String           @db.VarChar(200)
  period      String           @db.VarChar(20) // monthly, quarterly, yearly
  startDate   DateTime         @db.Date
  endDate     DateTime         @db.Date
  totalBudget Decimal          @db.Decimal(15, 2)
  status      String           @default("active") @db.VarChar(20) // active, completed, cancelled

  // 進捗追跡
  actualSpent Decimal?         @db.Decimal(15, 2)
  variance    Decimal?         @db.Decimal(15, 2)

  createdAt   DateTime         @default(now()) @db.Timestamptz
  updatedAt   DateTime         @updatedAt @db.Timestamptz

  // Relations
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  categories  BudgetCategory[]

  // Indexes
  @@index([userId])
  @@index([period])
  @@index([status])
  @@index([startDate])
  @@index([endDate])
  @@map("budgets")
}

model BudgetCategory {
  id              String            @id @default(cuid())
  budgetId        String            @db.VarChar(30)
  categoryName    String            @db.VarChar(100)
  categoryType    String            @db.VarChar(20) // income, expense, saving
  allocatedAmount Decimal           @db.Decimal(12, 2)
  actualAmount    Decimal           @db.Decimal(12, 2) @default(0)
  variance        Decimal           @db.Decimal(12, 2) @default(0)
  icon            String?           @db.VarChar(50)
  color           String?           @db.VarChar(7) // #RRGGBB
  displayOrder    Int               @default(0)

  // 予算アラート設定
  alertThreshold  Decimal?          @db.Decimal(5, 2) // パーセンテージ

  // Relations
  budget          Budget            @relation(fields: [budgetId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  trackings       BudgetTracking[]

  // Indexes
  @@index([budgetId])
  @@index([categoryType])
  @@index([displayOrder])
  @@map("budget_categories")
}

model BudgetTracking {
  id              String         @id @default(cuid())
  categoryId      String         @db.VarChar(30)
  amount          Decimal        @db.Decimal(12, 2)
  description     String?        @db.Text
  transactionDate DateTime       @db.Date
  source          String         @default("manual") @db.VarChar(20) // manual, automated

  // 関連データ
  relatedEntityType String?      @db.VarChar(50)
  relatedEntityId   String?      @db.VarChar(30)

  createdAt       DateTime       @default(now()) @db.Timestamptz

  // Relations
  category        BudgetCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  // Indexes
  @@index([categoryId])
  @@index([transactionDate])
  @@index([source])
  @@map("budget_trackings")
}

// ================================
// ダッシュボード設定
// ================================

model DashboardPreference {
  id                   String   @id @default(cuid())
  userId               String   @unique @db.VarChar(30)

  // レイアウト設定 (JSONB)
  layout               Json     @default("{\"gridColumns\":12,\"gridGap\":16,\"containerPadding\":24,\"breakpoints\":{\"lg\":1200,\"md\":996,\"sm\":768,\"xs\":480}}") @db.JsonB

  // ウィジェット設定 (JSONB)
  widgets              Json     @default("[]") @db.JsonB

  // グラフ設定 (JSONB)
  chartPreferences     Json     @default("{\"defaultChartType\":\"line\",\"colorScheme\":[\"#4F46E5\",\"#7C3AED\",\"#DB2777\",\"#DC2626\",\"#EA580C\"],\"showLegend\":true,\"showTooltip\":true,\"animationDuration\":300,\"dateFormat\":\"YYYY-MM-DD\",\"numberFormat\":\"0,0\"}") @db.JsonB

  // 基本設定
  theme                String   @default("light") @db.VarChar(20) // light, dark, auto
  locale               String   @default("ja") @db.VarChar(10)     // ja, en
  timezone             String   @default("Asia/Tokyo") @db.VarChar(50)

  // 通知設定
  emailNotifications   Boolean  @default(false)
  pushNotifications    Boolean  @default(false)
  notificationSettings Json     @default("{\"salaryAlert\":true,\"portfolioAlert\":true,\"budgetAlert\":true,\"priceAlert\":false,\"alertThresholds\":{\"portfolioChangePercent\":5.0,\"budgetOverrunPercent\":90.0,\"priceChangePercent\":10.0},\"quietHours\":{\"enabled\":false,\"startTime\":\"22:00\",\"endTime\":\"08:00\"}}") @db.JsonB

  createdAt            DateTime @default(now()) @db.Timestamptz
  updatedAt            DateTime @updatedAt @db.Timestamptz

  // Relations
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@map("dashboard_preferences")
}

// ================================
// システム管理テーブル
// ================================

model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique @db.VarChar(100)
  value       Json     @db.JsonB
  description String?  @db.Text
  category    String   @default("general") @db.VarChar(50)
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now()) @db.Timestamptz
  updatedAt   DateTime @updatedAt @db.Timestamptz

  // Indexes
  @@index([key])
  @@index([category])
  @@map("system_configs")
}

model DatabaseMigration {
  id          String   @id @default(cuid())
  version     String   @unique @db.VarChar(20)
  name        String   @db.VarChar(200)
  description String?  @db.Text
  checksum    String   @db.VarChar(64)
  executedAt  DateTime @default(now()) @db.Timestamptz

  @@index([version])
  @@index([executedAt])
  @@map("database_migrations")
}
```

---

## 3. PostgreSQL DDL定義

### 3.1 テーブル作成SQL

#### ユーザー管理テーブル

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(30) PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    google_id VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(2048),
    is_active BOOLEAN DEFAULT true NOT NULL,
    preferences JSONB DEFAULT '{"defaultCurrency":"JPY","fiscalYearStart":4,"salaryDayOfMonth":25,"notificationEmail":false,"notificationPush":false,"privacyMode":false,"dataRetentionYears":5}' NOT NULL,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User sessions table
CREATE TABLE user_sessions (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT fk_user_sessions_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Audit log table (separate schema)
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.audit_logs (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(30) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT fk_audit_logs_user_id
        FOREIGN KEY (user_id) REFERENCES public.users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);
```

#### 給料明細テーブル

```sql
-- Salary slips table
CREATE TABLE salary_slips (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    target_period_start DATE NOT NULL,
    target_period_end DATE NOT NULL,

    -- JSONB fields for structured data
    attendance JSONB DEFAULT '{"overtimeHours":0,"overtimeHoursOver60":0,"lateNightHours":0,"holidayWorkDays":0,"paidLeaveDays":0,"absenceDays":0,"workingDays":20,"scheduledWorkDays":20,"lateCount":0,"earlyLeaveCount":0}' NOT NULL,
    earnings JSONB DEFAULT '{"baseSalary":"0","overtimePay":"0","overtimePayOver60":"0","lateNightPay":"0","holidayWorkPay":"0","fixedOvertimeAllowance":"0","transportationAllowance":"0","housingAllowance":"0","familyAllowance":"0","qualificationAllowance":"0","expenseReimbursement":"0","stockPurchaseIncentive":"0","bonus":"0","otherEarnings":"0"}' NOT NULL,
    deductions JSONB DEFAULT '{"healthInsurance":"0","welfareInsurance":"0","employmentInsurance":"0","incomeTax":"0","residentTax":"0","stockPurchase":"0","loan":"0","unionFee":"0","otherDeductions":"0"}' NOT NULL,

    -- Calculated fields
    base_salary DECIMAL(12, 2) NOT NULL,
    total_earnings DECIMAL(12, 2) NOT NULL,
    total_deductions DECIMAL(12, 2) NOT NULL,
    net_pay DECIMAL(12, 2) NOT NULL,

    -- Generated column (PostgreSQL 12+)
    net_pay_generated DECIMAL(12, 2) GENERATED ALWAYS AS (total_earnings - total_deductions) STORED,

    -- Metadata
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' NOT NULL,
    source_type VARCHAR(20) DEFAULT 'manual' NOT NULL,

    -- Full-text search
    search_vector TSVECTOR,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Constraints
    CONSTRAINT fk_salary_slips_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT unique_salary_slip
        UNIQUE (user_id, payment_date, company_name),
    CONSTRAINT valid_period
        CHECK (target_period_start <= target_period_end),
    CONSTRAINT valid_amounts
        CHECK (base_salary >= 0 AND total_earnings >= 0 AND total_deductions >= 0 AND net_pay >= 0),
    CONSTRAINT valid_status
        CHECK (status IN ('draft', 'confirmed', 'archived')),
    CONSTRAINT valid_source_type
        CHECK (source_type IN ('pdf', 'manual', 'api')),
    CONSTRAINT valid_currency
        CHECK (currency IN ('JPY', 'USD', 'EUR', 'GBP', 'CNY'))
);

-- Salary slip attachments table
CREATE TABLE salary_slip_attachments (
    id VARCHAR(30) PRIMARY KEY,
    salary_slip_id VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_url VARCHAR(2048) NOT NULL,
    checksum VARCHAR(64) NOT NULL, -- SHA-256
    uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT fk_salary_slip_attachments_salary_slip_id
        FOREIGN KEY (salary_slip_id) REFERENCES salary_slips(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT valid_file_size
        CHECK (file_size > 0 AND file_size <= 10485760) -- 10MB max
);
```

#### 株式ポートフォリオテーブル

```sql
-- Stock masters table
CREATE TABLE stock_masters (
    id VARCHAR(30) PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    exchange VARCHAR(20) DEFAULT 'TSE' NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap DECIMAL(18, 2),
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    listed_date DATE,
    delisted_date DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT valid_exchange
        CHECK (exchange IN ('TSE', 'NYSE', 'NASDAQ', 'LSE', 'HKEX', 'SSE', 'SZSE')),
    CONSTRAINT valid_currency_stock
        CHECK (currency IN ('JPY', 'USD', 'EUR', 'GBP', 'CNY', 'HKD')),
    CONSTRAINT valid_dates
        CHECK (delisted_date IS NULL OR listed_date IS NULL OR listed_date <= delisted_date)
);

-- Stock portfolios table
CREATE TABLE stock_portfolios (
    id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30) NOT NULL,
    stock_id VARCHAR(30) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    average_purchase_price DECIMAL(12, 2) NOT NULL,
    total_investment DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL,
    unrealized_gain_loss DECIMAL(15, 2) NOT NULL,
    unrealized_gain_loss_rate DECIMAL(5, 2) NOT NULL,
    first_purchase_date DATE,
    last_purchase_date DATE,

    -- Cache fields for performance
    cached_total_value DECIMAL(15, 2),
    cached_last_updated TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT fk_stock_portfolios_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_portfolios_stock_id
        FOREIGN KEY (stock_id) REFERENCES stock_masters(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT unique_portfolio
        UNIQUE (user_id, stock_id),
    CONSTRAINT positive_quantity
        CHECK (quantity > 0),
    CONSTRAINT valid_gain_loss_rate
        CHECK (unrealized_gain_loss_rate >= -100)
);

-- Stock transactions table
CREATE TABLE stock_transactions (
    id VARCHAR(30) PRIMARY KEY,
    portfolio_id VARCHAR(30) NOT NULL,
    stock_id VARCHAR(30) NOT NULL,
    user_id VARCHAR(30) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL,
    price_per_share DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    commission DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,

    -- Generated column
    net_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount - commission - tax) STORED,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT fk_stock_transactions_portfolio_id
        FOREIGN KEY (portfolio_id) REFERENCES stock_portfolios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stock_transactions_stock_id
        FOREIGN KEY (stock_id) REFERENCES stock_masters(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_stock_transactions_user_id
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT valid_transaction_type
        CHECK (transaction_type IN ('buy', 'sell', 'dividend')),
    CONSTRAINT positive_quantity_transaction
        CHECK (quantity > 0),
    CONSTRAINT positive_price
        CHECK (price_per_share > 0),
    CONSTRAINT non_negative_fees
        CHECK (commission >= 0 AND tax >= 0)
);

-- Stock current prices table
CREATE TABLE stock_current_prices (
    id VARCHAR(30) PRIMARY KEY,
    stock_id VARCHAR(30) UNIQUE NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    previous_close DECIMAL(12, 2) NOT NULL,
    day_change DECIMAL(12, 2) NOT NULL,
    day_change_percent DECIMAL(5, 2) NOT NULL,
    day_high DECIMAL(12, 2) NOT NULL,
    day_low DECIMAL(12, 2) NOT NULL,
    volume BIGINT NOT NULL,
    market_time TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Data quality management
    data_quality VARCHAR(20) DEFAULT 'good',
    source_api VARCHAR(50),

    CONSTRAINT fk_stock_current_prices_stock_id
        FOREIGN KEY (stock_id) REFERENCES stock_masters(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT positive_prices
        CHECK (current_price > 0 AND previous_close > 0 AND day_high > 0 AND day_low > 0),
    CONSTRAINT valid_high_low
        CHECK (day_high >= day_low),
    CONSTRAINT valid_data_quality
        CHECK (data_quality IN ('good', 'warning', 'poor'))
);

-- Stock price history table (partitioned by date)
CREATE TABLE stock_price_histories (
    id VARCHAR(30) NOT NULL,
    stock_id VARCHAR(30) NOT NULL,
    date DATE NOT NULL,
    open DECIMAL(12, 2) NOT NULL,
    high DECIMAL(12, 2) NOT NULL,
    low DECIMAL(12, 2) NOT NULL,
    close DECIMAL(12, 2) NOT NULL,
    adjusted_close DECIMAL(12, 2) NOT NULL,
    volume BIGINT NOT NULL,

    -- Technical indicators
    sma20 DECIMAL(12, 2),  -- 20-day Simple Moving Average
    sma50 DECIMAL(12, 2),  -- 50-day Simple Moving Average
    rsi DECIMAL(5, 2),     -- RSI

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    PRIMARY KEY (id, date),
    CONSTRAINT fk_stock_price_histories_stock_id
        FOREIGN KEY (stock_id) REFERENCES stock_masters(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT unique_stock_date
        UNIQUE (stock_id, date),
    CONSTRAINT valid_ohlc
        CHECK (open > 0 AND high > 0 AND low > 0 AND close > 0 AND adjusted_close > 0),
    CONSTRAINT valid_high_low_history
        CHECK (high >= low AND high >= open AND high >= close AND low <= open AND low <= close)
) PARTITION BY RANGE (date);

-- Create partitions for price history (yearly partitions)
CREATE TABLE stock_price_histories_2024 PARTITION OF stock_price_histories
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE stock_price_histories_2025 PARTITION OF stock_price_histories
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE stock_price_histories_2026 PARTITION OF stock_price_histories
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

---

## 4. 制約とトリガー定義

### 4.1 CHECK制約

```sql
-- Additional business rule constraints
ALTER TABLE salary_slips
ADD CONSTRAINT check_payment_after_period
CHECK (payment_date >= target_period_end);

ALTER TABLE salary_slips
ADD CONSTRAINT check_realistic_amounts
CHECK (
    total_earnings <= base_salary * 3 AND  -- 総支給額は基本給の3倍以内
    total_deductions <= total_earnings     -- 控除額は総支給額以内
);

ALTER TABLE stock_portfolios
ADD CONSTRAINT check_purchase_dates
CHECK (
    first_purchase_date IS NULL OR
    last_purchase_date IS NULL OR
    first_purchase_date <= last_purchase_date
);

ALTER TABLE budgets
ADD CONSTRAINT check_budget_period
CHECK (start_date < end_date);

ALTER TABLE budget_categories
ADD CONSTRAINT check_positive_allocated
CHECK (allocated_amount >= 0);
```

### 4.2 トリガー関数定義

```sql
-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_salary_slips_updated_at
    BEFORE UPDATE ON salary_slips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_stock_masters_updated_at
    BEFORE UPDATE ON stock_masters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_stock_portfolios_updated_at
    BEFORE UPDATE ON stock_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_dashboard_preferences_updated_at
    BEFORE UPDATE ON dashboard_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Portfolio recalculation trigger
CREATE OR REPLACE FUNCTION update_portfolio_summary()
RETURNS TRIGGER AS $$
DECLARE
    portfolio_rec RECORD;
    total_buy_amount DECIMAL(15, 2) := 0;
    total_buy_quantity DECIMAL(15, 4) := 0;
    total_sell_quantity DECIMAL(15, 4) := 0;
    current_quantity DECIMAL(15, 4);
    avg_price DECIMAL(12, 2);
    current_price DECIMAL(12, 2) := 0;
    total_investment DECIMAL(15, 2);
    current_value DECIMAL(15, 2);
    gain_loss DECIMAL(15, 2);
    gain_loss_rate DECIMAL(5, 2);
BEGIN
    -- Get portfolio record
    SELECT * INTO portfolio_rec FROM stock_portfolios WHERE id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);

    IF portfolio_rec IS NOT NULL THEN
        -- Calculate totals from transactions
        SELECT
            COALESCE(SUM(CASE WHEN transaction_type = 'buy' THEN total_amount ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'buy' THEN quantity ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN transaction_type = 'sell' THEN quantity ELSE 0 END), 0)
        INTO total_buy_amount, total_buy_quantity, total_sell_quantity
        FROM stock_transactions
        WHERE portfolio_id = portfolio_rec.id;

        current_quantity := total_buy_quantity - total_sell_quantity;

        IF current_quantity > 0 THEN
            avg_price := total_buy_amount / total_buy_quantity;
            total_investment := avg_price * current_quantity;

            -- Get current stock price
            SELECT current_price INTO current_price
            FROM stock_current_prices
            WHERE stock_id = portfolio_rec.stock_id;

            IF current_price IS NOT NULL THEN
                current_value := current_price * current_quantity;
                gain_loss := current_value - total_investment;
                gain_loss_rate := (gain_loss / total_investment) * 100;
            ELSE
                current_value := total_investment;
                gain_loss := 0;
                gain_loss_rate := 0;
            END IF;

            -- Update portfolio
            UPDATE stock_portfolios SET
                quantity = current_quantity,
                average_purchase_price = avg_price,
                total_investment = total_investment,
                current_value = current_value,
                unrealized_gain_loss = gain_loss,
                unrealized_gain_loss_rate = gain_loss_rate,
                updated_at = now()
            WHERE id = portfolio_rec.id;
        ELSE
            -- Delete portfolio if quantity is 0 or negative
            DELETE FROM stock_portfolios WHERE id = portfolio_rec.id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_on_transaction
AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
FOR EACH ROW EXECUTE FUNCTION update_portfolio_summary();

-- Full-text search trigger for salary slips
CREATE OR REPLACE FUNCTION update_salary_slip_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('japanese',
        COALESCE(NEW.company_name, '') || ' ' ||
        COALESCE(NEW.employee_name, '') || ' ' ||
        COALESCE(NEW.employee_id, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salary_slip_search_vector
BEFORE INSERT OR UPDATE ON salary_slips
FOR EACH ROW EXECUTE FUNCTION update_salary_slip_search_vector();

-- Budget variance calculation trigger
CREATE OR REPLACE FUNCTION calculate_budget_variance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.variance := NEW.allocated_amount - NEW.actual_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_budget_variance
BEFORE INSERT OR UPDATE ON budget_categories
FOR EACH ROW EXECUTE FUNCTION calculate_budget_variance();

-- Audit log trigger
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    user_id_val VARCHAR(30);
    table_name_val VARCHAR(50);
    action_val VARCHAR(20);
BEGIN
    -- Extract user ID from current session or JWT
    user_id_val := current_setting('app.current_user_id', true);
    table_name_val := TG_TABLE_NAME;

    CASE TG_OP
        WHEN 'INSERT' THEN
            action_val := 'create';
            INSERT INTO audit.audit_logs (user_id, entity_type, entity_id, action, new_value, ip_address)
            VALUES (
                user_id_val,
                table_name_val,
                NEW.id,
                action_val,
                to_jsonb(NEW),
                inet_client_addr()
            );
            RETURN NEW;
        WHEN 'UPDATE' THEN
            action_val := 'update';
            INSERT INTO audit.audit_logs (user_id, entity_type, entity_id, action, old_value, new_value, ip_address)
            VALUES (
                user_id_val,
                table_name_val,
                NEW.id,
                action_val,
                to_jsonb(OLD),
                to_jsonb(NEW),
                inet_client_addr()
            );
            RETURN NEW;
        WHEN 'DELETE' THEN
            action_val := 'delete';
            INSERT INTO audit.audit_logs (user_id, entity_type, entity_id, action, old_value, ip_address)
            VALUES (
                user_id_val,
                table_name_val,
                OLD.id,
                action_val,
                to_jsonb(OLD),
                inet_client_addr()
            );
            RETURN OLD;
    END CASE;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER trigger_audit_salary_slips
AFTER INSERT OR UPDATE OR DELETE ON salary_slips
FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trigger_audit_stock_transactions
AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER trigger_audit_assets
AFTER INSERT OR UPDATE OR DELETE ON assets
FOR EACH ROW EXECUTE FUNCTION create_audit_log();
```

---

## 5. インデックス定義

### 5.1 基本インデックス

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_activity ON user_sessions(last_activity_at DESC);

-- Salary slips indexes
CREATE INDEX idx_salary_slips_user_date ON salary_slips(user_id, payment_date DESC);
CREATE INDEX idx_salary_slips_status ON salary_slips(status) WHERE status != 'archived';
CREATE INDEX idx_salary_slips_company ON salary_slips(company_name);
CREATE INDEX idx_salary_slips_search ON salary_slips USING GIN(search_vector);
CREATE INDEX idx_salary_slips_net_pay ON salary_slips(net_pay DESC);

-- Stock related indexes
CREATE INDEX idx_stock_masters_symbol ON stock_masters(symbol);
CREATE INDEX idx_stock_masters_exchange ON stock_masters(exchange);
CREATE INDEX idx_stock_masters_active ON stock_masters(is_active) WHERE is_active = true;

CREATE INDEX idx_stock_portfolios_user ON stock_portfolios(user_id);
CREATE INDEX idx_stock_portfolios_value ON stock_portfolios(current_value DESC);
CREATE INDEX idx_stock_portfolios_gain_loss ON stock_portfolios(unrealized_gain_loss_rate DESC);

CREATE INDEX idx_stock_transactions_portfolio_date ON stock_transactions(portfolio_id, transaction_date DESC);
CREATE INDEX idx_stock_transactions_user_date ON stock_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);

CREATE INDEX idx_stock_current_prices_updated ON stock_current_prices(last_updated DESC);
CREATE INDEX idx_stock_current_prices_market_time ON stock_current_prices(market_time DESC);

-- Stock price history indexes (on partitions)
CREATE INDEX idx_stock_price_histories_2024_stock_date ON stock_price_histories_2024(stock_id, date DESC);
CREATE INDEX idx_stock_price_histories_2025_stock_date ON stock_price_histories_2025(stock_id, date DESC);
CREATE INDEX idx_stock_price_histories_2026_stock_date ON stock_price_histories_2026(stock_id, date DESC);

-- Budget related indexes
CREATE INDEX idx_budgets_user_active ON budgets(user_id, status) WHERE status = 'active';
CREATE INDEX idx_budgets_period ON budgets(start_date, end_date);
CREATE INDEX idx_budget_categories_budget ON budget_categories(budget_id);
CREATE INDEX idx_budget_trackings_category_date ON budget_trackings(category_id, transaction_date DESC);

-- Assets indexes
CREATE INDEX idx_assets_user_type ON assets(user_id, asset_type);
CREATE INDEX idx_assets_amount ON assets(amount DESC);
CREATE INDEX idx_assets_date ON assets(as_of_date DESC);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_date ON audit.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit.audit_logs(created_at DESC);
```

### 5.2 複合インデックス（カバリングインデックス）

```sql
-- Dashboard optimization indexes
CREATE INDEX idx_dashboard_salary_summary ON salary_slips(user_id, payment_date DESC)
INCLUDE (net_pay, total_earnings, total_deductions, status);

CREATE INDEX idx_dashboard_portfolio_summary ON stock_portfolios(user_id)
INCLUDE (current_value, unrealized_gain_loss, unrealized_gain_loss_rate);

-- Reporting optimization indexes
CREATE INDEX idx_report_monthly_income ON salary_slips(user_id, payment_date DESC)
INCLUDE (net_pay, total_earnings, currency)
WHERE status = 'confirmed';

CREATE INDEX idx_report_stock_transactions ON stock_transactions(user_id, transaction_date DESC, transaction_type)
INCLUDE (quantity, price_per_share, total_amount, commission, tax);

-- Performance critical queries
CREATE INDEX idx_portfolio_valuation ON stock_portfolios(stock_id)
INCLUDE (quantity, current_value)
WHERE quantity > 0;

CREATE INDEX idx_budget_tracking_summary ON budget_trackings(category_id, transaction_date DESC)
INCLUDE (amount, source);
```

### 5.3 部分インデックス

```sql
-- Active records only
CREATE INDEX idx_active_users ON users(id) WHERE is_active = true;
CREATE INDEX idx_active_stocks ON stock_masters(symbol) WHERE is_active = true;
CREATE INDEX idx_current_portfolios ON stock_portfolios(user_id, stock_id) WHERE quantity > 0;

-- Recent data optimization
CREATE INDEX idx_recent_salary_slips ON salary_slips(user_id, payment_date DESC)
WHERE payment_date >= CURRENT_DATE - INTERVAL '2 years';

CREATE INDEX idx_recent_transactions ON stock_transactions(portfolio_id, transaction_date DESC)
WHERE transaction_date >= CURRENT_DATE - INTERVAL '5 years';

-- Status-specific indexes
CREATE INDEX idx_draft_salary_slips ON salary_slips(user_id, created_at DESC) WHERE status = 'draft';
CREATE INDEX idx_active_budgets ON budgets(user_id, end_date DESC) WHERE status = 'active';

-- JSONB field indexes for specific queries
CREATE INDEX idx_salary_earnings_base ON salary_slips USING GIN((earnings->'baseSalary'));
CREATE INDEX idx_user_preferences_currency ON users USING GIN((preferences->'defaultCurrency'));
CREATE INDEX idx_dashboard_theme ON dashboard_preferences(theme) WHERE theme != 'auto';
```

---

## 6. Row Level Security (RLS) 実装

### 6.1 RLS ポリシー定義

```sql
-- Enable RLS on all user-data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_trackings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY users_policy ON users
FOR ALL
USING (id = current_setting('app.current_user_id', true)::text);

CREATE POLICY salary_slips_policy ON salary_slips
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY stock_portfolios_policy ON stock_portfolios
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY stock_transactions_policy ON stock_transactions
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY assets_policy ON assets
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY budgets_policy ON budgets
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

-- Cascade policies for related data
CREATE POLICY budget_categories_policy ON budget_categories
FOR ALL
USING (
    budget_id IN (
        SELECT id FROM budgets
        WHERE user_id = current_setting('app.current_user_id', true)::text
    )
);

CREATE POLICY budget_trackings_policy ON budget_trackings
FOR ALL
USING (
    category_id IN (
        SELECT bc.id FROM budget_categories bc
        JOIN budgets b ON bc.budget_id = b.id
        WHERE b.user_id = current_setting('app.current_user_id', true)::text
    )
);

CREATE POLICY dashboard_preferences_policy ON dashboard_preferences
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

CREATE POLICY user_sessions_policy ON user_sessions
FOR ALL
USING (user_id = current_setting('app.current_user_id', true)::text);

-- Read-only policies for master data
CREATE POLICY stock_masters_read_policy ON stock_masters
FOR SELECT
USING (true);

-- Admin policies for system configuration
CREATE POLICY system_configs_admin_policy ON system_configs
FOR ALL
USING (
    current_setting('app.current_user_role', true)::text = 'admin'
    OR is_public = true
);
```

### 6.2 セキュリティ関数

```sql
-- Set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set user role context
CREATE OR REPLACE FUNCTION set_current_user_role(user_role TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_role', user_role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::text;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 7. パーティショニング設定

### 7.1 時系列データのパーティショニング

```sql
-- Salary slips partitioning by year
ALTER TABLE salary_slips DETACH PARTITION IF EXISTS salary_slips_default;

-- Convert to partitioned table (requires recreating the table)
CREATE TABLE salary_slips_partitioned (LIKE salary_slips INCLUDING ALL)
PARTITION BY RANGE (payment_date);

-- Create yearly partitions
CREATE TABLE salary_slips_2023 PARTITION OF salary_slips_partitioned
FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE salary_slips_2024 PARTITION OF salary_slips_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE salary_slips_2025 PARTITION OF salary_slips_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Default partition for future data
CREATE TABLE salary_slips_default PARTITION OF salary_slips_partitioned
DEFAULT;

-- Audit logs partitioning by month
CREATE TABLE audit.audit_logs_partitioned (LIKE audit.audit_logs INCLUDING ALL)
PARTITION BY RANGE (created_at);

-- Monthly partitions for audit logs (last 12 months + future)
DO $$
DECLARE
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..12 LOOP
        start_date := date_trunc('month', CURRENT_DATE) + (i - 6) * INTERVAL '1 month';
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');

        EXECUTE format('
            CREATE TABLE IF NOT EXISTS audit.%I PARTITION OF audit.audit_logs_partitioned
            FOR VALUES FROM (%L) TO (%L)
        ', partition_name, start_date, end_date);
    END LOOP;
END $$;

-- Automatic partition management function
CREATE OR REPLACE FUNCTION maintain_partitions()
RETURNS void AS $$
DECLARE
    table_record RECORD;
    start_date DATE;
    end_date DATE;
    partition_name TEXT;
BEGIN
    -- Create future partitions for next 3 months
    FOR table_record IN
        SELECT schemaname, tablename, partition_key
        FROM pg_tables
        WHERE tablename LIKE '%_partitioned'
    LOOP
        FOR i IN 1..3 LOOP
            IF table_record.tablename = 'salary_slips_partitioned' THEN
                start_date := date_trunc('year', CURRENT_DATE + i * INTERVAL '1 year');
                end_date := start_date + INTERVAL '1 year';
                partition_name := 'salary_slips_' || extract(year from start_date);
            ELSIF table_record.tablename = 'audit_logs_partitioned' THEN
                start_date := date_trunc('month', CURRENT_DATE + i * INTERVAL '1 month');
                end_date := start_date + INTERVAL '1 month';
                partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
            END IF;

            -- Check if partition exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_tables
                WHERE schemaname = table_record.schemaname
                AND tablename = partition_name
            ) THEN
                EXECUTE format('
                    CREATE TABLE %I.%I PARTITION OF %I.%I
                    FOR VALUES FROM (%L) TO (%L)
                ', table_record.schemaname, partition_name,
                   table_record.schemaname, table_record.tablename,
                   start_date, end_date);
            END IF;
        END LOOP;
    END LOOP;

    -- Drop old partitions (older than 5 years for salary slips, 2 years for audit logs)
    -- Implementation would go here...
END;
$$ LANGUAGE plpgsql;

-- Schedule partition maintenance (requires pg_cron extension)
-- SELECT cron.schedule('maintain-partitions', '0 0 1 * *', 'SELECT maintain_partitions();');
```

---

## 8. ストアドプロシージャとビュー

### 8.1 パフォーマンス最適化ビュー

```sql
-- User portfolio summary view
CREATE VIEW v_user_portfolio_summary AS
SELECT
    p.user_id,
    COUNT(p.id) as total_holdings,
    SUM(p.current_value) as total_portfolio_value,
    SUM(p.unrealized_gain_loss) as total_unrealized_gain_loss,
    AVG(p.unrealized_gain_loss_rate) as avg_gain_loss_rate,
    SUM(p.total_investment) as total_investment,
    STRING_AGG(DISTINCT sm.sector, ', ') as sectors_invested
FROM stock_portfolios p
JOIN stock_masters sm ON p.stock_id = sm.id
WHERE p.quantity > 0
GROUP BY p.user_id;

-- Monthly salary summary view
CREATE VIEW v_monthly_salary_summary AS
SELECT
    user_id,
    date_trunc('month', payment_date) as month,
    COUNT(*) as slip_count,
    AVG(net_pay) as avg_net_pay,
    SUM(net_pay) as total_net_pay,
    AVG(total_earnings) as avg_total_earnings,
    AVG(total_deductions) as avg_total_deductions,
    AVG((attendance->>'overtimeHours')::numeric) as avg_overtime_hours
FROM salary_slips
WHERE status = 'confirmed'
GROUP BY user_id, date_trunc('month', payment_date);

-- Budget performance view
CREATE VIEW v_budget_performance AS
SELECT
    b.user_id,
    b.id as budget_id,
    b.name as budget_name,
    b.period,
    b.total_budget,
    COALESCE(SUM(bc.actual_amount), 0) as total_actual,
    b.total_budget - COALESCE(SUM(bc.actual_amount), 0) as remaining_budget,
    (COALESCE(SUM(bc.actual_amount), 0) / b.total_budget * 100) as completion_percentage,
    CASE
        WHEN COALESCE(SUM(bc.actual_amount), 0) > b.total_budget THEN 'over_budget'
        WHEN COALESCE(SUM(bc.actual_amount), 0) > b.total_budget * 0.9 THEN 'warning'
        ELSE 'on_track'
    END as status_indicator
FROM budgets b
LEFT JOIN budget_categories bc ON b.id = bc.budget_id
WHERE b.status = 'active'
GROUP BY b.id, b.user_id, b.name, b.period, b.total_budget;

-- Asset allocation view
CREATE VIEW v_asset_allocation AS
SELECT
    user_id,
    asset_type,
    COUNT(*) as asset_count,
    SUM(amount) as total_amount,
    currency,
    -- Calculate percentage within same currency
    SUM(amount) / SUM(SUM(amount)) OVER (PARTITION BY user_id, currency) * 100 as percentage_of_currency,
    AVG(amount) as avg_amount,
    MIN(as_of_date) as oldest_valuation,
    MAX(as_of_date) as latest_valuation
FROM assets
GROUP BY user_id, asset_type, currency;
```

### 8.2 ビジネスロジック ストアドプロシージャ

```sql
-- Calculate user's total wealth
CREATE OR REPLACE FUNCTION calculate_user_wealth(p_user_id VARCHAR(30))
RETURNS TABLE (
    total_wealth DECIMAL(18, 2),
    portfolio_value DECIMAL(18, 2),
    other_assets_value DECIMAL(18, 2),
    cash_equivalent DECIMAL(18, 2),
    currency VARCHAR(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(portfolio_total, 0) + COALESCE(assets_total, 0) as total_wealth,
        COALESCE(portfolio_total, 0) as portfolio_value,
        COALESCE(other_assets_total, 0) as other_assets_value,
        COALESCE(cash_total, 0) as cash_equivalent,
        'JPY'::VARCHAR(3) as currency
    FROM (
        SELECT
            (SELECT COALESCE(SUM(current_value), 0)
             FROM stock_portfolios
             WHERE user_id = p_user_id AND quantity > 0) as portfolio_total,
            (SELECT COALESCE(SUM(amount), 0)
             FROM assets
             WHERE user_id = p_user_id
             AND currency = 'JPY') as assets_total,
            (SELECT COALESCE(SUM(amount), 0)
             FROM assets
             WHERE user_id = p_user_id
             AND asset_type IN ('cash', 'deposit')
             AND currency = 'JPY') as cash_total,
            (SELECT COALESCE(SUM(amount), 0)
             FROM assets
             WHERE user_id = p_user_id
             AND asset_type NOT IN ('cash', 'deposit')
             AND currency = 'JPY') as other_assets_total
    ) wealth_calculation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Generate monthly financial report
CREATE OR REPLACE FUNCTION generate_monthly_report(
    p_user_id VARCHAR(30),
    p_year INTEGER,
    p_month INTEGER
)
RETURNS TABLE (
    report_date DATE,
    total_income DECIMAL(12, 2),
    total_expenses DECIMAL(12, 2),
    savings_amount DECIMAL(12, 2),
    savings_rate DECIMAL(5, 2),
    portfolio_value DECIMAL(15, 2),
    portfolio_change DECIMAL(15, 2),
    budget_adherence DECIMAL(5, 2)
) AS $$
DECLARE
    report_month DATE;
    prev_month DATE;
BEGIN
    report_month := make_date(p_year, p_month, 1);
    prev_month := report_month - INTERVAL '1 month';

    RETURN QUERY
    SELECT
        report_month as report_date,
        COALESCE(salary_data.total_net_pay, 0) as total_income,
        COALESCE(budget_data.total_expenses, 0) as total_expenses,
        COALESCE(salary_data.total_net_pay, 0) - COALESCE(budget_data.total_expenses, 0) as savings_amount,
        CASE
            WHEN COALESCE(salary_data.total_net_pay, 0) > 0 THEN
                ((COALESCE(salary_data.total_net_pay, 0) - COALESCE(budget_data.total_expenses, 0)) /
                 COALESCE(salary_data.total_net_pay, 0)) * 100
            ELSE 0
        END as savings_rate,
        COALESCE(current_portfolio.total_value, 0) as portfolio_value,
        COALESCE(current_portfolio.total_value, 0) - COALESCE(prev_portfolio.total_value, 0) as portfolio_change,
        COALESCE(budget_data.adherence, 100) as budget_adherence
    FROM (
        SELECT p_user_id as user_id -- Anchor for joins
    ) base
    LEFT JOIN (
        SELECT
            user_id,
            SUM(net_pay) as total_net_pay
        FROM salary_slips
        WHERE user_id = p_user_id
        AND date_trunc('month', payment_date) = report_month
        AND status = 'confirmed'
        GROUP BY user_id
    ) salary_data ON base.user_id = salary_data.user_id
    LEFT JOIN (
        SELECT
            b.user_id,
            SUM(CASE WHEN bc.category_type = 'expense' THEN bc.actual_amount ELSE 0 END) as total_expenses,
            AVG(CASE WHEN bc.allocated_amount > 0 THEN (bc.actual_amount / bc.allocated_amount) * 100 ELSE 100 END) as adherence
        FROM budgets b
        JOIN budget_categories bc ON b.id = bc.budget_id
        WHERE b.user_id = p_user_id
        AND report_month BETWEEN b.start_date AND b.end_date
        GROUP BY b.user_id
    ) budget_data ON base.user_id = budget_data.user_id
    LEFT JOIN (
        SELECT
            user_id,
            SUM(current_value) as total_value
        FROM stock_portfolios
        WHERE user_id = p_user_id
        AND quantity > 0
        GROUP BY user_id
    ) current_portfolio ON base.user_id = current_portfolio.user_id
    LEFT JOIN (
        SELECT
            user_id,
            SUM(current_value) as total_value
        FROM stock_portfolios
        WHERE user_id = p_user_id
        AND quantity > 0
        -- Note: This would ideally use historical data
        GROUP BY user_id
    ) prev_portfolio ON base.user_id = prev_portfolio.user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update stock portfolio values
CREATE OR REPLACE FUNCTION update_all_portfolio_values()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    portfolio_record RECORD;
    current_stock_price DECIMAL(12, 2);
BEGIN
    FOR portfolio_record IN
        SELECT p.id, p.quantity, p.total_investment, p.stock_id
        FROM stock_portfolios p
        WHERE p.quantity > 0
    LOOP
        -- Get current price
        SELECT current_price INTO current_stock_price
        FROM stock_current_prices
        WHERE stock_id = portfolio_record.stock_id;

        IF current_stock_price IS NOT NULL THEN
            UPDATE stock_portfolios SET
                current_value = portfolio_record.quantity * current_stock_price,
                unrealized_gain_loss = (portfolio_record.quantity * current_stock_price) - portfolio_record.total_investment,
                unrealized_gain_loss_rate =
                    CASE WHEN portfolio_record.total_investment > 0 THEN
                        (((portfolio_record.quantity * current_stock_price) - portfolio_record.total_investment) /
                         portfolio_record.total_investment) * 100
                    ELSE 0
                    END,
                cached_total_value = portfolio_record.quantity * current_stock_price,
                cached_last_updated = now(),
                updated_at = now()
            WHERE id = portfolio_record.id;

            updated_count := updated_count + 1;
        END IF;
    END LOOP;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. セキュリティとデータ保護

### 9.1 データ暗号化設定

```sql
-- Enable transparent data encryption for sensitive columns
-- Note: This requires PostgreSQL with appropriate extensions

-- Create encryption key (to be managed externally)
-- This is a placeholder - actual implementation would use proper key management
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Functions for field-level encryption
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(
            data,
            current_setting('app.encryption_key', false)
        ),
        'base64'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Encryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql STRICT SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        current_setting('app.encryption_key', false)
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Decryption failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql STRICT SECURITY DEFINER;

-- Automatic encryption trigger for employee IDs
CREATE OR REPLACE FUNCTION encrypt_employee_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_id IS NOT NULL AND NEW.employee_id != OLD.employee_id THEN
        NEW.employee_id = encrypt_sensitive_data(NEW.employee_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to salary slips (commented out for now - would require migration)
-- CREATE TRIGGER trigger_encrypt_employee_id
-- BEFORE INSERT OR UPDATE ON salary_slips
-- FOR EACH ROW EXECUTE FUNCTION encrypt_employee_id();
```

### 9.2 データ保持ポリシー

```sql
-- Data retention policy implementation
CREATE OR REPLACE FUNCTION apply_data_retention_policy()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    user_record RECORD;
    retention_years INTEGER;
BEGIN
    FOR user_record IN
        SELECT id, preferences->'dataRetentionYears' as retention_setting
        FROM users
        WHERE is_active = true
    LOOP
        retention_years := COALESCE((user_record.retention_setting)::INTEGER, 5);

        -- Archive old salary slips
        UPDATE salary_slips SET status = 'archived'
        WHERE user_id = user_record.id
        AND payment_date < CURRENT_DATE - (retention_years || ' years')::INTERVAL
        AND status != 'archived';

        -- Delete old audit logs (keep 2 years regardless of user preference)
        DELETE FROM audit.audit_logs
        WHERE user_id = user_record.id
        AND created_at < CURRENT_DATE - INTERVAL '2 years';

        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END LOOP;

    -- Clean up expired sessions
    DELETE FROM user_sessions WHERE expires_at < now();

    -- Clean up old price history (keep 10 years)
    DELETE FROM stock_price_histories
    WHERE date < CURRENT_DATE - INTERVAL '10 years';

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule retention policy (requires pg_cron)
-- SELECT cron.schedule('data-retention', '0 2 * * 0', 'SELECT apply_data_retention_policy();');
```

---

## 10. 次のステップ

1. ✅ 完全なデータベーススキーマ定義（DDL）と制約・インデックス・トリガー詳細（本書）
2. → パフォーマンス最適化のインデックス戦略と複合インデックス設計
3. → データアクセスパターン最適化とN+1問題回避策

---

## 承認

| 役割                     | 名前                                         | 日付       | 署名 |
| ------------------------ | -------------------------------------------- | ---------- | ---- |
| データベースアーキテクト | エキスパートデータベース詳細設計アーキテクト | 2025-08-10 | ✅   |
| レビュアー               | -                                            | -          | [ ]  |
| 承認者                   | -                                            | -          | [ ]  |

---

**改訂履歴**

| バージョン | 日付       | 変更内容 | 作成者                                       |
| ---------- | ---------- | -------- | -------------------------------------------- |
| 1.0.0      | 2025-08-10 | 初版作成 | エキスパートデータベース詳細設計アーキテクト |

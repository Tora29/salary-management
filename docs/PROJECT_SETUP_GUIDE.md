# 開発環境セットアップガイド

## 概要

このガイドでは、給料管理システムの開発環境を構築します。
従来13週間の開発期間を6週間に短縮する効率化ライブラリを活用します。

---

## 前提条件

- Node.js 20.x LTS
- npm 10.x 以上
- PostgreSQL 15
- Redis 7.x
- Git

---

## Step 1: プロジェクト初期化

```bash
# プロジェクト作成
npm create svelte@latest salary-management
cd salary-management

# TypeScript、ESLint、Prettier、Vitestを選択
# TypeScript
# ESLint
# Prettier
# Vitest
# Playwright

# 依存関係インストール
npm install
```

---

## Step 2: ライブラリのインストール

### 認証・セキュリティ（Auth.js）
```bash
npm install @auth/sveltekit @auth/prisma-adapter
npm install @sentry/sveltekit
```

### データベース・ORM
```bash
npm install @prisma/client prisma
npm install ioredis
npm install zod
```

### PDF処理・OCR
```bash
npm install tesseract.js pdf-parse pdfjs-dist
```

### フォーム管理
```bash
npm install sveltekit-superforms
```

### UIコンポーネント
```bash
npm install @skeletonlabs/skeleton
npm install @floating-ui/dom
npm install tailwindcss @tailwindcss/forms @tailwindcss/typography
```

### データ処理・エクスポート
```bash
npm install xlsx
npm install date-fns date-fns-tz
```

### ファイルアップロード
```bash
npm install filepond filepond-plugin-image-preview filepond-plugin-file-validate-type
```

### データフェッチング
```bash
npm install @tanstack/svelte-query
```

### チャート・可視化
```bash
npm install chart.js chartjs-adapter-date-fns
```

### 開発ツール
```bash
npm install -D @types/node
npm install -D vitest @vitest/ui
npm install -D @playwright/test
npm install -D msw
```

---

## Step 3: 設定ファイルの作成

### 3.1 環境変数（.env）
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/salary_management"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth.js (Google OAuth)
AUTH_SECRET="your-secret-key-here"  # openssl rand -hex 32
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# External APIs
ALPHA_VANTAGE_API_KEY="your-api-key"

# Sentry
PUBLIC_SENTRY_DSN="your-sentry-dsn"

# Environment
NODE_ENV="development"
```

### 3.2 Auth.js設定（src/hooks.server.ts）
```typescript
import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "$shared/server/prisma";

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
});
```

### 3.3 Prisma設定（prisma/schema.prisma）
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Auth.js models
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  image         String?
  name          String?
  accounts      Account[]
  sessions      Session[]
  
  // Application models
  salarySlips   SalarySlip[]
  stocks        Stock[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SalarySlip {
  id                String   @id @default(cuid())
  userId            String
  companyName       String
  paymentDate       DateTime
  baseSalary        Decimal  @db.Decimal(10, 2)
  netPay            Decimal  @db.Decimal(10, 2)
  earnings          Json
  deductions        Json
  pdfUrl            String?
  
  user              User     @relation(fields: [userId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId, paymentDate])
}

model Stock {
  id                String   @id @default(cuid())
  userId            String
  symbol            String
  name              String
  quantity          Int
  purchasePrice     Decimal  @db.Decimal(10, 2)
  currentPrice      Decimal? @db.Decimal(10, 2)
  purchaseDate      DateTime
  
  user              User     @relation(fields: [userId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId, symbol])
}
```

### 3.4 TanStack Query設定（src/app.html）
```html
<!DOCTYPE html>
<html lang="ja" class="%sveltekit.theme%">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover" data-theme="skeleton">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

### 3.5 レイアウト設定（src/routes/+layout.svelte）
```svelte
<script lang="ts">
  import '../app.css';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { AppShell, AppBar } from '@skeletonlabs/skeleton';
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5分
        refetchOnWindowFocus: false,
      },
    },
  });
</script>

<QueryClientProvider client={queryClient}>
  <AppShell>
    <svelte:fragment slot="header">
      <AppBar>
        <svelte:fragment slot="lead">
          <strong class="text-xl">給料管理システム</strong>
        </svelte:fragment>
      </AppBar>
    </svelte:fragment>
    
    <slot />
  </AppShell>
</QueryClientProvider>
```

---

## Step 4: データベースセットアップ

```bash
# Dockerでの起動（推奨）
docker-compose up -d

# または個別に起動
# PostgreSQL
docker run -d \
  --name postgres \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=salary_management \
  -p 5432:5432 \
  postgres:15

# Redis
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Prismaマイグレーション
npx prisma migrate dev --name init
npx prisma generate

# シードデータ投入（オプション）
npx prisma db seed
```

---

## Step 5: 開発サーバー起動

```bash
# 開発サーバー起動
npm run dev

# 別ターミナルで型チェック監視
npm run check:watch

# テスト監視
npm run test:unit -- --watch
```

アクセス: http://localhost:5173

---

## Step 6: 機能実装例

### PDFアップロード機能（Tesseract.js使用）
```svelte
<!-- src/routes/salary-slips/upload/+page.svelte -->
<script lang="ts">
  import { FilePond } from 'svelte-filepond';
  import Tesseract from 'tesseract.js';
  import { superForm } from 'sveltekit-superforms/client';
  
  const { form, errors, enhance } = superForm(data.form);
  
  async function handleFileUpload(file: File) {
    // OCR処理（従来300行→20行）
    const result = await Tesseract.recognize(file, 'jpn', {
      logger: m => console.log(m)
    });
    
    // パース結果を自動フォーム入力
    $form = parseSalaryData(result.data.text);
  }
</script>

<FilePond
  allowMultiple={false}
  acceptedFileTypes={['application/pdf']}
  onaddfile={(err, item) => handleFileUpload(item.file)}
/>
```

---

## 開発のヒント

### 効率化のポイント
1. Skeleton UIのコンポーネントを活用 - 自作せずに既存のものを使う
2. Superformsでフォーム実装 - バリデーション・エラー処理が自動化
3. TanStack Queryでデータフェッチング - キャッシュ・同期が自動化
4. SheetJSでエクスポート - 10行でExcel出力可能

### 時間節約の目安
- 認証実装: 3週間 → 1日（Auth.js）
- PDF処理: 2週間 → 2日（Tesseract.js）
- UI開発: 4週間 → 1週間（Skeleton UI）
- フォーム: 3日 → 半日（Superforms）
- エクスポート: 1週間 → 2時間（SheetJS）

---

## トラブルシューティング

### よくある問題と解決法

#### 1. Prismaエラー
```bash
# スキーマをリセット
npx prisma migrate reset
npx prisma generate
```

#### 2. Auth.jsセッションエラー
```bash
# AUTH_SECRETを再生成
openssl rand -hex 32
# .envを更新して再起動
```

#### 3. Tesseract.js言語データ
```bash
# 日本語データは自動ダウンロードされます
# キャッシュクリアが必要な場合
rm -rf node_modules/.cache/tesseract
```

---

## 参考リンク

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Auth.js SvelteKit](https://authjs.dev/reference/sveltekit)
- [Skeleton UI](https://www.skeleton.dev/)
- [Superforms](https://superforms.rocks/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tesseract.js](https://tesseract.projectnaptha.com/)

---

## 完成

これで開発環境のセットアップは完了です。
6週間で本番稼働可能なシステムを構築します。

質問や問題がある場合は、プロジェクトのissueまたはSlackでお問い合わせください。
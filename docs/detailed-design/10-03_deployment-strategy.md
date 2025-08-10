# デプロイ戦略・運用計画・移行手順

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: DevOps・運用計画スペシャリスト  
- **バージョン**: 1.0.0
- **ステータス**: 実装準備完了
- **前提条件**: 技術設計概要書・実装計画書の完了

---

## 1. デプロイ戦略概要

### 1.1 デプロイメントモデル

本給料管理システムは **Blue-Green デプロイメント** と **段階的ロールアウト** を組み合わせた、安全で確実なデプロイ戦略を採用します。

```mermaid
graph TB
    subgraph "デプロイメントフロー"
        A[開発環境] --> B[ステージング環境]
        B --> C[本番環境 Blue]
        C --> D[本番環境 Green]
        
        E[ゼロダウンタイム切り替え] --> F[段階的ロードバランシング]
        F --> G[完全切り替え]
        
        H[ロールバック準備] --> I[自動ヘルスチェック]
        I --> J[異常検知時自動復旧]
    end
    
    subgraph "品質ゲート"
        K[単体テスト] --> L[統合テスト]
        L --> M[E2Eテスト]
        M --> N[セキュリティテスト]
        N --> O[パフォーマンステスト]
        O --> P[デプロイ承認]
    end
```

### 1.2 環境戦略

| 環境 | 目的 | インフラ | データ | アクセス |
|------|------|----------|--------|----------|
| **Development** | 開発・デバッグ | ローカル Docker | 開発用ダミーデータ | 開発者のみ |
| **Staging** | 統合テスト・QA | Vercel Preview | 本番同等の匿名データ | QA・開発チーム |
| **Production** | 本番サービス | Vercel Pro + Neon | 実運用データ | エンドユーザー |

### 1.3 デプロイ頻度戦略

```typescript
interface DeploymentStrategy {
  development: {
    frequency: "コミット毎";
    automation: "完全自動";
    rollback: "即座";
  };
  
  staging: {
    frequency: "プルリクエスト毎";
    automation: "自動 + 承認";
    rollback: "5分以内";
  };
  
  production: {
    frequency: "週1-2回";
    automation: "承認後自動";
    rollback: "15分以内";
  };
}
```

---

## 2. インフラストラクチャ設計

### 2.1 クラウドアーキテクチャ

```mermaid
graph TB
    subgraph "Vercel Platform"
        subgraph "Edge Network"
            CDN[Vercel Edge CDN<br/>静的アセット配信]
        end
        
        subgraph "Compute"
            FUNC[Serverless Functions<br/>API Routes + SSR]
        end
        
        subgraph "Features"
            EDGE[Edge Functions<br/>認証・ログ処理]
            PREV[Preview Deployments<br/>ブランチ毎環境]
        end
    end
    
    subgraph "Database Layer"
        NEON[(Neon PostgreSQL<br/>Primary Database)]
        REDIS[(Upstash Redis<br/>Cache + Sessions)]
    end
    
    subgraph "External Services"
        SENTRY[Sentry<br/>エラー追跡]
        LOGFLARE[Logflare<br/>ログ管理]
        STOCK[Stock APIs<br/>価格データ]
    end
    
    CDN --> FUNC
    FUNC --> EDGE
    FUNC --> NEON
    FUNC --> REDIS
    FUNC --> SENTRY
    FUNC --> LOGFLARE
    FUNC --> STOCK
```

### 2.2 技術選定根拠

#### Vercel 選定理由

```typescript
interface VercelAdvantages {
  performance: [
    "グローバルCDNによる高速配信",
    "Edge Functions によるレスポンス最適化",
    "自動画像最適化・圧縮"
  ];
  
  developer_experience: [
    "SvelteKit との完璧な統合",
    "ゼロ設定デプロイメント",
    "Preview Deployments による安全なテスト"
  ];
  
  scalability: [
    "オートスケーリング",
    "トラフィック急増への自動対応",
    "99.99% SLA保証"
  ];
  
  cost_efficiency: [
    "使用量ベース課金",
    "小規模時のコスト最適化",
    "無料枠での開発・テスト"
  ];
}
```

#### Neon PostgreSQL 選定理由

```typescript
interface NeonAdvantages {
  performance: [
    "分離コンピュート・ストレージ",
    "オートスケーリング",
    "Read Replica 自動作成"
  ];
  
  reliability: [
    "99.95% 稼働率保証",
    "自動バックアップ・復旧",
    "Point-in-time Recovery"
  ];
  
  developer_experience: [
    "ブランチ毎データベース",
    "SQL エディタ内蔵",
    "Prisma 完全対応"
  ];
  
  security: [
    "暗号化データ保存",
    "VPC 対応",
    "IP 制限・認証強化"
  ];
}
```

### 2.3 環境別構成詳細

#### 開発環境 (Local)
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/salary_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: salary_dev
      POSTGRES_USER: postgres  
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### ステージング環境 (Vercel Preview)
```json
{
  "name": "salary-management-staging",
  "version": 2,
  "env": {
    "NODE_ENV": "staging",
    "DATABASE_URL": "@database-url-staging",
    "REDIS_URL": "@redis-url-staging",
    "GOOGLE_CLIENT_ID": "@google-client-id-staging",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret-staging"
  },
  "build": {
    "env": {
      "NODE_ENV": "staging"
    }
  },
  "functions": {
    "src/routes/api/**": {
      "memory": 512
    }
  }
}
```

#### 本番環境 (Vercel Production)
```json
{
  "name": "salary-management",
  "version": 2,
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url-production",
    "REDIS_URL": "@redis-url-production",
    "GOOGLE_CLIENT_ID": "@google-client-id-production",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret-production",
    "SENTRY_DSN": "@sentry-dsn",
    "STOCK_API_KEY": "@stock-api-key"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "src/routes/api/**": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "regions": ["nrt1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 3. CI/CDパイプライン詳細設計

### 3.1 GitHub Actions ワークフロー

```yaml
# .github/workflows/main.yml
name: Salary Management CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ===== 品質チェック段階 =====
  quality-check:
    name: 品質チェック
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
          
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Environment setup
        run: |
          cp .env.example .env.test
          echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db" >> .env.test
          echo "REDIS_URL=redis://localhost:6379" >> .env.test

      - name: Database migration
        run: |
          npx prisma migrate deploy
          npx prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Type check
        run: npm run type-check

      - name: Lint check
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Build application
        run: npm run build

      - name: Unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # ===== セキュリティスキャン =====
  security-scan:
    name: セキュリティスキャン
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript

  # ===== E2Eテスト =====
  e2e-test:
    name: E2Eテスト
    runs-on: ubuntu-latest
    needs: [quality-check]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:4173

      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-artifacts
          path: |
            test-results/
            playwright-report/

  # ===== デプロイ: ステージング =====
  deploy-staging:
    name: ステージング デプロイ
    runs-on: ubuntu-latest
    needs: [quality-check, security-scan, e2e-test]
    if: github.ref == 'refs/heads/develop'
    
    environment:
      name: staging
      url: https://salary-management-staging.vercel.app
      
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env NODE_ENV=staging'
          scope: staging

      - name: Staging smoke tests
        run: |
          sleep 30  # デプロイ完了待機
          npm run test:smoke -- --base-url=${{ steps.deploy.outputs.preview-url }}

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'ステージング環境にデプロイ完了'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # ===== デプロイ: 本番 =====
  deploy-production:
    name: 本番 デプロイ
    runs-on: ubuntu-latest
    needs: [quality-check, security-scan, e2e-test]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://salary-management.vercel.app
      
    steps:
      - uses: actions/checkout@v4

      - name: Pre-deployment backup
        run: |
          echo "データベースバックアップ実行"
          # Neonでの自動バックアップ確認または手動バックアップ

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25  
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: production

      - name: Production smoke tests
        run: |
          sleep 60  # デプロイ完了・ヘルスチェック待機
          npm run test:smoke -- --base-url=https://salary-management.vercel.app

      - name: Health check monitoring
        run: |
          for i in {1..5}; do
            curl -f https://salary-management.vercel.app/api/health || exit 1
            sleep 30
          done

      - name: Notify successful deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '本番環境にデプロイ完了。全てのヘルスチェックに成功しました。'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

      - name: Notify failed deployment
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: '本番環境デプロイに失敗。緊急対応が必要です。'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # ===== 自動ロールバック =====
  auto-rollback:
    name: 自動ロールバック
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: failure()
    
    steps:
      - name: Rollback deployment
        run: |
          echo "自動ロールバック実行中..."
          # Vercel CLIでの前回バージョンへのロールバック
          npx vercel rollback --token=${{ secrets.VERCEL_TOKEN }}
          
      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: warning
          text: '⚠️ 本番環境を前回バージョンにロールバックしました。'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3.2 デプロイメント承認プロセス

```mermaid
graph LR
    A[プルリクエスト] --> B{コードレビュー}
    B -->|承認| C[自動テスト実行]
    B -->|修正要求| A
    
    C --> D{品質ゲート}
    D -->|Pass| E[ステージングデプロイ]
    D -->|Fail| A
    
    E --> F{QAテスト}
    F -->|承認| G[本番デプロイ申請]
    F -->|修正要求| A
    
    G --> H{承認者レビュー}
    H -->|承認| I[本番デプロイ実行]
    H -->|却下| A
    
    I --> J[ポストデプロイ監視]
```

---

## 4. 監視・ログ・アラート戦略

### 4.1 包括的監視システム

```mermaid
graph TB
    subgraph "Application Monitoring"
        APM[Sentry<br/>エラー・パフォーマンス監視]
        LOGS[Logflare<br/>構造化ログ管理]
        METRICS[Vercel Analytics<br/>Webパフォーマンス]
    end
    
    subgraph "Infrastructure Monitoring"
        VERCEL[Vercel Dashboard<br/>Function監視]
        NEON[Neon Console<br/>DB監視]
        UPSTASH[Upstash Dashboard<br/>Redis監視]
    end
    
    subgraph "Business Monitoring"
        CUSTOM[Custom Dashboards<br/>ビジネスメトリクス]
        HEALTH[Health Checks<br/>サービス状態]
    end
    
    subgraph "Alerting"
        SLACK[Slack通知]
        EMAIL[メール通知]
        SMS[SMS緊急通知]
    end
    
    APM --> SLACK
    LOGS --> EMAIL
    HEALTH --> SMS
```

### 4.2 ログ設定詳細

#### 構造化ログ実装
```typescript
// src/lib/server/logging/logger.ts
import { Logger } from 'pino';
import { createWriteStream } from 'pino-logflare';

interface LogContext {
  requestId: string;
  userId?: string;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private logger: Logger;

  constructor() {
    const stream = createWriteStream({
      apikey: process.env.LOGFLARE_API_KEY!,
      sourceToken: process.env.LOGFLARE_SOURCE_TOKEN!,
    });

    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          timestamp: new Date().toISOString(),
          service: 'salary-management',
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version,
          ...object
        })
      }
    }, stream);
  }

  info(message: string, context: LogContext): void {
    this.logger.info({
      message,
      requestId: context.requestId,
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      metadata: this.sanitizeMetadata(context.metadata)
    });
  }

  error(message: string, error: Error, context: LogContext): void {
    this.logger.error({
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      requestId: context.requestId,
      userId: context.userId,
      action: context.action,
      metadata: this.sanitizeMetadata(context.metadata)
    });
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> {
    if (!metadata) return {};

    // PII データをマスク
    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'email', 'ssn', 'creditCard'];
    
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

export const logger = new StructuredLogger();
```

#### ログミドルウェア実装
```typescript
// src/hooks.server.ts
import { logger } from '$lib/server/logging/logger';
import { v4 as uuidv4 } from 'uuid';

export const handle = async ({ event, resolve }) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  // リクエスト情報をローカルに保存
  event.locals.requestId = requestId;
  event.locals.startTime = startTime;

  // リクエストログ
  logger.info('Request started', {
    requestId,
    action: 'request_start',
    resource: event.url.pathname,
    metadata: {
      method: event.request.method,
      userAgent: event.request.headers.get('user-agent'),
      ip: event.getClientAddress()
    }
  });

  const response = await resolve(event);
  const duration = Date.now() - startTime;

  // レスポンスログ
  logger.info('Request completed', {
    requestId,
    action: 'request_complete',
    resource: event.url.pathname,
    metadata: {
      statusCode: response.status,
      duration,
      method: event.request.method
    }
  });

  return response;
};
```

### 4.3 アラート設定

#### Sentry エラー監視設定
```typescript
// src/app.html - Sentry初期化
<script>
  import * as Sentry from "@sentry/sveltekit";
  
  Sentry.init({
    dsn: "%SENTRY_DSN%",
    environment: "%NODE_ENV%",
    
    // エラー取得設定
    beforeSend: (event) => {
      // PII情報を除外
      if (event.user) {
        delete event.user.email;
      }
      return event;
    },
    
    // パフォーマンス監視
    tracesSampleRate: 0.1,
    
    // セッション情報
    autoSessionTracking: true,
    
    // リリース管理
    release: "%npm_package_version%"
  });
</script>
```

#### カスタムアラート実装
```typescript
// src/lib/server/monitoring/alerts.ts
interface AlertConfig {
  name: string;
  condition: (metrics: Metrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('slack' | 'email' | 'sms')[];
  cooldown: number; // minutes
}

const alertConfigs: AlertConfig[] = [
  {
    name: 'High Error Rate',
    condition: (metrics) => metrics.errorRate > 0.05, // 5%超過
    severity: 'high',
    channels: ['slack', 'email'],
    cooldown: 15
  },
  {
    name: 'Slow Response Time',
    condition: (metrics) => metrics.avgResponseTime > 2000, // 2秒超過
    severity: 'medium', 
    channels: ['slack'],
    cooldown: 30
  },
  {
    name: 'Database Connection Issues',
    condition: (metrics) => metrics.dbConnectionErrors > 0,
    severity: 'critical',
    channels: ['slack', 'email', 'sms'],
    cooldown: 5
  }
];

export class AlertManager {
  private lastAlertTime: Map<string, Date> = new Map();

  async checkAlerts(metrics: Metrics): Promise<void> {
    for (const config of alertConfigs) {
      if (this.shouldSkipAlert(config)) continue;

      if (config.condition(metrics)) {
        await this.triggerAlert(config, metrics);
        this.lastAlertTime.set(config.name, new Date());
      }
    }
  }

  private shouldSkipAlert(config: AlertConfig): boolean {
    const lastAlert = this.lastAlertTime.get(config.name);
    if (!lastAlert) return false;

    const cooldownMs = config.cooldown * 60 * 1000;
    return Date.now() - lastAlert.getTime() < cooldownMs;
  }

  private async triggerAlert(config: AlertConfig, metrics: Metrics): Promise<void> {
    const message = this.formatAlertMessage(config, metrics);

    for (const channel of config.channels) {
      switch (channel) {
        case 'slack':
          await this.sendSlackAlert(message, config.severity);
          break;
        case 'email':
          await this.sendEmailAlert(message, config.severity);
          break;
        case 'sms':
          await this.sendSMSAlert(message);
          break;
      }
    }
  }
}
```

---

## 5. セキュリティ・コンプライアンス戦略

### 5.1 多層セキュリティ実装

```mermaid
graph TB
    subgraph "Network Security"
        HTTPS[HTTPS/TLS 1.3<br/>強制暗号化]
        WAF[Web Application Firewall<br/>攻撃防御]
        DDoS[DDoS Protection<br/>トラフィック制御]
    end
    
    subgraph "Application Security"
        AUTH[OAuth 2.0<br/>認証・認可]
        JWT[JWT Token<br/>セッション管理]
        CSRF[CSRF Protection<br/>クロスサイト攻撃防御]
        XSS[XSS Protection<br/>スクリプト注入防御]
    end
    
    subgraph "Data Security"
        ENCRYPT[データ暗号化<br/>保存・転送時]
        BACKUP[暗号化バックアップ<br/>災害復旧]
        AUDIT[監査ログ<br/>アクセス追跡]
    end
    
    subgraph "Infrastructure Security"
        VPC[Virtual Private Cloud<br/>ネットワーク隔離]
        IAM[Identity Access Management<br/>権限管理]
        SECRETS[シークレット管理<br/>環境変数暗号化]
    end
```

#### セキュリティヘッダー実装
```typescript
// src/hooks.server.ts - セキュリティミドルウェア
export const handle = sequence(
  // セキュリティヘッダー設定
  ({ event, resolve }) => {
    return resolve(event, {
      transformPageChunk: ({ html }) => {
        return html.replace(
          '<head>',
          `<head>
            <meta http-equiv="Content-Security-Policy" content="
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://vercel.live;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https:;
              connect-src 'self' https://api.vercel.com;
              font-src 'self';
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            ">
            <meta http-equiv="X-Content-Type-Options" content="nosniff">
            <meta http-equiv="X-Frame-Options" content="DENY">
            <meta http-equiv="X-XSS-Protection" content="1; mode=block">
            <meta http-equiv="Strict-Transport-Security" 
                  content="max-age=31536000; includeSubDomains; preload">
          `
        );
      }
    });
  },

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    standardHeaders: true
  }),

  // 認証処理
  SvelteKitAuth(authConfig)
);
```

### 5.2 データ保護・プライバシー対応

#### GDPR/個人情報保護対応
```typescript
// src/lib/server/privacy/data-protection.ts
export class DataProtectionService {
  async anonymizeUserData(userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // ユーザーデータの匿名化
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `anonymous_${userId}@deleted.com`,
          name: 'Deleted User',
          googleId: null,
          avatarUrl: null
        }
      });

      // 給料明細データの匿名化
      await tx.salarySlip.updateMany({
        where: { userId },
        data: {
          companyName: 'Anonymous Company',
          employeeName: 'Anonymous Employee'
        }
      });
    });
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, salarySlips, portfolios] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.salarySlip.findMany({ where: { userId } }),
      this.prisma.stockPortfolio.findMany({ where: { userId } })
    ]);

    return {
      user: this.sanitizeExportData(user),
      salarySlips: salarySlips.map(this.sanitizeExportData),
      portfolios: portfolios.map(this.sanitizeExportData),
      exportedAt: new Date().toISOString()
    };
  }

  private sanitizeExportData(data: any): any {
    // 内部IDや機密情報を除外
    const { id, createdAt, updatedAt, ...sanitized } = data;
    return sanitized;
  }
}
```

### 5.3 脆弱性管理・セキュリティテスト

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * 1' # 毎週月曜日 2:00AM
  push:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level moderate
        
      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  code-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: typescript

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t app .
        
      - name: Container Security Scan
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image --severity HIGH,CRITICAL app

  penetration-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: OWASP ZAP Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: https://salary-management-staging.vercel.app
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

---

## 6. 障害対応・復旧計画

### 6.1 インシデント対応プロセス

```mermaid
graph TB
    A[障害検知] --> B{重要度判定}
    
    B -->|Critical| C[緊急対応チーム召集]
    B -->|High| D[プライマリ担当者対応]
    B -->|Medium/Low| E[通常対応]
    
    C --> F[即座にステータスページ更新]
    F --> G[ロールバック判断]
    G --> H[根本原因調査]
    
    D --> I[問題切り分け]
    I --> J[修正実装]
    J --> K[テスト・検証]
    K --> L[修正デプロイ]
    
    E --> M[バックログに追加]
    M --> N[計画的対応]
    
    H --> O[事後分析]
    L --> O
    N --> O
    O --> P[改善策実装]
```

### 6.2 障害レベル定義

| レベル | 定義 | 対応時間 | エスカレーション |
|--------|------|----------|------------------|
| **Critical** | サービス全停止、データ損失 | 15分以内 | 即座にCTO・経営陣 |
| **High** | 主要機能停止、セキュリティ事象 | 2時間以内 | 1時間後にCTO |
| **Medium** | 一部機能低下、パフォーマンス問題 | 1営業日以内 | 8時間後にTechLead |
| **Low** | 軽微な不具合、改善要望 | 1週間以内 | エスカレーション不要 |

### 6.3 災害復旧計画 (DR Plan)

#### データバックアップ戦略
```typescript
// バックアップ設定（Neon自動バックアップ + 手動バックアップ）
interface BackupStrategy {
  automated: {
    frequency: "1時間毎のポイントインタイム復旧";
    retention: "30日間";
    testing: "週1回の復旧テスト";
  };
  
  manual: {
    frequency: "デプロイ前の手動バックアップ";
    retention: "90日間";
    encryption: "AES-256で暗号化";
  };
  
  disaster: {
    rto: "目標復旧時間: 4時間";
    rpo: "目標復旧ポイント: 1時間";
    offsite: "異なるリージョンでのバックアップ";
  };
}
```

#### 復旧手順書
```bash
#!/bin/bash
# 緊急復旧スクリプト

echo "=== 緊急復旧プロセス開始 ==="

# 1. 現在の状況確認
echo "1. システム状況確認中..."
curl -f https://salary-management.vercel.app/api/health || echo "サービス停止確認"

# 2. Vercel デプロイメント履歴確認
echo "2. 最新デプロイメント確認中..."
vercel ls --token=$VERCEL_TOKEN

# 3. データベース接続確認
echo "3. データベース接続確認中..."
npx prisma db pull || echo "データベース接続失敗"

# 4. ロールバック実行
echo "4. 前バージョンへのロールバック実行中..."
vercel rollback --token=$VERCEL_TOKEN

# 5. サービス復旧確認
echo "5. サービス復旧確認中..."
sleep 30
for i in {1..10}; do
    if curl -f https://salary-management.vercel.app/api/health; then
        echo "サービス復旧完了"
        break
    fi
    echo "復旧待機中... ($i/10)"
    sleep 30
done

# 6. 関係者通知
echo "6. 関係者への通知送信中..."
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  --data '{"text":"🟢 サービス復旧完了: 給料管理システムが正常に動作しています"}'

echo "=== 緊急復旧プロセス完了 ==="
```

---

## 7. パフォーマンス最適化・スケーリング戦略

### 7.1 パフォーマンス監視指標

```typescript
interface PerformanceTargets {
  frontend: {
    firstContentfulPaint: "< 1.5秒";
    largestContentfulPaint: "< 2.5秒";  
    cumulativeLayoutShift: "< 0.1";
    firstInputDelay: "< 100ms";
  };
  
  backend: {
    apiResponseTime: "< 500ms (p95)";
    databaseQueryTime: "< 100ms (p95)";
    cacheHitRate: "> 80%";
    errorRate: "< 0.1%";
  };
  
  infrastructure: {
    uptime: "> 99.5%";
    deploymentTime: "< 5分";
    rollbackTime: "< 2分";
  };
}
```

### 7.2 自動スケーリング設定

#### Vercel Function設定
```json
{
  "functions": {
    "src/routes/api/salary-slips/**": {
      "memory": 1024,
      "maxDuration": 30,
      "concurrency": 100
    },
    "src/routes/api/portfolio/**": {
      "memory": 512,
      "maxDuration": 15,
      "concurrency": 50
    },
    "src/routes/api/dashboard/**": {
      "memory": 2048,
      "maxDuration": 45,
      "concurrency": 20
    }
  },
  "crons": [
    {
      "path": "/api/cron/update-stock-prices",
      "schedule": "0 9,15 * * 1-5"
    },
    {
      "path": "/api/cron/generate-reports", 
      "schedule": "0 1 * * *"
    }
  ]
}
```

### 7.3 キャッシュ最適化戦略

```typescript
// src/lib/server/cache/cache-manager.ts
export class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // L1: メモリキャッシュ (Node.js内)
  private memoryCache = new Map<string, { data: any; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    // L1キャッシュチェック
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expires > Date.now()) {
      return memCached.data;
    }

    // L2キャッシュチェック (Redis)
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      const data = JSON.parse(redisCached);
      
      // L1キャッシュに昇格
      this.memoryCache.set(key, {
        data,
        expires: Date.now() + 300000 // 5分
      });
      
      return data;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    // L1キャッシュ
    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + Math.min(ttlSeconds * 1000, 300000)
    });

    // L2キャッシュ (Redis)
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    // L1キャッシュクリア
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // L2キャッシュクリア
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 8. 運用・保守計画

### 8.1 日常運用タスク

```mermaid
gantt
    title 運用スケジュール
    dateFormat YYYY-MM-DD
    section 日次タスク
        ヘルスチェック確認    :daily1, 2025-01-15, 1d
        エラーログ確認       :daily2, 2025-01-15, 1d  
        パフォーマンス監視    :daily3, 2025-01-15, 1d
        
    section 週次タスク
        依存関係更新         :weekly1, 2025-01-15, 7d
        セキュリティスキャン  :weekly2, 2025-01-15, 7d
        バックアップ確認      :weekly3, 2025-01-15, 7d
        
    section 月次タスク
        パフォーマンスレポート :monthly1, 2025-01-15, 30d
        コスト分析           :monthly2, 2025-01-15, 30d
        容量計画             :monthly3, 2025-01-15, 30d
```

### 8.2 定期メンテナンス計画

#### 依存関係更新戦略
```json
{
  "scripts": {
    "deps:check": "npm outdated",
    "deps:update:patch": "npm update",
    "deps:update:minor": "npx npm-check-updates -u -t minor",
    "deps:update:major": "npx npm-check-updates -u -t major"
  },
  "renovate": {
    "schedule": ["before 4am on monday"],
    "packageRules": [
      {
        "depType": ["dependencies"],
        "updateTypes": ["patch", "pin", "digest"],
        "automerge": true
      },
      {
        "depType": ["devDependencies"],
        "updateTypes": ["minor"],
        "schedule": ["before 4am on first day of month"]
      }
    ]
  }
}
```

### 8.3 コスト最適化

#### リソース使用量監視
```typescript
// src/lib/server/monitoring/cost-monitor.ts
export class CostMonitor {
  async generateCostReport(): Promise<CostReport> {
    const [vercelUsage, neonUsage, upstashUsage] = await Promise.all([
      this.getVercelUsage(),
      this.getNeonUsage(), 
      this.getUpstashUsage()
    ]);

    return {
      total: vercelUsage.cost + neonUsage.cost + upstashUsage.cost,
      breakdown: {
        vercel: vercelUsage,
        neon: neonUsage,
        upstash: upstashUsage
      },
      projectedMonthly: this.calculateMonthlyProjection(),
      recommendations: this.generateOptimizationRecommendations()
    };
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.cacheHitRate < 0.8) {
      recommendations.push("キャッシュ戦略を改善してDB接続数を削減");
    }
    
    if (this.functionColdStarts > 0.1) {
      recommendations.push("Function warming を検討");
    }
    
    return recommendations;
  }
}
```

---

## 9. 移行・カットオーバー戦略

### 9.1 本番環境移行計画

```mermaid
timeline
    title 本番移行タイムライン
    
    Phase 1 (Week 1) : 環境準備
                     : Vercel Pro設定
                     : Neon Production DB
                     : Upstash Redis設定
                     : DNS・SSL証明書
                     
    Phase 2 (Week 2) : データ移行テスト
                     : スキーマ同期
                     : シードデータ投入
                     : 接続テスト
                     
    Phase 3 (Week 3) : 統合テスト
                     : E2Eテスト実行
                     : パフォーマンステスト
                     : セキュリティテスト
                     
    Phase 4 (Week 4) : 本番カットオーバー
                     : DNS切り替え
                     : 監視設定
                     : 24時間監視開始
```

### 9.2 カットオーバー手順書

```bash
#!/bin/bash
# 本番カットオーバー手順書

echo "=== 本番環境カットオーバー開始 ==="

# 事前準備チェックリスト
echo "1. 事前準備確認..."
echo "  □ 全テスト完了"
echo "  □ バックアップ完了" 
echo "  □ ロールバック計画確認"
echo "  □ 緊急連絡先確認"
read -p "全ての準備が完了していますか? (y/n): " confirm
if [ "$confirm" != "y" ]; then exit 1; fi

# ステップ1: メンテナンスモード開始
echo "2. メンテナンスモード開始..."
# ステージング環境にメンテナンスページ表示

# ステップ2: 最終データバックアップ
echo "3. 最終データバックアップ実行..."
npx prisma db push --force-reset
# Neonでの自動バックアップ確認

# ステップ3: 本番環境デプロイ
echo "4. 本番環境デプロイ実行..."
vercel --prod --token=$VERCEL_TOKEN

# ステップ4: データベース移行
echo "5. データベーススキーマ移行..."
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy

# ステップ5: 外部サービス接続確認
echo "6. 外部サービス接続テスト..."
curl -f "$PRODUCTION_URL/api/health"
curl -f "$PRODUCTION_URL/api/stocks/test"

# ステップ6: 統合テスト実行
echo "7. 本番環境統合テスト..."
npm run test:integration -- --base-url=$PRODUCTION_URL

# ステップ7: DNS切り替え（段階的）
echo "8. DNS切り替え開始..."
# 10%のトラフィックを新環境に
# 30分間監視
# 問題なければ50%に増加
# さらに30分間監視
# 問題なければ100%に切り替え

# ステップ8: 監視開始
echo "9. 本番監視開始..."
echo "  - Sentry監視アクティブ"
echo "  - Logflare監視アクティブ" 
echo "  - ヘルスチェック監視アクティブ"

# ステップ9: 関係者通知
echo "10. カットオーバー完了通知..."
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-type: application/json' \
  --data '{"text":"本番環境カットオーバー完了。給料管理システムが本番稼働開始しました。"}'

echo "=== 本番環境カットオーバー完了 ==="
echo "24時間監視を継続してください"
```

### 9.3 ロールバック計画

```typescript
interface RollbackStrategy {
  triggers: [
    "エラー率 > 5%が10分継続",
    "レスポンス時間 > 5秒が継続",
    "データベース接続失敗",
    "重大なセキュリティ問題発見"
  ];
  
  automatic: {
    healthCheckFailures: 3;
    timeWindow: "5分";
    action: "前バージョンへの自動ロールバック";
  };
  
  manual: {
    decisionTime: "15分以内";
    executionTime: "5分以内";
    approver: "Tech Lead以上";
  };
  
  procedure: [
    "1. 緊急事態宣言",
    "2. トラフィック停止",
    "3. 前バージョンデプロイ",
    "4. データ整合性確認",
    "5. サービス再開",
    "6. 事後分析実施"
  ];
}
```

---

## 10. まとめ・運用開始準備

### 10.1 Go-Live チェックリスト

```typescript
interface GoLiveReadiness {
  technical: [
    "[ ] 本番環境構築完了",
    "[ ] SSL証明書設定済み",
    "[ ] DNS設定完了",
    "[ ] データベース移行完了",
    "[ ] 監視・アラート設定済み",
    "[ ] バックアップ設定済み",
    "[ ] セキュリティ設定完了",
    "[ ] パフォーマンステスト合格"
  ];
  
  operational: [
    "[ ] 運用手順書完成",
    "[ ] 障害対応手順確立",
    "[ ] エスカレーション体制構築",
    "[ ] 24時間監視体制確立",
    "[ ] SLA定義・合意",
    "[ ] コスト監視設定"
  ];
  
  business: [
    "[ ] ユーザー受け入れテスト完了",
    "[ ] 法的要件確認済み",
    "[ ] プライバシーポリシー更新",
    "[ ] 利用規約確定",
    "[ ] サポート体制構築",
    "[ ] ユーザードキュメント完成"
  ];
}
```

### 10.2 成功メトリクス定義

```typescript
interface SuccessMetrics {
  // 技術メトリクス
  technical: {
    uptime: "> 99.5%";
    responseTime: "< 500ms (p95)";
    errorRate: "< 0.1%";
    deploymentFrequency: "> 2回/週";
    leadTime: "< 2日";
    mttr: "< 30分";
  };
  
  // ビジネスメトリクス
  business: {
    userActivation: "> 80% (初回PDF処理成功)";
    userRetention: "> 60% (月次アクティブ)";
    featureAdoption: "> 70% (主要機能利用率)";
    userSatisfaction: "> 4.0/5.0";
  };
  
  // 運用メトリクス
  operational: {
    incidentCount: "< 2件/月 (P1-P2)";
    planedDowntime: "< 4時間/年";
    securityIncidents: "0件";
    complianceScore: "100%";
  };
}
```

### 10.3 継続改善計画

```mermaid
flowchart LR
    A[メトリクス収集] --> B[分析・評価]
    B --> C[改善機会特定]
    C --> D[優先度決定]
    D --> E[改善実装]
    E --> F[効果測定]
    F --> A
    
    G[ユーザーフィードバック] --> B
    H[技術トレンド調査] --> C
    I[競合分析] --> C
```

**この包括的なデプロイ戦略・運用計画により、給料管理システムは安全で確実な本番運用を実現できます。段階的なアプローチと包括的な監視により、高い可用性と優れたユーザー体験を提供し続けることが可能です。**

---

## 付録: 緊急連絡先・参考資料

### 緊急連絡先
- **Tech Lead**: [連絡先]
- **DevOps Engineer**: [連絡先]  
- **Security Officer**: [連絡先]
- **24時間サポート**: [連絡先]

### 重要なリンク
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Neon Console**: https://console.neon.tech
- **Sentry**: https://sentry.io/organizations/salary-management
- **GitHub Repository**: https://github.com/organization/salary-management
- **Status Page**: https://status.salary-management.app
- **Monitoring Dashboard**: https://monitoring.salary-management.app

### 関連ドキュメント
- [技術設計総合概要書](./00-01_technical-design-overview.md)
- [実装計画書](./00-02_implementation-plan.md)
- [API仕様書](./11-01_api-specification.md)
- [データベース設計書](./13-01_database-schema.md)
- [エラーハンドリング戦略](./15-01_error-handling-strategy.md)
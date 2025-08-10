# エラー監視・アラート・運用対応手順書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: エキスパートエラーハンドリング設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **前提条件**: error-handling-strategy、error-classificationの完了

---

## 1. 監視アーキテクチャ概要

### 1.1 監視システム構成

```
監視アーキテクチャ階層
┌─────────────────────────────────────────────────────────────────────────┐
│                        プレゼンテーション層                                │
│  Grafana Dashboard │ Sentry Dashboard │ PagerDuty │ Slack Notifications │
├─────────────────────────────────────────────────────────────────────────┤
│                           集約・分析層                                    │
│    Prometheus    │    Loki Logs     │  Jaeger Traces │  Custom Analytics │
├─────────────────────────────────────────────────────────────────────────┤
│                         データ収集層                                      │
│  Application     │   Infrastructure │    External    │   User Actions    │
│  Metrics         │   Monitoring     │   API Metrics  │   Monitoring      │
├─────────────────────────────────────────────────────────────────────────┤
│                          ソース層                                        │
│ SvelteKit App │ PostgreSQL │ Redis │ External APIs │ Vercel Platform │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 監視対象とメトリクス

| 監視カテゴリ | 主要メトリクス | 収集頻度 | アラート閾値 |
|-------------|---------------|----------|------------|
| **アプリケーションエラー** | エラー発生率、エラー種別、ユーザー影響数 | リアルタイム | >5%増加 |
| **パフォーマンス** | レスポンス時間、スループット、可用性 | 30秒 | >2s応答時間 |
| **インフラ** | CPU、メモリ、ディスク、ネットワーク | 60秒 | CPU>80% |
| **外部API** | API応答時間、成功率、レート制限 | 30秒 | 失敗率>10% |
| **ビジネスメトリクス** | PDF処理成功率、取引登録数、ユーザー活動 | 5分 | 前日比-20% |

---

## 2. エラー監視実装

### 2.1 アプリケーションレベル監視

```typescript
// src/shared/utils/monitoring/error-monitor.service.ts

/**
 * エラー監視サービス
 */
export class ErrorMonitoringService {
  private metricsRegistry: MetricsRegistry;
  private alertManager: AlertManager;
  private sentryClient: SentryClient;
  
  constructor(
    private readonly config: MonitoringConfig,
    private readonly logger: Logger
  ) {
    this.metricsRegistry = new MetricsRegistry();
    this.alertManager = new AlertManager(config.alerting);
    this.sentryClient = new SentryClient(config.sentry);
    
    this.initializeMetrics();
    this.setupEventListeners();
  }

  /**
   * エラーイベント処理
   */
  public async recordError(
    error: BaseError, 
    context: ErrorContext
  ): Promise<void> {
    
    // メトリクス更新
    await this.updateMetrics(error, context);
    
    // Sentry報告
    await this.reportToSentry(error, context);
    
    // アラート判定
    await this.evaluateAlerts(error, context);
    
    // カスタムログ出力
    await this.logError(error, context);
    
    // ビジネスメトリクス更新
    await this.updateBusinessMetrics(error, context);
  }

  /**
   * メトリクス初期化
   */
  private initializeMetrics(): void {
    
    // エラー発生率メトリクス
    this.metricsRegistry.createCounter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['severity', 'category', 'code', 'user_id']
    });
    
    // エラー解決時間メトリクス
    this.metricsRegistry.createHistogram({
      name: 'error_resolution_duration_seconds',
      help: 'Time to resolve errors',
      labelNames: ['severity', 'resolution_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600]
    });
    
    // ユーザー影響メトリクス
    this.metricsRegistry.createGauge({
      name: 'error_affected_users',
      help: 'Number of users affected by errors',
      labelNames: ['time_window']
    });
    
    // アプリケーション可用性
    this.metricsRegistry.createGauge({
      name: 'application_availability_percent',
      help: 'Application availability percentage'
    });
    
    // 外部API健全性
    this.metricsRegistry.createGauge({
      name: 'external_api_health',
      help: 'External API health status',
      labelNames: ['api_name', 'endpoint']
    });
    
    // ビジネスプロセス成功率
    this.metricsRegistry.createGauge({
      name: 'business_process_success_rate',
      help: 'Business process success rate',
      labelNames: ['process_name']
    });
  }

  /**
   * メトリクス更新
   */
  private async updateMetrics(
    error: BaseError, 
    context: ErrorContext
  ): Promise<void> {
    
    // エラーカウンター更新
    this.metricsRegistry
      .getCounter('errors_total')
      ?.inc({
        severity: error.severity,
        category: error.category,
        code: error.code,
        user_id: context.userId || 'anonymous'
      });
    
    // 影響ユーザー数更新
    const affectedUsers = await this.calculateAffectedUsers('1h');
    this.metricsRegistry
      .getGauge('error_affected_users')
      ?.set({ time_window: '1h' }, affectedUsers);
    
    // 可用性計算・更新
    const availability = await this.calculateAvailability();
    this.metricsRegistry
      .getGauge('application_availability_percent')
      ?.set(availability);
  }

  /**
   * Sentry報告
   */
  private async reportToSentry(
    error: BaseError, 
    context: ErrorContext
  ): Promise<void> {
    
    // 重要度がMEDIUM以上の場合のみSentryに報告
    if (error.severity === ErrorSeverity.LOW) {
      return;
    }
    
    // Sentryスコープ設定
    this.sentryClient.withScope((scope) => {
      scope.setLevel(this.mapSeverityToSentryLevel(error.severity));
      scope.setTag('error_category', error.category);
      scope.setTag('error_code', error.code);
      scope.setTag('recoverable', error.recoverable.toString());
      
      // ユーザーコンテキスト
      if (context.userId) {
        scope.setUser({
          id: context.userId,
          email: context.userEmail
        });
      }
      
      // 追加コンテキスト
      scope.setContext('error_context', {
        correlationId: error.correlationId,
        action: context.action,
        resource: context.resource,
        metadata: context.metadata
      });
      
      // エラー送信
      this.sentryClient.captureException(error);
    });
  }

  /**
   * アラート評価・送信
   */
  private async evaluateAlerts(
    error: BaseError, 
    context: ErrorContext
  ): Promise<void> {
    
    const alerts = await Promise.all([
      this.checkErrorRateAlert(error),
      this.checkCriticalErrorAlert(error),
      this.checkUserImpactAlert(context),
      this.checkBusinessImpactAlert(error, context),
      this.checkSystemHealthAlert()
    ]);
    
    for (const alert of alerts.filter(Boolean)) {
      await this.alertManager.sendAlert(alert as Alert);
    }
  }

  /**
   * エラー発生率アラート
   */
  private async checkErrorRateAlert(error: BaseError): Promise<Alert | null> {
    const currentRate = await this.calculateErrorRate('5m');
    const baselineRate = await this.getBaselineErrorRate();
    
    if (currentRate > baselineRate * 2 && currentRate > 0.05) {
      return {
        id: `error_rate_${Date.now()}`,
        severity: 'high',
        title: 'エラー発生率急増',
        description: `エラー発生率が${(currentRate * 100).toFixed(2)}%に上昇（通常：${(baselineRate * 100).toFixed(2)}%）`,
        labels: {
          alert_type: 'error_rate',
          current_rate: currentRate.toString(),
          baseline_rate: baselineRate.toString()
        },
        annotations: {
          dashboard: 'https://grafana.example.com/d/errors',
          runbook: 'https://docs.example.com/runbooks/high-error-rate'
        },
        timestamp: new Date()
      };
    }
    
    return null;
  }

  /**
   * 緊急エラーアラート
   */
  private async checkCriticalErrorAlert(error: BaseError): Promise<Alert | null> {
    if (error.severity === ErrorSeverity.CRITICAL) {
      return {
        id: `critical_error_${error.correlationId}`,
        severity: 'critical',
        title: `緊急エラー発生: ${error.code}`,
        description: error.userMessage,
        labels: {
          alert_type: 'critical_error',
          error_code: error.code,
          error_category: error.category
        },
        annotations: {
          correlation_id: error.correlationId,
          error_details: JSON.stringify(error.toJSON())
        },
        timestamp: error.timestamp
      };
    }
    
    return null;
  }

  /**
   * ビジネスプロセス監視
   */
  public async monitorBusinessProcess(
    processName: string,
    execution: BusinessProcessExecution
  ): Promise<void> {
    
    const startTime = Date.now();
    let success = false;
    
    try {
      await execution();
      success = true;
    } catch (error) {
      await this.recordError(error as BaseError, {
        action: processName,
        resource: 'business_process'
      });
    } finally {
      const duration = Date.now() - startTime;
      
      // プロセス実行メトリクス更新
      this.metricsRegistry
        .getHistogram('business_process_duration_seconds')
        ?.observe({ process_name: processName, success: success.toString() }, duration / 1000);
      
      // 成功率計算・更新
      const successRate = await this.calculateProcessSuccessRate(processName, '1h');
      this.metricsRegistry
        .getGauge('business_process_success_rate')
        ?.set({ process_name: processName }, successRate);
    }
  }
}

/**
 * 外部API監視
 */
export class ExternalApiMonitor {
  
  constructor(
    private readonly metricsRegistry: MetricsRegistry,
    private readonly circuitBreakerRegistry: Map<string, CircuitBreaker>
  ) {}
  
  /**
   * API呼び出し監視
   */
  public async monitorApiCall<T>(
    apiName: string,
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    
    const startTime = Date.now();
    const circuitBreaker = this.circuitBreakerRegistry.get(apiName);
    
    try {
      let result: T;
      
      if (circuitBreaker) {
        result = await circuitBreaker.execute(apiCall);
      } else {
        result = await apiCall();
      }
      
      const duration = Date.now() - startTime;
      
      // 成功メトリクス記録
      this.metricsRegistry
        .getHistogram('external_api_duration_seconds')
        ?.observe({ api_name: apiName, endpoint, status: 'success' }, duration / 1000);
        
      this.metricsRegistry
        .getCounter('external_api_requests_total')
        ?.inc({ api_name: apiName, endpoint, status: 'success' });
      
      // API健全性更新
      this.metricsRegistry
        .getGauge('external_api_health')
        ?.set({ api_name: apiName, endpoint }, 1);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 失敗メトリクス記録
      this.metricsRegistry
        .getHistogram('external_api_duration_seconds')
        ?.observe({ 
          api_name: apiName, 
          endpoint, 
          status: 'error',
          error_type: (error as Error).constructor.name 
        }, duration / 1000);
        
      this.metricsRegistry
        .getCounter('external_api_requests_total')
        ?.inc({ 
          api_name: apiName, 
          endpoint, 
          status: 'error',
          error_code: (error as any).code || 'unknown'
        });
      
      // API健全性更新
      this.metricsRegistry
        .getGauge('external_api_health')
        ?.set({ api_name: apiName, endpoint }, 0);
      
      throw error;
    }
  }
}

type BusinessProcessExecution = () => Promise<void>;

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  timestamp: Date;
}
```

### 2.2 リアルタイム監視ダッシュボード

```typescript
// src/shared/utils/monitoring/dashboard-config.ts

/**
 * Grafanaダッシュボード設定
 */
export const dashboardConfig = {
  dashboard: {
    id: 'salary-management-monitoring',
    title: '給料管理システム監視ダッシュボード',
    tags: ['salary-management', 'monitoring', 'errors'],
    timezone: 'Asia/Tokyo',
    refresh: '30s',
    
    panels: [
      // システム概要パネル
      {
        id: 1,
        title: 'システム状態概要',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 0, y: 0 },
        targets: [
          {
            expr: 'application_availability_percent',
            legendFormat: '可用性',
            refId: 'A'
          },
          {
            expr: 'rate(errors_total[5m]) * 100',
            legendFormat: 'エラー率(%)',
            refId: 'B'
          }
        ],
        fieldConfig: {
          defaults: {
            color: { mode: 'thresholds' },
            thresholds: {
              steps: [
                { color: 'red', value: 0 },
                { color: 'yellow', value: 95 },
                { color: 'green', value: 99 }
              ]
            }
          }
        }
      },
      
      // エラー発生率トレンド
      {
        id: 2,
        title: 'エラー発生率トレンド',
        type: 'graph',
        gridPos: { h: 8, w: 12, x: 0, y: 4 },
        targets: [
          {
            expr: 'rate(errors_total{severity="critical"}[5m])',
            legendFormat: 'CRITICAL',
            refId: 'A'
          },
          {
            expr: 'rate(errors_total{severity="high"}[5m])',
            legendFormat: 'HIGH',
            refId: 'B'
          },
          {
            expr: 'rate(errors_total{severity="medium"}[5m])',
            legendFormat: 'MEDIUM',
            refId: 'C'
          }
        ]
      },
      
      // エラーカテゴリ別分布
      {
        id: 3,
        title: 'エラーカテゴリ別分布（過去1時間）',
        type: 'piechart',
        gridPos: { h: 8, w: 6, x: 12, y: 4 },
        targets: [
          {
            expr: 'sum by (category) (increase(errors_total[1h]))',
            legendFormat: '{{ category }}',
            refId: 'A'
          }
        ]
      },
      
      // 外部API健全性
      {
        id: 4,
        title: '外部API健全性',
        type: 'heatmap',
        gridPos: { h: 8, w: 12, x: 0, y: 12 },
        targets: [
          {
            expr: 'external_api_health',
            legendFormat: '{{ api_name }}',
            refId: 'A'
          }
        ]
      },
      
      // ビジネスプロセス成功率
      {
        id: 5,
        title: 'ビジネスプロセス成功率',
        type: 'stat',
        gridPos: { h: 4, w: 6, x: 12, y: 12 },
        targets: [
          {
            expr: 'business_process_success_rate{process_name="pdf_processing"}',
            legendFormat: 'PDF処理',
            refId: 'A'
          },
          {
            expr: 'business_process_success_rate{process_name="stock_transaction"}',
            legendFormat: '株式取引',
            refId: 'B'
          }
        ]
      },
      
      // 最近のエラーログ
      {
        id: 6,
        title: '最近のエラー（重要度HIGH以上）',
        type: 'logs',
        gridPos: { h: 8, w: 18, x: 0, y: 16 },
        targets: [
          {
            expr: '{job="salary-management"} |= "ERROR" | json | severity=~"HIGH|CRITICAL"',
            refId: 'A'
          }
        ]
      }
    ],
    
    // アラート設定
    alerts: [
      {
        name: 'エラー発生率急増',
        condition: 'rate(errors_total[5m]) > 0.05',
        for: '2m',
        annotations: {
          summary: 'エラー発生率が5%を超えています',
          description: '{{ $value }}%のエラー率が検出されました'
        }
      },
      {
        name: 'システム可用性低下',
        condition: 'application_availability_percent < 95',
        for: '1m',
        annotations: {
          summary: 'システム可用性が95%を下回りました',
          description: '現在の可用性: {{ $value }}%'
        }
      }
    ]
  }
};
```

---

## 3. アラート管理システム

### 3.1 アラートルーティング設定

```typescript
// src/shared/utils/alerting/alert-manager.ts

/**
 * アラート管理システム
 */
export class AlertManager {
  private routes: AlertRoute[];
  private inhibitRules: InhibitRule[];
  private notificationChannels: Map<string, NotificationChannel>;
  
  constructor(config: AlertManagerConfig) {
    this.setupRoutes(config.routes);
    this.setupInhibitRules(config.inhibitRules);
    this.setupNotificationChannels(config.channels);
  }

  /**
   * アラート送信
   */
  public async sendAlert(alert: Alert): Promise<void> {
    
    // アラート重複確認
    if (await this.isDuplicateAlert(alert)) {
      return;
    }
    
    // 抑制ルール確認
    if (await this.isInhibited(alert)) {
      return;
    }
    
    // ルーティング実行
    const routes = this.matchRoutes(alert);
    
    // 通知送信
    const notifications = routes.map(route => 
      this.sendNotification(route.channel, alert, route.config)
    );
    
    await Promise.allSettled(notifications);
    
    // アラート履歴保存
    await this.saveAlertHistory(alert);
  }

  /**
   * ルート設定
   */
  private setupRoutes(routeConfigs: AlertRouteConfig[]): void {
    this.routes = routeConfigs.map(config => ({
      ...config,
      matchers: this.compileMatchers(config.matchers),
      groupBy: config.groupBy || [],
      groupWait: config.groupWait || '10s',
      groupInterval: config.groupInterval || '5m',
      repeatInterval: config.repeatInterval || '12h'
    }));
  }

  /**
   * 通知チャンネル設定
   */
  private setupNotificationChannels(channelConfigs: NotificationChannelConfig[]): void {
    this.notificationChannels = new Map();
    
    for (const config of channelConfigs) {
      switch (config.type) {
        case 'slack':
          this.notificationChannels.set(
            config.name, 
            new SlackNotificationChannel(config.slack!)
          );
          break;
          
        case 'pagerduty':
          this.notificationChannels.set(
            config.name,
            new PagerDutyNotificationChannel(config.pagerduty!)
          );
          break;
          
        case 'email':
          this.notificationChannels.set(
            config.name,
            new EmailNotificationChannel(config.email!)
          );
          break;
          
        case 'webhook':
          this.notificationChannels.set(
            config.name,
            new WebhookNotificationChannel(config.webhook!)
          );
          break;
      }
    }
  }

  /**
   * アラートルートマッチング
   */
  private matchRoutes(alert: Alert): AlertRoute[] {
    return this.routes.filter(route =>
      route.matchers.every(matcher =>
        this.matchLabelSelector(alert, matcher)
      )
    );
  }

  /**
   * 抑制ルール確認
   */
  private async isInhibited(alert: Alert): Promise<boolean> {
    const activeAlerts = await this.getActiveAlerts();
    
    return this.inhibitRules.some(rule => {
      // より高い重要度のアラートがアクティブかチェック
      const higherSeverityAlert = activeAlerts.find(active =>
        this.matchLabelsWithRule(active, rule.sourceMatchers) &&
        this.getSeverityValue(active.severity) > this.getSeverityValue(alert.severity)
      );
      
      if (!higherSeverityAlert) return false;
      
      // ターゲット条件マッチング
      return rule.targetMatchers.every(matcher =>
        this.matchLabelSelector(alert, matcher)
      );
    });
  }
}

/**
 * Slack通知チャンネル
 */
class SlackNotificationChannel implements NotificationChannel {
  constructor(private config: SlackConfig) {}

  async send(alert: Alert, routeConfig: AlertRouteConfig): Promise<void> {
    const message = this.formatSlackMessage(alert);
    
    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: this.config.channel,
        username: 'Alert Manager',
        icon_emoji: this.getSeverityEmoji(alert.severity),
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          title: alert.title,
          text: alert.description,
          fields: [
            {
              title: '重要度',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: '発生時刻',
              value: alert.timestamp.toLocaleString('ja-JP'),
              short: true
            },
            {
              title: '相関ID',
              value: alert.labels.correlation_id || 'N/A',
              short: true
            }
          ],
          actions: [
            {
              type: 'button',
              text: 'ダッシュボード確認',
              url: alert.annotations.dashboard
            },
            {
              type: 'button',
              text: 'ランブック',
              url: alert.annotations.runbook
            }
          ]
        }]
      })
    });
  }

  private getSeverityEmoji(severity: string): string {
    const emojiMap = {
      'critical': ':rotating_light:',
      'high': ':warning:',
      'medium': ':exclamation:',
      'low': ':information_source:'
    };
    return emojiMap[severity as keyof typeof emojiMap] || ':question:';
  }

  private getSeverityColor(severity: string): string {
    const colorMap = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'good',
      'low': '#439FE0'
    };
    return colorMap[severity as keyof typeof colorMap] || 'good';
  }
}

/**
 * PagerDuty通知チャンネル
 */
class PagerDutyNotificationChannel implements NotificationChannel {
  constructor(private config: PagerDutyConfig) {}

  async send(alert: Alert, routeConfig: AlertRouteConfig): Promise<void> {
    // CRITICALとHIGHアラートのみPagerDutyに送信
    if (!['critical', 'high'].includes(alert.severity)) {
      return;
    }

    const payload = {
      routing_key: this.config.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        source: 'salary-management-system',
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString(),
        component: alert.labels.component,
        group: alert.labels.category,
        class: alert.labels.error_code,
        custom_details: {
          description: alert.description,
          correlation_id: alert.labels.correlation_id,
          dashboard_url: alert.annotations.dashboard,
          runbook_url: alert.annotations.runbook
        }
      },
      links: [
        {
          href: alert.annotations.dashboard,
          text: 'ダッシュボード'
        }
      ]
    };

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token token=${this.config.apiToken}`
      },
      body: JSON.stringify(payload)
    });
  }
}

// アラート設定インターフェース
interface AlertManagerConfig {
  routes: AlertRouteConfig[];
  inhibitRules: InhibitRule[];
  channels: NotificationChannelConfig[];
}

interface AlertRouteConfig {
  name: string;
  matchers: string[];
  channel: string;
  groupBy?: string[];
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
  continue?: boolean;
}

interface InhibitRule {
  sourceMatchers: string[];
  targetMatchers: string[];
  equal?: string[];
}

interface NotificationChannelConfig {
  name: string;
  type: 'slack' | 'pagerduty' | 'email' | 'webhook';
  slack?: SlackConfig;
  pagerduty?: PagerDutyConfig;
  email?: EmailConfig;
  webhook?: WebhookConfig;
}
```

### 3.2 エスカレーション・オンコール管理

```typescript
// src/shared/utils/alerting/escalation-manager.ts

/**
 * エスカレーション・オンコール管理
 */
export class EscalationManager {
  private escalationPolicies: Map<string, EscalationPolicy>;
  private onCallSchedule: OnCallSchedule;
  private escalationHistory: Map<string, EscalationHistory[]>;

  constructor(
    private readonly config: EscalationConfig,
    private readonly notificationService: NotificationService
  ) {
    this.loadEscalationPolicies();
    this.loadOnCallSchedule();
    this.escalationHistory = new Map();
  }

  /**
   * アラートエスカレーション実行
   */
  public async escalateAlert(alert: Alert): Promise<void> {
    const policy = this.getEscalationPolicy(alert);
    if (!policy) return;

    const escalationId = `${alert.id}_escalation`;
    const escalationFlow = new EscalationFlow(escalationId, alert, policy);
    
    await this.executeEscalationFlow(escalationFlow);
  }

  /**
   * エスカレーションフロー実行
   */
  private async executeEscalationFlow(flow: EscalationFlow): Promise<void> {
    for (let level = 0; level < flow.policy.levels.length; level++) {
      const escalationLevel = flow.policy.levels[level];
      
      try {
        // 現在のオンコール担当者取得
        const onCallPersons = await this.getCurrentOnCall(escalationLevel.team);
        
        // 通知送信
        await this.sendEscalationNotifications(
          flow.alert,
          escalationLevel,
          onCallPersons,
          level
        );
        
        // エスカレーション履歴記録
        this.recordEscalationHistory(flow.id, level, onCallPersons);
        
        // 応答待機
        const responded = await this.waitForResponse(
          flow.id,
          escalationLevel.timeout,
          onCallPersons
        );
        
        if (responded) {
          console.log(`Escalation level ${level} acknowledged`);
          return;
        }
        
        console.log(`Escalation level ${level} timeout, escalating to next level`);
        
      } catch (error) {
        console.error(`Error in escalation level ${level}:`, error);
      }
    }
    
    // 最終エスカレーション（役員通知など）
    await this.sendFinalEscalation(flow.alert);
  }

  /**
   * オンコールスケジュール管理
   */
  private async getCurrentOnCall(team: string): Promise<OnCallPerson[]> {
    const now = new Date();
    const schedule = this.onCallSchedule.getSchedule(team);
    
    return schedule.entries
      .filter(entry => 
        now >= entry.startTime && 
        now < entry.endTime &&
        entry.isActive
      )
      .map(entry => entry.person);
  }

  /**
   * エスカレーション通知送信
   */
  private async sendEscalationNotifications(
    alert: Alert,
    level: EscalationLevel,
    onCallPersons: OnCallPerson[],
    levelIndex: number
  ): Promise<void> {
    
    const notifications = onCallPersons.map(async person => {
      // 通知チャンネル優先順位に従って送信
      for (const method of level.notificationMethods) {
        try {
          switch (method) {
            case 'phone':
              await this.notificationService.sendPhoneCall(
                person.phoneNumber,
                this.formatVoiceMessage(alert, levelIndex)
              );
              break;
              
            case 'sms':
              await this.notificationService.sendSMS(
                person.phoneNumber,
                this.formatSMSMessage(alert, levelIndex)
              );
              break;
              
            case 'email':
              await this.notificationService.sendEmail(
                person.email,
                this.formatEmailMessage(alert, levelIndex)
              );
              break;
              
            case 'push':
              await this.notificationService.sendPushNotification(
                person.deviceTokens,
                this.formatPushMessage(alert, levelIndex)
              );
              break;
          }
          
          // 成功したら次の通知方法は不要
          break;
          
        } catch (error) {
          console.error(`Failed to send ${method} notification to ${person.name}:`, error);
          // 次の通知方法を試行
        }
      }
    });
    
    await Promise.allSettled(notifications);
  }

  /**
   * 応答待機
   */
  private async waitForResponse(
    escalationId: string,
    timeout: number,
    onCallPersons: OnCallPerson[]
  ): Promise<boolean> {
    
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), timeout);
      
      // 応答確認ポーリング
      const checkResponse = setInterval(async () => {
        const acknowledged = await this.checkAcknowledgment(escalationId);
        
        if (acknowledged) {
          clearTimeout(timeoutId);
          clearInterval(checkResponse);
          resolve(true);
        }
      }, 10000); // 10秒ごとにチェック
      
      // タイムアウト時のクリーンアップ
      setTimeout(() => {
        clearInterval(checkResponse);
      }, timeout);
    });
  }

  /**
   * 音声メッセージフォーマット
   */
  private formatVoiceMessage(alert: Alert, level: number): VoiceMessage {
    return {
      text: `緊急アラートが発生しました。重要度：${alert.severity}。内容：${alert.title}。エスカレーションレベル${level + 1}です。確認するには1を、エスカレートするには9を押してください。`,
      voice: 'ja-JP-Wavenet-A',
      responseOptions: [
        { key: '1', action: 'acknowledge' },
        { key: '9', action: 'escalate' }
      ]
    };
  }
}

/**
 * オンコールスケジュール定義
 */
export class OnCallSchedule {
  private schedules: Map<string, TeamSchedule>;

  constructor(scheduleData: ScheduleData) {
    this.schedules = new Map();
    this.loadSchedules(scheduleData);
  }

  /**
   * 週間オンコールローテーション
   */
  public generateWeeklyRotation(
    team: string,
    members: OnCallPerson[],
    startDate: Date,
    weeks: number
  ): ScheduleEntry[] {
    
    const entries: ScheduleEntry[] = [];
    const currentDate = new Date(startDate);
    
    for (let week = 0; week < weeks; week++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() + (week * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const primaryIndex = week % members.length;
      const secondaryIndex = (week + 1) % members.length;
      
      entries.push({
        id: `${team}_${week}_primary`,
        team,
        person: members[primaryIndex],
        role: 'primary',
        startTime: weekStart,
        endTime: weekEnd,
        isActive: true
      });
      
      entries.push({
        id: `${team}_${week}_secondary`,
        team,
        person: members[secondaryIndex],
        role: 'secondary',
        startTime: weekStart,
        endTime: weekEnd,
        isActive: true
      });
    }
    
    return entries;
  }
}

// データ構造定義
interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

interface EscalationLevel {
  team: string;
  timeout: number; // ミリ秒
  notificationMethods: NotificationMethod[];
}

type NotificationMethod = 'phone' | 'sms' | 'email' | 'push' | 'slack';

interface OnCallPerson {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  deviceTokens: string[];
  timezone: string;
}

interface ScheduleEntry {
  id: string;
  team: string;
  person: OnCallPerson;
  role: 'primary' | 'secondary';
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}
```

---

## 4. 運用対応手順

### 4.1 インシデント対応プロセス

#### 4.1.1 CRITICAL レベルインシデント対応手順

```markdown
# CRITICAL インシデント対応手順

## 即座対応（0-15分）

### 1. インシデント検知・確認
- [ ] アラート受信確認（PagerDuty/電話/Slack）
- [ ] ダッシュボードでシステム状況確認
- [ ] 影響範囲の初期評価
- [ ] インシデント管理ツール（Jira/GitHub Issues）でチケット作成

### 2. 初期対応・コミュニケーション
- [ ] インシデント対応チャンネル（#incident-response）で状況共有
- [ ] ステークホルダーへの初期通知（15分以内）
- [ ] 顧客向けステータスページ更新検討

### 3. 緊急回復試行
- [ ] 自動回復メカニズムの状況確認
- [ ] 手動でのサービス再起動試行
- [ ] データベース接続状況確認
- [ ] 外部サービス依存関係確認

## 対応チーム召集（15-30分）

### 4. エスカレーション
- [ ] テクニカルリード、SREチーム召集
- [ ] プロダクトマネージャーへの報告
- [ ] 必要に応じてCTO/VP Engineeringへエスカレーション

### 5. 詳細調査・診断
- [ ] ログ分析（Grafana/CloudWatch/Sentry）
- [ ] データベース状況詳細確認
- [ ] インフラストラクチャ監視指標確認
- [ ] 外部API応答状況確認

### 6. 復旧作業
- [ ] 根本原因特定
- [ ] 修正パッチ作成・テスト
- [ ] 段階的デプロイメント実行
- [ ] ヘルスチェック・検証

## 復旧後対応（30分-）

### 7. 動作確認・監視強化
- [ ] 全機能の動作確認
- [ ] ユーザーからの報告確認
- [ ] 監視指標の正常化確認
- [ ] 追加監視・アラートの設定

### 8. コミュニケーション・報告
- [ ] ステークホルダーへの復旧報告
- [ ] 顧客向けステータス更新
- [ ] インシデント終了宣言

### 9. 事後対応
- [ ] インシデントレポート作成（24時間以内）
- [ ] ポストモーテム会議スケジュール
- [ ] 再発防止策の検討・実装計画
```

#### 4.1.2 HIGH レベルエラー対応手順

```markdown
# HIGH レベルエラー対応手順

## 通常対応（0-60分）

### 1. エラー分析・トリアージ
- [ ] エラー詳細確認（Sentry/ログ）
- [ ] 影響ユーザー数・範囲確認
- [ ] 類似エラーの発生パターン分析
- [ ] 緊急度・優先度の再評価

### 2. 初期対応・調査
- [ ] 自動回復の実行状況確認
- [ ] 手動回復の必要性判断
- [ ] 関連システム・依存関係の確認
- [ ] 一時的な回避策の検討

### 3. 修正・改善作業
- [ ] 根本原因の特定
- [ ] 修正内容の設計・実装
- [ ] テスト環境での検証
- [ ] 本番環境への適用計画

### 4. フォローアップ
- [ ] エラー再発監視（24時間）
- [ ] ユーザーフィードバック確認
- [ ] 改善効果の測定
- [ ] 次回リリースでの恒久対策検討
```

### 4.2 ランブック（運用手順書）

#### 4.2.1 データベース関連エラー対応

```markdown
# データベース関連エラー対応ランブック

## DB接続エラー (SYSTEM-DATABASE-CRITICAL-001)

### 症状
- アプリケーションからデータベースに接続できない
- "connection refused" または "timeout" エラー
- Grafanaでの接続プール使用率100%

### 原因分析チェックリスト
- [ ] データベースサーバーの稼働状況
- [ ] ネットワーク接続状況
- [ ] 接続プール設定・制限
- [ ] データベース負荷状況
- [ ] ディスク使用量・I/O状況

### 対応手順

#### ステップ1: 緊急確認
```bash
# データベース接続テスト
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# 接続数確認
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT count(*) as active_connections, 
         max_conn.setting as max_connections
  FROM pg_stat_activity, 
       (SELECT setting FROM pg_settings WHERE name='max_connections') max_conn;
"

# 長時間実行中のクエリ確認
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
  FROM pg_stat_activity 
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
"
```

#### ステップ2: 即座修復
```bash
# 長時間クエリの強制終了（注意深く実行）
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  SELECT pg_terminate_backend(pid) 
  FROM pg_stat_activity 
  WHERE (now() - pg_stat_activity.query_start) > interval '10 minutes' 
    AND query NOT LIKE '%pg_stat_activity%';
"

# アプリケーション接続プール再起動
kubectl rollout restart deployment/salary-management-api

# 接続プール設定調整（一時的）
kubectl patch deployment salary-management-api -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [
          {
            "name": "api",
            "env": [
              {
                "name": "DATABASE_MAX_CONNECTIONS",
                "value": "20"
              }
            ]
          }
        ]
      }
    }
  }
}'
```

#### ステップ3: 監視・検証
- [ ] 接続数正常化確認
- [ ] アプリケーション動作確認
- [ ] エラーログ消失確認
- [ ] パフォーマンス指標正常化
```

#### 4.2.2 外部API関連エラー対応

```markdown
# 外部API関連エラー対応ランブック

## 株価API接続エラー (PORTFOLIO-API-HIGH-001)

### 症状
- 株価情報取得に失敗
- タイムアウトエラー頻発
- サーキットブレーカー開放状態

### 対応手順

#### ステップ1: API状況確認
```bash
# 外部API健全性チェック
curl -I -m 10 https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=5min&apikey=$ALPHA_VANTAGE_API_KEY

# レスポンス時間測定
time curl -s "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=5min&apikey=$ALPHA_VANTAGE_API_KEY" > /dev/null

# APIクォータ確認
curl -s "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=5min&apikey=$ALPHA_VANTAGE_API_KEY" | jq '.["Information"]'
```

#### ステップ2: サーキットブレーカーリセット
```typescript
// 管理画面またはAPIエンドポイントで実行
await circuitBreakerRegistry.get('alpha_vantage')?.reset();

// サーキットブレーカー状態確認
const status = circuitBreakerRegistry.get('alpha_vantage')?.getStats();
console.log('Circuit breaker status:', status);
```

#### ステップ3: バックアップAPI切り替え
```bash
# バックアップAPIに切り替え
kubectl set env deployment/salary-management-api STOCK_API_PROVIDER=yahoo_finance

# 設定確認
kubectl get deployment salary-management-api -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="STOCK_API_PROVIDER")].value}'
```
```

### 4.3 定期メンテナンス手順

```markdown
# 定期メンテナンス手順

## 月次メンテナンス

### データベースメンテナンス
- [ ] インデックス再構築
- [ ] テーブル統計情報更新
- [ ] 不要データ削除・アーカイブ
- [ ] バックアップ検証

### ログローテーション・クリーンアップ
- [ ] アプリケーションログ圧縮・アーカイブ
- [ ] 監視データ保持期間確認
- [ ] エラー履歴データクリーンアップ

### セキュリティ更新
- [ ] 依存関係セキュリティアップデート
- [ ] API キーローテーション
- [ ] SSL証明書有効期限確認

### パフォーマンス最適化
- [ ] 低速クエリ分析・最適化
- [ ] キャッシュ効率確認・調整
- [ ] CDN設定見直し

## 四半期メンテナンス

### 容量計画・リソース最適化
- [ ] リソース使用率トレンド分析
- [ ] スケーリング設定調整
- [ ] コスト最適化検討

### 災害復旧テスト
- [ ] バックアップ復旧テスト
- [ ] フェイルオーバー手順確認
- [ ] 緊急時連絡体制確認

### 監視・アラート見直し
- [ ] アラート閾値調整
- [ ] 新規監視項目検討
- [ ] オンコールスケジュール更新
```

---

## 5. 運用メトリクス・KPI

### 5.1 エラー関連KPI定義

| カテゴリ | KPI指標 | 目標値 | 測定方法 | 報告頻度 |
|---------|---------|--------|----------|----------|
| **可用性** | システム可用性 | 99.9% | uptime/total time | 月次 |
| **エラー率** | 全体エラー率 | <1% | errors/requests | 日次 |
| **復旧時間** | MTTR (Mean Time To Repair) | <30分 | incident start-resolution | インシデント毎 |
| **エラー検出** | MTTD (Mean Time To Detect) | <5分 | error occurred-alert | 週次平均 |
| **ユーザー影響** | エラー影響ユーザー率 | <5% | affected users/total users | 日次 |
| **自動回復** | 自動回復成功率 | >80% | auto recoveries/total errors | 週次 |

### 5.2 ビジネス影響メトリクス

```typescript
// src/shared/utils/metrics/business-impact-calculator.ts

/**
 * ビジネス影響度計算サービス
 */
export class BusinessImpactCalculator {
  
  /**
   * エラーのビジネス影響度計算
   */
  public calculateBusinessImpact(
    error: BaseError,
    context: ErrorContext,
    timeRange: TimeRange
  ): BusinessImpact {
    
    const impact = {
      financialImpact: this.calculateFinancialImpact(error, context, timeRange),
      userExperience: this.calculateUXImpact(error, context, timeRange),
      reputation: this.calculateReputationImpact(error, context, timeRange),
      operational: this.calculateOperationalImpact(error, context, timeRange)
    };
    
    return {
      ...impact,
      overall: this.calculateOverallImpact(impact),
      score: this.calculateImpactScore(impact)
    };
  }

  /**
   * 財務影響計算
   */
  private calculateFinancialImpact(
    error: BaseError,
    context: ErrorContext,
    timeRange: TimeRange
  ): FinancialImpact {
    
    const affectedUsers = context.affectedUsers || 0;
    const downtimeMinutes = timeRange.durationMinutes();
    
    // 機能別収益影響
    let revenueImpact = 0;
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        // ログインできない = 全機能停止
        revenueImpact = affectedUsers * 1000 * (downtimeMinutes / 60); // 仮定値
        break;
      case ErrorCategory.FILE_PROCESSING:
        // PDF処理停止 = 新規データ登録不可
        revenueImpact = affectedUsers * 100 * (downtimeMinutes / 60);
        break;
      case ErrorCategory.EXTERNAL_API:
        // 株価取得停止 = 投資判断への影響
        revenueImpact = affectedUsers * 50 * (downtimeMinutes / 60);
        break;
    }
    
    // SLA違反コスト
    const slaViolationCost = this.calculateSLAViolationCost(downtimeMinutes);
    
    return {
      estimatedRevenueLoss: revenueImpact,
      slaViolationCost,
      operationalCost: downtimeMinutes * 10, // 運用コスト
      totalCost: revenueImpact + slaViolationCost + (downtimeMinutes * 10)
    };
  }

  /**
   * ユーザーエクスペリエンス影響計算
   */
  private calculateUXImpact(
    error: BaseError,
    context: ErrorContext,
    timeRange: TimeRange
  ): UXImpact {
    
    const frustrationScore = this.calculateFrustrationScore(error);
    const completionImpact = this.calculateTaskCompletionImpact(error);
    
    return {
      frustractionLevel: frustrationScore,
      taskCompletionRate: completionImpact,
      expectedChurnRate: frustrationScore * 0.1, // 10%がチャーンリスクと仮定
      npsImpact: frustrationScore * -2 // NPSへの負の影響
    };
  }
}

/**
 * SLAモニタリング
 */
export class SLAMonitor {
  private slaTargets: SLATarget[];
  
  constructor(config: SLAConfig) {
    this.slaTargets = config.targets;
  }

  /**
   * SLA遵守状況計算
   */
  public calculateSLACompliance(timeRange: TimeRange): SLACompliance {
    const results = this.slaTargets.map(target => ({
      target,
      actual: this.measureActualPerformance(target, timeRange),
      compliance: this.calculateCompliance(target, timeRange),
      violationCost: this.calculateViolationCost(target, timeRange)
    }));

    return {
      overall: results.reduce((sum, r) => sum + r.compliance, 0) / results.length,
      byTarget: results,
      totalViolationCost: results.reduce((sum, r) => sum + r.violationCost, 0)
    };
  }
}

// インターフェース定義
interface BusinessImpact {
  financialImpact: FinancialImpact;
  userExperience: UXImpact;
  reputation: ReputationImpact;
  operational: OperationalImpact;
  overall: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
}

interface SLATarget {
  name: string;
  metric: string;
  target: number;
  measurement: 'availability' | 'response_time' | 'error_rate';
  penalty: number; // 違反時のペナルティコスト
}
```

---

## 6. 次のステップと改善計画

### 6.1 短期改善計画（1-3ヶ月）

1. **監視強化**
   - [ ] 合成監視（Synthetic Monitoring）導入
   - [ ] ユーザージャーニー監視設定
   - [ ] 異常検知アルゴリズム改善

2. **アラート精度向上**
   - [ ] 機械学習ベースの動的閾値設定
   - [ ] アラート疲れ対策（重複除去、グルーピング）
   - [ ] コンテキストアウェアなアラート

3. **自動化推進**
   - [ ] 自動回復メカニズム拡充
   - [ ] ChatOpsによる運用自動化
   - [ ] インシデント対応フロー自動化

### 6.2 中長期改善計画（3-12ヶ月）

1. **予測的監視**
   - [ ] 時系列分析による障害予測
   - [ ] 容量計画自動化
   - [ ] プロアクティブなスケーリング

2. **高度な分析機能**
   - [ ] エラーパターン自動分析
   - [ ] 根本原因分析（RCA）自動化
   - [ ] ビジネス影響度自動計算

3. **運用効率化**
   - [ ] NoOps指向の自動運用
   - [ ] 自己修復システム構築
   - [ ] 知識ベース自動構築・更新

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| エラーハンドリング設計アーキテクト | エキスパートエラーハンドリング設計アーキテクト | 2025-08-10 | ✅ |
| SREチームリード | - | - | [ ] |
| プロダクトマネージャー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | エキスパートエラーハンドリング設計アーキテクト |
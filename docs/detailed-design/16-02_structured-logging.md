# 構造化ロギング実装設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: エキスパートロギング設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **前提条件**: logging-strategy の完了

---

## 1. 構造化ログ実装概要

### 1.1 アーキテクチャ設計

本システムの構造化ロギング実装は、以下のレイヤー構造で設計されています：

```
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer                            │
├─────────────────────────────────────────────────────────────┤
│ SalarySlipService │ PortfolioService │ AuthService │ ...    │
│      ↓           │        ↓         │      ↓      │        │
└─────────────────────────────────────────────────────────────┘
         ↓                   ↓                 ↓
┌─────────────────────────────────────────────────────────────┐
│                  Logging Layer                              │
├─────────────────────────────────────────────────────────────┤
│  LoggerFactory  →  StructuredLogger  →  DataSanitizer      │
│                           ↓                                 │
│  ContextProvider → LogTransformers → AsyncLogBuffer        │
└─────────────────────────────────────────────────────────────┘
         ↓                   ↓                 ↓
┌─────────────────────────────────────────────────────────────┐
│               Transport Layer                               │
├─────────────────────────────────────────────────────────────┤
│ ConsoleTransport │ FileTransport │ ElasticsearchTransport  │
└─────────────────────────────────────────────────────────────┘
         ↓                   ↓                 ↓
┌─────────────────────────────────────────────────────────────┐
│              Storage & Aggregation                          │
├─────────────────────────────────────────────────────────────┤
│  Local Files  │    Elasticsearch    │    Cloud Storage     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 実装技術スタック

| コンポーネント | 技術選定 | 理由 |
|--------------|----------|------|
| **ロガーライブラリ** | Pino.js | 高パフォーマンス、TypeScript対応、構造化ログ標準 |
| **ログ集約** | Elasticsearch + Logstash | 高速検索、豊富な分析機能 |
| **メトリクス** | Prometheus + Grafana | 業界標準、豊富な可視化機能 |
| **分散トレーシング** | OpenTelemetry | オープンスタンダード、将来性 |
| **ストレージ** | AWS S3 / Google Cloud Storage | スケーラブル、コスト効率 |

---

## 2. ロガー実装詳細

### 2.1 核となるLoggerクラス

```typescript
// src/shared/infrastructure/logging/structured-logger.ts

import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';
import { DataSanitizer } from './data-sanitizer';
import { ContextProvider } from './context-provider';
import { LogTransport } from './transports/base-transport';

export class StructuredLogger implements ILogger {
  private readonly pino: pino.Logger;
  private readonly contextProvider: ContextProvider;
  private readonly sanitizer: DataSanitizer;
  private readonly transports: LogTransport[];
  
  constructor(
    private readonly config: LoggerConfig,
    contextProvider: ContextProvider,
    sanitizer: DataSanitizer,
    transports: LogTransport[]
  ) {
    this.contextProvider = contextProvider;
    this.sanitizer = sanitizer;
    this.transports = transports;
    
    this.pino = pino({
      level: config.level,
      base: {
        service: config.service,
        version: config.version,
        environment: config.environment,
        hostname: config.hostname
      },
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
        bindings: (bindings) => ({
          pid: bindings.pid,
          hostname: bindings.hostname
        })
      },
      serializers: {
        error: this.serializeError,
        req: this.serializeRequest,
        res: this.serializeResponse
      },
      // 本番環境では最適化されたフォーマット
      ...(config.environment === 'production' ? {
        transport: undefined
      } : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      })
    });
  }

  // メインログメソッド群
  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  trace(message: string, context?: LogContext): void {
    this.log('TRACE', message, context);
  }

  // 構造化ログメソッド群
  logBusinessEvent(event: BusinessEvent): void {
    const enrichedEvent = this.enrichEvent({
      ...event,
      category: 'business',
      level: 'INFO'
    });
    this.log('INFO', event.message, enrichedEvent);
  }

  logSystemEvent(event: SystemEvent): void {
    const enrichedEvent = this.enrichEvent({
      ...event,
      category: 'system',
      level: event.level || 'INFO'
    });
    this.log(event.level || 'INFO', event.message, enrichedEvent);
  }

  logSecurityEvent(event: SecurityEvent): void {
    const enrichedEvent = this.enrichEvent({
      ...event,
      category: 'security',
      level: event.level || 'WARN'
    });
    
    // セキュリティイベントは特別な処理
    this.log(event.level || 'WARN', event.message, enrichedEvent);
    this.notifySecurityTeam(event);
  }

  logAuditEvent(event: AuditEvent): void {
    const enrichedEvent = this.enrichEvent({
      ...event,
      category: 'audit',
      level: 'INFO'
    });
    
    // 監査ログは署名付きで記録
    this.logWithSignature('INFO', event.message, enrichedEvent);
  }

  // 内部実装メソッド
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const enrichedContext = this.buildLogContext(level, context);
    const sanitizedContext = this.sanitizer.sanitize(enrichedContext);
    
    // Pinoでの基本ログ出力
    this.pino[level.toLowerCase()](sanitizedContext, message);
    
    // 追加のトランスポートへの出力
    this.outputToTransports(level, message, sanitizedContext);
  }

  private buildLogContext(level: LogLevel, context?: LogContext): EnrichedLogContext {
    const baseContext = this.contextProvider.getContext();
    
    return {
      // 基本情報
      timestamp: new Date().toISOString(),
      level,
      requestId: baseContext.requestId,
      traceId: baseContext.traceId,
      spanId: baseContext.spanId,
      userId: baseContext.userId,
      sessionId: baseContext.sessionId,
      
      // システム情報
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
      hostname: this.config.hostname,
      
      // コンテキスト情報
      module: context?.module || baseContext.module,
      operation: context?.operation,
      category: context?.category || 'system',
      
      // 詳細データ
      data: context?.data,
      error: context?.error ? this.formatError(context.error) : undefined,
      performance: context?.performance,
      
      // メタデータ
      labels: {
        ...baseContext.labels,
        ...context?.labels
      }
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levelOrder = { ERROR: 4, WARN: 3, INFO: 2, DEBUG: 1, TRACE: 0 };
    const configLevel = levelOrder[this.config.level.toUpperCase() as LogLevel];
    const messageLevel = levelOrder[level];
    
    return messageLevel >= configLevel;
  }

  private async outputToTransports(
    level: LogLevel, 
    message: string, 
    context: EnrichedLogContext
  ): Promise<void> {
    const logEntry: LogEntry = {
      level,
      message,
      ...context
    };

    // 非同期で各トランスポートに出力
    const transportPromises = this.transports
      .filter(transport => transport.shouldHandle(level))
      .map(transport => transport.write(logEntry).catch(error => {
        // トランスポートエラーはコンソールに出力
        console.error(`Transport error for ${transport.name}:`, error);
      }));

    await Promise.allSettled(transportPromises);
  }

  private serializeError = (error: Error): object => {
    return {
      type: error.name,
      message: error.message,
      stack: this.config.includeStackTrace ? error.stack : undefined,
      code: (error as any).code,
      statusCode: (error as any).statusCode
    };
  };

  private serializeRequest = (req: any): object => {
    return {
      method: req.method,
      url: req.url,
      headers: this.sanitizer.sanitizeHeaders(req.headers),
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    };
  };

  private serializeResponse = (res: any): object => {
    return {
      statusCode: res.statusCode,
      headers: this.sanitizer.sanitizeHeaders(res.headers)
    };
  };

  private enrichEvent(event: any): EnrichedLogContext {
    return {
      ...event,
      enrichedAt: new Date().toISOString(),
      correlationId: this.contextProvider.getCorrelationId(),
      metadata: {
        ...event.metadata,
        enrichmentVersion: '1.0'
      }
    };
  }

  private async logWithSignature(
    level: LogLevel, 
    message: string, 
    context: EnrichedLogContext
  ): Promise<void> {
    // 監査ログには署名を付与
    const signature = await this.createSignature(context);
    const signedContext = {
      ...context,
      signature,
      integrity: {
        hash: this.createHash(context),
        algorithm: 'SHA-256'
      }
    };

    this.log(level, message, signedContext);
  }

  private async createSignature(context: any): Promise<string> {
    // 実際の実装では暗号化ライブラリを使用
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha256', this.config.signingKey);
    hash.update(JSON.stringify(context));
    return hash.digest('hex');
  }

  private createHash(context: any): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(JSON.stringify(context))
      .digest('hex');
  }

  private async notifySecurityTeam(event: SecurityEvent): Promise<void> {
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      // 重要なセキュリティイベントは即座に通知
      // 実装は省略 (Slack, Email, Webhook等)
    }
  }
}
```

### 2.2 コンテキストプロバイダー実装

```typescript
// src/shared/infrastructure/logging/context-provider.ts

export class ContextProvider {
  private contextStorage = new AsyncLocalStorage<LogContext>();

  constructor() {
    this.setupMiddleware();
  }

  // HTTPリクエスト用のミドルウェア
  setupMiddleware() {
    return (req: any, res: any, next: any) => {
      const context: LogContext = {
        requestId: this.generateRequestId(),
        traceId: req.headers['x-trace-id'] || this.generateTraceId(),
        spanId: this.generateSpanId(),
        userId: req.user?.id,
        sessionId: req.session?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        module: this.extractModuleFromPath(req.path),
        labels: {
          environment: process.env.NODE_ENV || 'development',
          deployment: process.env.DEPLOYMENT_ID || 'unknown'
        }
      };

      this.contextStorage.run(context, () => {
        next();
      });
    };
  }

  // 現在のコンテキストを取得
  getContext(): LogContext {
    return this.contextStorage.getStore() || this.getDefaultContext();
  }

  // 追加のコンテキスト情報を設定
  setContext(additionalContext: Partial<LogContext>): void {
    const current = this.getContext();
    const updated = { ...current, ...additionalContext };
    
    this.contextStorage.enterWith(updated);
  }

  // ユーザー固有のコンテキストを設定
  setUserContext(userId: string, additionalData?: Record<string, any>): void {
    this.setContext({
      userId,
      userContext: additionalData
    });
  }

  // 操作固有のコンテキストを設定
  setOperationContext(operation: string, data?: Record<string, any>): void {
    this.setContext({
      operation,
      operationData: data
    });
  }

  // 相関IDを取得
  getCorrelationId(): string {
    const context = this.getContext();
    return context.requestId || this.generateRequestId();
  }

  private getDefaultContext(): LogContext {
    return {
      requestId: this.generateRequestId(),
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      module: 'unknown',
      labels: {
        environment: process.env.NODE_ENV || 'development'
      }
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractModuleFromPath(path: string): string {
    const matches = path.match(/^\/api\/v\d+\/([^\/]+)/);
    return matches ? matches[1] : 'unknown';
  }
}
```

### 2.3 データサニタイザー実装

```typescript
// src/shared/infrastructure/logging/data-sanitizer.ts

export class DataSanitizer {
  private readonly piiPatterns: PIIPattern[] = [
    {
      field: 'email',
      pattern: /^(.{1,3}).*?(@.*)$/,
      replacement: '$1***$2',
      priority: 'high'
    },
    {
      field: 'name',
      pattern: /^(.).*(.)$/,
      replacement: '$1***$2',
      priority: 'high'
    },
    {
      field: 'phone',
      pattern: /^(\d{3})-?(\d{4})-?(\d{4})$/,
      replacement: '$1-****-$3',
      priority: 'high'
    },
    {
      field: 'employeeId',
      pattern: /^(.{2})(.+)(.{2})$/,
      replacement: '$1***$3',
      priority: 'medium'
    },
    {
      field: 'ipAddress',
      pattern: /^(\d+\.\d+)\.\d+\.\d+$/,
      replacement: '$1.***',
      priority: 'low'
    }
  ];

  private readonly excludedFields = new Set([
    'password',
    'passwordHash',
    'salt',
    'privateKey',
    'apiSecret',
    'refreshToken',
    'accessToken',
    'socialSecurityNumber',
    'bankAccount',
    'creditCardNumber'
  ]);

  sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    if (typeof data === 'object') {
      return this.sanitizeObject(data);
    }

    return data;
  }

  sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = new Set([
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token'
    ]);

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveHeaders.has(lowerKey)) {
        sanitized[key] = this.maskSensitiveValue(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // 除外フィールドは完全に削除
      if (this.excludedFields.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // PII フィールドはマスキング
      const pattern = this.findPattern(key);
      if (pattern && typeof value === 'string') {
        sanitized[key] = this.applyPattern(value, pattern);
      } else {
        sanitized[key] = this.sanitize(value);
      }
    }

    return sanitized;
  }

  private sanitizeString(str: string): string {
    // 一般的な機密情報パターンをチェック
    const patterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '***@***.***' },
      { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '****-****-****-****' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' }
    ];

    let sanitized = str;
    for (const { pattern, replacement } of patterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return sanitized;
  }

  private findPattern(fieldName: string): PIIPattern | undefined {
    return this.piiPatterns.find(pattern => 
      pattern.field === fieldName.toLowerCase() ||
      fieldName.toLowerCase().includes(pattern.field)
    );
  }

  private applyPattern(value: string, pattern: PIIPattern): string {
    try {
      return value.replace(pattern.pattern, pattern.replacement);
    } catch (error) {
      // パターンマッチングでエラーが発生した場合は安全側に倒す
      return '[MASKED]';
    }
  }

  private maskSensitiveValue(value: string): string {
    if (value.length <= 8) {
      return '***';
    }
    
    const start = value.substring(0, 3);
    const end = value.substring(value.length - 3);
    return `${start}***${end}`;
  }
}

interface PIIPattern {
  field: string;
  pattern: RegExp;
  replacement: string;
  priority: 'high' | 'medium' | 'low';
}
```

---

## 3. ログトランスポート実装

### 3.1 基底トランスポートクラス

```typescript
// src/shared/infrastructure/logging/transports/base-transport.ts

export abstract class BaseTransport implements LogTransport {
  protected readonly config: TransportConfig;
  protected readonly buffer: LogEntry[] = [];
  protected flushTimer?: NodeJS.Timeout;

  constructor(config: TransportConfig) {
    this.config = config;
    this.setupBuffering();
  }

  abstract get name(): string;

  abstract shouldHandle(level: LogLevel): boolean;

  abstract write(entry: LogEntry): Promise<void>;

  protected abstract doWrite(entries: LogEntry[]): Promise<void>;

  protected setupBuffering(): void {
    if (this.config.bufferSize && this.config.bufferSize > 1) {
      this.flushTimer = setInterval(
        () => this.flush(),
        this.config.flushInterval || 5000
      );
    }
  }

  protected async bufferWrite(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);

    if (this.buffer.length >= (this.config.bufferSize || 1)) {
      await this.flush();
    }
  }

  protected async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0);
    
    try {
      await this.doWrite(entries);
    } catch (error) {
      // フラッシュに失敗した場合の処理
      console.error(`[${this.name}] Failed to flush logs:`, error);
      
      // 重要なログは別の方法で保存
      const criticalEntries = entries.filter(entry => 
        entry.level === 'ERROR' || entry.category === 'security'
      );
      
      if (criticalEntries.length > 0) {
        await this.handleCriticalLogFailure(criticalEntries);
      }
    }
  }

  protected async handleCriticalLogFailure(entries: LogEntry[]): Promise<void> {
    // ファイルシステムへの緊急書き込み
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const emergencyFile = path.join(
      process.cwd(), 
      'logs', 
      `emergency-${Date.now()}.log`
    );
    
    const content = entries
      .map(entry => JSON.stringify(entry))
      .join('\n');
    
    try {
      await fs.writeFile(emergencyFile, content);
    } catch (error) {
      console.error('Emergency log write failed:', error);
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    await this.flush();
  }
}
```

### 3.2 Elasticsearchトランスポート

```typescript
// src/shared/infrastructure/logging/transports/elasticsearch-transport.ts

import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

export class ElasticsearchTransport extends BaseTransport {
  private client: ElasticsearchClient;
  private indexTemplate: string;

  constructor(config: ElasticsearchConfig) {
    super(config);
    
    this.client = new ElasticsearchClient({
      node: config.endpoint,
      auth: config.auth,
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: true
    });

    this.indexTemplate = config.indexTemplate || 'salary-management-logs-%{+yyyy.MM.dd}';
    this.setupIndexTemplate();
  }

  get name(): string {
    return 'elasticsearch';
  }

  shouldHandle(level: LogLevel): boolean {
    const levels = ['ERROR', 'WARN', 'INFO'];
    return levels.includes(level);
  }

  async write(entry: LogEntry): Promise<void> {
    await this.bufferWrite(entry);
  }

  protected async doWrite(entries: LogEntry[]): Promise<void> {
    const body = entries.flatMap(entry => [
      {
        index: {
          _index: this.getIndexName(entry.timestamp),
          _type: '_doc'
        }
      },
      this.formatForElasticsearch(entry)
    ]);

    await this.client.bulk({
      body,
      refresh: 'wait_for'
    });
  }

  private getIndexName(timestamp: string): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return this.indexTemplate.replace(
      '%{+yyyy.MM.dd}',
      `${year}.${month}.${day}`
    );
  }

  private formatForElasticsearch(entry: LogEntry): any {
    return {
      '@timestamp': entry.timestamp,
      level: entry.level,
      message: entry.message,
      service: entry.service,
      environment: entry.environment,
      module: entry.module,
      category: entry.category,
      requestId: entry.requestId,
      traceId: entry.traceId,
      userId: entry.userId,
      operation: entry.operation,
      data: entry.data,
      error: entry.error,
      performance: entry.performance,
      labels: entry.labels,
      geo: this.extractGeoLocation(entry),
      tags: this.extractTags(entry)
    };
  }

  private extractGeoLocation(entry: LogEntry): any {
    // IPアドレスからジオロケーション情報を抽出
    // 実際の実装では外部サービスを使用
    return {
      country: 'JP',
      region: 'Tokyo',
      city: 'Tokyo'
    };
  }

  private extractTags(entry: LogEntry): string[] {
    const tags: string[] = [];
    
    if (entry.error) tags.push('error');
    if (entry.performance?.duration > 5000) tags.push('slow');
    if (entry.category === 'security') tags.push('security');
    if (entry.userId) tags.push('authenticated');
    
    return tags;
  }

  private async setupIndexTemplate(): Promise<void> {
    const templateName = 'salary-management-logs';
    
    const template = {
      index_patterns: ['salary-management-logs-*'],
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        'index.lifecycle.name': 'salary-management-policy',
        'index.lifecycle.rollover_alias': 'salary-management-logs'
      },
      mappings: {
        properties: {
          '@timestamp': { type: 'date' },
          level: { type: 'keyword' },
          message: { type: 'text', analyzer: 'standard' },
          service: { type: 'keyword' },
          environment: { type: 'keyword' },
          module: { type: 'keyword' },
          category: { type: 'keyword' },
          requestId: { type: 'keyword' },
          traceId: { type: 'keyword' },
          userId: { type: 'keyword' },
          operation: { type: 'keyword' },
          'data.*': { type: 'text', index: false },
          'error.type': { type: 'keyword' },
          'error.message': { type: 'text' },
          'error.stack': { type: 'text', index: false },
          'performance.duration': { type: 'long' },
          'performance.memoryUsage': { type: 'long' },
          'labels.*': { type: 'keyword' },
          'geo.country': { type: 'keyword' },
          'geo.region': { type: 'keyword' },
          'geo.city': { type: 'keyword' },
          tags: { type: 'keyword' }
        }
      }
    };

    try {
      await this.client.indices.putTemplate({
        name: templateName,
        body: template
      });
    } catch (error) {
      console.error('Failed to setup Elasticsearch index template:', error);
    }
  }
}
```

### 3.3 ファイルトランスポート

```typescript
// src/shared/infrastructure/logging/transports/file-transport.ts

import { createWriteStream, WriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

export class FileTransport extends BaseTransport {
  private writeStream?: WriteStream;
  private currentDate: string;
  private fileSize: number = 0;

  constructor(config: FileTransportConfig) {
    super(config);
    this.currentDate = this.getCurrentDate();
    this.setupWriteStream();
  }

  get name(): string {
    return 'file';
  }

  shouldHandle(level: LogLevel): boolean {
    return true; // ファイルには全レベル記録
  }

  async write(entry: LogEntry): Promise<void> {
    await this.checkRotation(entry);
    await this.bufferWrite(entry);
  }

  protected async doWrite(entries: LogEntry[]): Promise<void> {
    if (!this.writeStream) {
      await this.setupWriteStream();
    }

    for (const entry of entries) {
      const logLine = this.formatLogEntry(entry);
      
      return new Promise((resolve, reject) => {
        this.writeStream!.write(logLine + '\n', (error) => {
          if (error) {
            reject(error);
          } else {
            this.fileSize += logLine.length + 1;
            resolve();
          }
        });
      });
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    // 本番環境では JSON 形式、開発環境では可読形式
    if (entry.environment === 'development') {
      return this.formatHumanReadable(entry);
    } else {
      return JSON.stringify(entry);
    }
  }

  private formatHumanReadable(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString('ja-JP');
    const level = entry.level.padEnd(5);
    const module = (entry.module || 'system').padEnd(15);
    
    let formatted = `${timestamp} [${level}] ${module} ${entry.message}`;
    
    if (entry.requestId) {
      formatted += ` (req: ${entry.requestId})`;
    }
    
    if (entry.userId) {
      formatted += ` (user: ${entry.userId})`;
    }

    if (entry.error) {
      formatted += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        formatted += `\n  Stack: ${entry.error.stack}`;
      }
    }

    if (entry.performance) {
      formatted += `\n  Performance: ${entry.performance.duration}ms`;
    }

    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    return formatted;
  }

  private async checkRotation(entry: LogEntry): Promise<void> {
    const entryDate = this.getCurrentDate(new Date(entry.timestamp));
    
    // 日付が変わった場合のローテーション
    if (entryDate !== this.currentDate) {
      await this.rotateByDate();
      this.currentDate = entryDate;
    }
    
    // ファイルサイズによるローテーション
    const maxSize = (this.config as FileTransportConfig).maxSize || 100 * 1024 * 1024; // 100MB
    if (this.fileSize >= maxSize) {
      await this.rotateBySize();
    }
  }

  private async rotateByDate(): Promise<void> {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = undefined;
    }
    
    await this.setupWriteStream();
    this.fileSize = 0;
  }

  private async rotateBySize(): Promise<void> {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = undefined;
    }

    // 既存ファイルをリネーム
    const config = this.config as FileTransportConfig;
    const timestamp = Date.now();
    const rotatedFilename = config.filename.replace('.log', `.${timestamp}.log`);
    
    try {
      const { rename } = await import('fs/promises');
      await rename(config.filename, rotatedFilename);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }

    await this.setupWriteStream();
    this.fileSize = 0;
  }

  private async setupWriteStream(): Promise<void> {
    const config = this.config as FileTransportConfig;
    const filename = this.generateFilename(config.filename);
    
    // ディレクトリが存在しない場合は作成
    await mkdir(dirname(filename), { recursive: true });
    
    this.writeStream = createWriteStream(filename, { flags: 'a' });
    
    this.writeStream.on('error', (error) => {
      console.error('File write stream error:', error);
    });
  }

  private generateFilename(template: string): string {
    return template
      .replace('%DATE%', this.currentDate)
      .replace('%PID%', process.pid.toString());
  }

  private getCurrentDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  async close(): Promise<void> {
    await super.close();
    
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream!.end(() => resolve());
      });
    }
  }
}
```

---

## 4. ログ集約システム設計

### 4.1 ログ集約アーキテクチャ

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  # Elasticsearch クラスター
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: salary-management-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - logging

  # Logstash for log processing
  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    container_name: salary-management-logstash
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
      - ./logs:/usr/share/logstash/logs
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
      - "9600:9600"
    environment:
      LS_JAVA_OPTS: "-Xmx1g -Xms1g"
    depends_on:
      - elasticsearch
    networks:
      - logging

  # Kibana for visualization
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: salary-management-kibana
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - logging

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    container_name: salary-management-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - logging

  # Grafana for dashboard
  grafana:
    image: grafana/grafana:latest
    container_name: salary-management-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      - prometheus
    networks:
      - logging

volumes:
  elasticsearch_data:
  prometheus_data:
  grafana_data:

networks:
  logging:
    driver: bridge
```

### 4.2 Logstash設定

```ruby
# logstash/config/salary-management.conf

input {
  file {
    path => "/usr/share/logstash/logs/*.log"
    start_position => "beginning"
    codec => "json"
    type => "salary-management"
  }
  
  beats {
    port => 5044
  }
}

filter {
  if [type] == "salary-management" {
    # JSON パース
    if [message] =~ /^\{.*\}$/ {
      json {
        source => "message"
      }
    }
    
    # タイムスタンプ処理
    if [timestamp] {
      date {
        match => [ "timestamp", "ISO8601" ]
      }
    }
    
    # ログレベルの正規化
    mutate {
      uppercase => [ "level" ]
    }
    
    # 地理的位置情報の追加（IPアドレスから）
    if [ipAddress] {
      geoip {
        source => "ipAddress"
        target => "geoip"
      }
    }
    
    # エラーの分類
    if [error][type] {
      mutate {
        add_tag => [ "error" ]
        add_field => { "error_category" => "%{[error][type]}" }
      }
    }
    
    # パフォーマンスメトリクスの処理
    if [performance][duration] {
      if [performance][duration] > 5000 {
        mutate {
          add_tag => [ "slow_request" ]
        }
      }
      
      if [performance][duration] > 30000 {
        mutate {
          add_tag => [ "very_slow_request" ]
        }
      }
    }
    
    # セキュリティイベントの分類
    if [category] == "security" {
      mutate {
        add_tag => [ "security_event" ]
      }
      
      if [operation] =~ /login_failed|unauthorized_access|suspicious_activity/ {
        mutate {
          add_tag => [ "security_alert" ]
        }
      }
    }
    
    # ビジネスイベントの分類
    if [category] == "business" {
      mutate {
        add_tag => [ "business_event" ]
      }
      
      if [operation] =~ /salary_slip_created|transaction_created/ {
        mutate {
          add_tag => [ "revenue_event" ]
        }
      }
    }
    
    # 不要なフィールドの削除
    mutate {
      remove_field => [ "host", "path", "@version" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "salary-management-logs-%{+yyyy.MM.dd}"
    template_name => "salary-management"
    template_overwrite => true
    template => "/usr/share/logstash/templates/salary-management-template.json"
  }
  
  # エラーログは別のインデックスにも保存
  if "error" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "salary-management-errors-%{+yyyy.MM.dd}"
    }
  }
  
  # セキュリティアラートは即座に通知
  if "security_alert" in [tags] {
    http {
      url => "http://alert-webhook:8080/security-alert"
      http_method => "post"
      content_type => "application/json"
      format => "json"
    }
  }
  
  stdout { 
    codec => rubydebug { metadata => true }
  }
}
```

### 4.3 Prometheusメトリクス設定

```yaml
# prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'salary-management-app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: /metrics
    scrape_interval: 30s
    
  - job_name: 'elasticsearch'
    static_configs:
      - targets: ['elasticsearch:9200']
    metrics_path: /_prometheus/metrics
    
  - job_name: 'logstash'
    static_configs:
      - targets: ['logstash:9600']
    metrics_path: /_node/stats
```

---

## 5. 実装ガイドライン

### 5.1 アプリケーション統合

```typescript
// src/app.ts - メインアプリケーションでの設定

import { LoggerFactory } from './shared/infrastructure/logging/logger-factory';
import { ContextProvider } from './shared/infrastructure/logging/context-provider';

export class Application {
  private loggerFactory: LoggerFactory;
  private contextProvider: ContextProvider;

  constructor() {
    this.setupLogging();
  }

  private setupLogging(): void {
    this.contextProvider = new ContextProvider();
    this.loggerFactory = LoggerFactory.getInstance();
    
    // Express ミドルウェアとして設定
    this.app.use(this.contextProvider.setupMiddleware());
    
    // エラーハンドリングミドルウェア
    this.app.use(this.setupErrorLogging());
    
    // プロセス終了時のクリーンアップ
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
  }

  private setupErrorLogging() {
    return (error: Error, req: any, res: any, next: any) => {
      const logger = this.loggerFactory.getLogger('app');
      
      logger.error('Unhandled application error', {
        operation: 'error_handling',
        error,
        context: {
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent')
        }
      });

      next(error);
    };
  }

  private async cleanup(): Promise<void> {
    const logger = this.loggerFactory.getLogger('app');
    logger.info('Application shutdown initiated');
    
    // ロガーのクリーンアップ
    await this.loggerFactory.cleanup();
  }
}
```

### 5.2 サービス層での使用例

```typescript
// src/features/salary-slip/application/salary-slip.service.ts

export class SalarySlipService extends BaseService {
  private logger = LoggerFactory.getInstance().getLogger('salary-slip');

  async createFromPdf(
    userId: string, 
    files: PdfFile[]
  ): Promise<SalarySlipCreationResult> {
    
    // 処理開始ログ
    this.logger.info('PDF給料明細の一括処理を開始しました', {
      operation: 'create_from_pdf',
      userId,
      data: {
        fileCount: files.length,
        fileNames: files.map(f => f.name)
      }
    });

    const results: ProcessResult[] = [];
    const startTime = Date.now();

    for (const file of files) {
      try {
        // ファイル処理開始
        this.logger.debug('PDFファイルの解析を開始', {
          operation: 'parse_pdf',
          userId,
          data: {
            fileName: file.name,
            fileSize: file.size
          }
        });

        const result = await this.processSingleFile(userId, file);
        results.push(result);

        // 成功ログ
        this.logger.logBusinessEvent({
          message: 'PDFファイルの解析が完了しました',
          operation: 'pdf_analysis_completed',
          userId,
          data: {
            fileName: file.name,
            salarySlipId: result.salarySlipId,
            confidence: result.confidence
          },
          performance: {
            duration: result.processingTime
          }
        });

      } catch (error) {
        // エラーログ
        this.logger.error('PDFファイルの処理でエラーが発生しました', {
          operation: 'process_pdf_file',
          userId,
          error,
          data: {
            fileName: file.name,
            fileSize: file.size
          }
        });

        results.push({
          fileName: file.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    // 処理完了ログ
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    
    this.logger.info('PDF給料明細の一括処理が完了しました', {
      operation: 'create_from_pdf_completed',
      userId,
      data: {
        totalFiles: files.length,
        successCount,
        failureCount: files.length - successCount
      },
      performance: {
        duration: totalTime,
        throughput: files.length / (totalTime / 1000) // files per second
      }
    });

    return new SalarySlipCreationResult(results);
  }
}
```

---

## 6. 次のステップ

1. ✅ 構造化ログ実装設計 (16-02_structured-logging.md) ← 本書  
2. → 監査ログ詳細設計 (16-03_audit-logging.md)
3. → ログ集約インフラ構築
4. → 監視ダッシュボード作成
5. → パフォーマンステスト実施
6. → 本番デプロイ・運用開始

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| ロギング実装アーキテクト | エキスパートロギング設計アーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | エキスパートロギング設計アーキテクト |
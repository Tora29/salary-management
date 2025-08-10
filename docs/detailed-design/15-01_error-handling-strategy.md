# エラーハンドリング戦略詳細設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: エキスパートエラーハンドリング設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **前提条件**: process-flow-designer、class-design-architect、interface-design-architectの完了

---

## 1. エラーハンドリング設計概要

### 1.1 設計方針

本エラーハンドリング戦略は、SvelteKit 5 + TypeScript + FSDアーキテクチャに基づく給料管理システムの包括的エラーハンドリングを定義します：

| 設計原則 | 実装方法 | 品質保証 |
|---------|----------|----------|
| **予防第一** | 型安全性とバリデーションによる事前防止 | TypeScript + Zod による厳密な型チェック |
| **階層別責務** | FSD各レイヤーでの適切なエラーハンドリング | 明確な責務分離 |
| **ユーザー体験重視** | わかりやすいエラーメッセージと回復手順 | i18n対応のユーザーフレンドリーメッセージ |
| **運用可視化** | 包括的な監視とアラート | Sentry + ログ集約による可観測性 |
| **自動回復** | 可能な限りの自動復旧機構 | リトライ・フェイルオーバー・サーキットブレーカー |

### 1.2 エラーハンドリング階層構造

```
┌─────────────────────────────────────────┐
│           UI Layer (Svelte)             │
│        ・エラーバウンダリ                 │
│        ・ユーザーフィードバック              │
│        ・フォールバックUI                  │
├─────────────────────────────────────────┤
│          Features Layer                 │
│        ・ビジネスロジックエラー              │
│        ・フローコントロール                │
│        ・状態管理エラー                    │
├─────────────────────────────────────────┤
│         Entities Layer                  │
│        ・ドメインバリデーション              │
│        ・ビジネスルール検証                │
│        ・不変条件チェック                  │
├─────────────────────────────────────────┤
│         Shared Layer                    │
│        ・共通エラー型定義                  │
│        ・エラーハンドラー                  │
│        ・回復メカニズム                    │
├─────────────────────────────────────────┤
│      Infrastructure Layer              │
│        ・外部API接続エラー                │
│        ・データベースエラー                │
│        ・ファイル処理エラー                │
└─────────────────────────────────────────┘
```

---

## 2. エラー分類と型定義

### 2.1 基底エラー型構造

```typescript
// src/shared/lib/errors/base-error.ts

/**
 * システム全体の基底エラー型
 */
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  abstract readonly category: ErrorCategory;
  abstract readonly userMessage: string;
  abstract readonly recoverable: boolean;
  
  public readonly timestamp: Date;
  public readonly context: ErrorContext;
  public readonly correlationId: string;

  constructor(
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;
    this.correlationId = context.requestId || generateCorrelationId();
    this.cause = cause;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * エラーの詳細情報を構造化して返却
   */
  public toJSON(): ErrorJSON {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      category: this.category,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      correlationId: this.correlationId,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }
}

/**
 * エラー重要度レベル
 */
export enum ErrorSeverity {
  LOW = 'low',           // 情報レベル
  MEDIUM = 'medium',     // 警告レベル
  HIGH = 'high',         // エラーレベル
  CRITICAL = 'critical'  // 緊急レベル
}

/**
 * エラーカテゴリ分類
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  BUSINESS_RULE = 'business_rule',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  DATABASE = 'database',
  FILE_PROCESSING = 'file_processing',
  EXTERNAL_API = 'external_api',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

/**
 * エラーコンテキスト情報
 */
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * JSON形式エラー情報
 */
export interface ErrorJSON {
  name: string;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  recoverable: boolean;
  timestamp: string;
  context: ErrorContext;
  correlationId: string;
  stack?: string;
  cause?: {
    name: string;
    message: string;
    stack?: string;
  };
}
```

### 2.2 ドメイン特化エラー型

```typescript
// src/shared/lib/errors/domain-errors.ts

/**
 * バリデーションエラー
 */
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.VALIDATION;
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    context?: ErrorContext
  ) {
    super(message, { ...context, field, value });
  }

  get userMessage(): string {
    if (this.field) {
      return `「${this.field}」の入力内容を確認してください: ${this.message}`;
    }
    return `入力内容を確認してください: ${this.message}`;
  }
}

/**
 * 複数バリデーションエラー
 */
export class AggregateValidationError extends BaseError {
  readonly code = 'AGGREGATE_VALIDATION_ERROR';
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.VALIDATION;
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly errors: ValidationError[]
  ) {
    super(message, { errorCount: errors.length });
  }

  get userMessage(): string {
    return `入力内容に問題があります: ${this.errors.length}件のエラーを修正してください`;
  }
}

/**
 * ビジネスルールエラー
 */
export class BusinessRuleError extends BaseError {
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.BUSINESS_RULE;
  readonly recoverable = false;

  constructor(
    public readonly code: string,
    message: string,
    public readonly ruleViolation: string,
    context?: ErrorContext
  ) {
    super(message, { ...context, ruleViolation });
  }

  get userMessage(): string {
    return this.message;
  }
}
```

### 2.3 インフラストラクチャエラー型

```typescript
// src/shared/lib/errors/infrastructure-errors.ts

/**
 * データベース接続エラー
 */
export class DatabaseError extends BaseError {
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.DATABASE;
  readonly recoverable = true;

  constructor(
    public readonly code: string,
    message: string,
    public readonly operation: string,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message, { ...context, operation }, cause);
  }

  get userMessage(): string {
    return 'データの保存に失敗しました。しばらく待ってから再度お試しください。';
  }
}

/**
 * 外部API接続エラー
 */
export class ExternalAPIError extends BaseError {
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.EXTERNAL_API;
  readonly recoverable = true;

  constructor(
    public readonly code: string,
    message: string,
    public readonly apiName: string,
    public readonly statusCode?: number,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message, { ...context, apiName, statusCode }, cause);
  }

  get userMessage(): string {
    return `${this.apiName}との通信に失敗しました。しばらく待ってから再度お試しください。`;
  }
}

/**
 * ファイル処理エラー
 */
export class FileProcessingError extends BaseError {
  readonly severity = ErrorSeverity.MEDIUM;
  readonly category = ErrorCategory.FILE_PROCESSING;
  readonly recoverable = true;

  constructor(
    public readonly code: string,
    message: string,
    public readonly fileName: string,
    public readonly operation: string,
    context?: ErrorContext,
    cause?: Error
  ) {
    super(message, { ...context, fileName, operation }, cause);
  }

  get userMessage(): string {
    switch (this.code) {
      case 'FILE_TOO_LARGE':
        return 'ファイルサイズが大きすぎます。10MB以下のファイルをアップロードしてください。';
      case 'INVALID_FILE_FORMAT':
        return 'サポートされていないファイル形式です。PDFファイルをアップロードしてください。';
      case 'FILE_CORRUPTED':
        return 'ファイルが破損している可能性があります。別のファイルをお試しください。';
      case 'OCR_EXTRACTION_FAILED':
        return 'PDF内容の読み取りに失敗しました。手動でデータを入力してください。';
      default:
        return 'ファイルの処理中にエラーが発生しました。';
    }
  }
}
```

---

## 3. エラー境界（Error Boundaries）設計

### 3.1 Svelteエラー境界コンポーネント

```typescript
// src/shared/ui/error-boundary/ErrorBoundary.svelte

<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { BaseError } from '$lib/errors/base-error';
  import { ErrorReportingService } from '$lib/services/error-reporting.service';
  
  export let fallbackComponent: any = null;
  export let showDetails: boolean = false;
  export let onError: ((error: BaseError) => void) | null = null;
  
  const dispatch = createEventDispatcher<{ error: BaseError }>();
  
  let error: BaseError | null = null;
  let errorInfo: any = null;
  let retryCount: number = 0;
  let maxRetries: number = 3;
  
  const errorReporting = new ErrorReportingService();

  function handleError(event: CustomEvent<BaseError>) {
    const caught = event.detail;
    
    error = caught;
    errorInfo = {
      componentStack: getComponentStack(),
      retryCount,
      timestamp: new Date().toISOString()
    };
    
    // エラーレポート送信
    errorReporting.reportError(caught, {
      context: 'error_boundary',
      componentStack: errorInfo.componentStack,
      retryCount
    });
    
    // カスタムエラーハンドラー実行
    if (onError) {
      onError(caught);
    }
    
    // イベント通知
    dispatch('error', caught);
    
    // 自動回復試行（回復可能エラーのみ）
    if (caught.recoverable && retryCount < maxRetries) {
      setTimeout(() => {
        retry();
      }, Math.pow(2, retryCount) * 1000);
    }
  }
  
  function retry() {
    retryCount++;
    error = null;
    errorInfo = null;
  }
  
  function getComponentStack(): string {
    return 'Component stack trace'; // 実際の実装では適切なスタックトレースを取得
  }
  
  onMount(() => {
    // グローバルエラーハンドラー設定
    window.addEventListener('error', (event) => {
      if (event.error instanceof BaseError) {
        handleError(new CustomEvent('error', { detail: event.error }));
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof BaseError) {
        handleError(new CustomEvent('error', { detail: event.reason }));
      }
    });
  });
</script>

<svelte:window on:error={handleError} />

{#if error}
  <div class="error-boundary">
    {#if fallbackComponent}
      <svelte:component 
        this={fallbackComponent} 
        {error} 
        {errorInfo} 
        {retry}
        canRetry={error.recoverable && retryCount < maxRetries}
      />
    {:else}
      <div class="error-boundary__default">
        <div class="error-boundary__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 22h20L12 2z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v5" stroke="currentColor" stroke-width="2"/>
            <path d="M12 17h.01" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        
        <h2 class="error-boundary__title">エラーが発生しました</h2>
        <p class="error-boundary__message">{error.userMessage}</p>
        
        {#if error.recoverable && retryCount < maxRetries}
          <button 
            class="error-boundary__retry"
            on:click={retry}
            disabled={retryCount >= maxRetries}
          >
            再試行 ({maxRetries - retryCount}回まで可能)
          </button>
        {/if}
        
        <details class="error-boundary__details">
          <summary>技術的な詳細</summary>
          <pre class="error-boundary__technical">
エラーコード: {error.code}
重要度: {error.severity}
カテゴリ: {error.category}
相関ID: {error.correlationId}
発生時刻: {error.timestamp.toLocaleString('ja-JP')}

{#if showDetails}
メッセージ: {error.message}
スタックトレース:
{error.stack}
{/if}
          </pre>
        </details>
      </div>
    {/if}
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background-color: #fef2f2;
  }
  
  .error-boundary__icon {
    color: #dc2626;
    margin-bottom: 1rem;
  }
  
  .error-boundary__title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #dc2626;
    margin-bottom: 0.5rem;
  }
  
  .error-boundary__message {
    color: #374151;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .error-boundary__retry {
    background-color: #dc2626;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 1rem;
  }
  
  .error-boundary__retry:hover {
    background-color: #b91c1c;
  }
  
  .error-boundary__retry:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
  
  .error-boundary__details {
    width: 100%;
    max-width: 600px;
  }
  
  .error-boundary__technical {
    background-color: #f3f4f6;
    padding: 1rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.875rem;
    overflow-x: auto;
  }
</style>
```

### 3.2 レイヤー別エラー境界設定

```typescript
// src/app/providers/error-boundary-provider.ts

/**
 * アプリケーションレベルエラー境界プロバイダー
 */
export class ErrorBoundaryProvider {
  private boundaries: Map<string, ErrorBoundaryConfig> = new Map();

  constructor() {
    this.setupBoundaries();
  }

  private setupBoundaries() {
    // アプリケーションレベル - 最上位
    this.boundaries.set('app', {
      level: 'application',
      fallbackComponent: 'CriticalErrorFallback',
      onError: this.handleCriticalError.bind(this),
      recovery: {
        enabled: true,
        maxRetries: 1,
        fallbackAction: 'reload_page'
      }
    });

    // ページレベル - 各ルート
    this.boundaries.set('page', {
      level: 'page',
      fallbackComponent: 'PageErrorFallback',
      onError: this.handlePageError.bind(this),
      recovery: {
        enabled: true,
        maxRetries: 3,
        fallbackAction: 'navigate_home'
      }
    });

    // 機能レベル - 各機能モジュール
    this.boundaries.set('feature', {
      level: 'feature',
      fallbackComponent: 'FeatureErrorFallback',
      onError: this.handleFeatureError.bind(this),
      recovery: {
        enabled: true,
        maxRetries: 3,
        fallbackAction: 'hide_feature'
      }
    });

    // コンポーネントレベル - 個別コンポーネント
    this.boundaries.set('component', {
      level: 'component',
      fallbackComponent: 'ComponentErrorFallback',
      onError: this.handleComponentError.bind(this),
      recovery: {
        enabled: true,
        maxRetries: 5,
        fallbackAction: 'empty_state'
      }
    });
  }

  private async handleCriticalError(error: BaseError) {
    // 緊急レベルエラー処理
    await this.reportCriticalError(error);
    
    if (error.code === 'AUTHENTICATION_EXPIRED') {
      // 認証切れの場合はログインページにリダイレクト
      window.location.href = '/login';
    } else if (error.code === 'SYSTEM_MAINTENANCE') {
      // メンテナンス画面表示
      window.location.href = '/maintenance';
    }
  }

  private async handlePageError(error: BaseError) {
    // ページレベルエラー処理
    await this.reportPageError(error);
    
    // 特定エラーの場合は自動回復
    if (error.category === ErrorCategory.NETWORK) {
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  private async handleFeatureError(error: BaseError) {
    // 機能レベルエラー処理
    await this.reportFeatureError(error);
    
    // 機能を無効化して他は継続使用可能に
    this.disableFeature(error.context.feature);
  }

  private async handleComponentError(error: BaseError) {
    // コンポーネントレベルエラー処理
    console.warn('Component error caught:', error);
  }

  private async reportCriticalError(error: BaseError) {
    // Sentryへの緊急報告
    // 管理者への即座通知
  }
}

interface ErrorBoundaryConfig {
  level: 'application' | 'page' | 'feature' | 'component';
  fallbackComponent: string;
  onError: (error: BaseError) => void | Promise<void>;
  recovery: {
    enabled: boolean;
    maxRetries: number;
    fallbackAction: string;
  };
}
```

---

## 4. 回復メカニズム設計

### 4.1 自動回復サービス

```typescript
// src/shared/lib/recovery/auto-recovery.service.ts

/**
 * 自動回復サービス
 */
export class AutoRecoveryService {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsService
  ) {
    this.setupRecoveryStrategies();
  }

  private setupRecoveryStrategies() {
    // データベース接続回復
    this.recoveryStrategies.set('DATABASE_CONNECTION', {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 10000,
      recover: async (error, attempt) => {
        this.logger.info('Database connection recovery attempt', { attempt });
        
        // 接続プール再初期化
        await this.reinitializeDatabasePool();
        
        // 接続テスト
        await this.testDatabaseConnection();
        
        return { success: true };
      }
    });

    // 外部API接続回復
    this.recoveryStrategies.set('EXTERNAL_API', {
      maxRetries: 5,
      backoffStrategy: 'exponential_jitter',
      baseDelay: 2000,
      maxDelay: 30000,
      recover: async (error, attempt) => {
        const apiError = error as ExternalAPIError;
        this.logger.info('External API recovery attempt', { 
          api: apiError.apiName,
          attempt 
        });
        
        // サーキットブレーカー状態確認
        const circuitBreaker = this.getCircuitBreaker(apiError.apiName);
        if (circuitBreaker.state === 'OPEN') {
          throw new Error('Circuit breaker is OPEN');
        }
        
        // API健全性チェック
        await this.checkAPIHealth(apiError.apiName);
        
        return { success: true };
      }
    });

    // ファイル処理回復
    this.recoveryStrategies.set('FILE_PROCESSING', {
      maxRetries: 2,
      backoffStrategy: 'fixed',
      baseDelay: 5000,
      recover: async (error, attempt) => {
        const fileError = error as FileProcessingError;
        this.logger.info('File processing recovery attempt', {
          fileName: fileError.fileName,
          operation: fileError.operation,
          attempt
        });
        
        // 一時ファイルクリーンアップ
        await this.cleanupTempFiles();
        
        // メモリクリア
        if (global.gc) {
          global.gc();
        }
        
        return { success: true };
      }
    });
  }

  /**
   * エラーに対する自動回復実行
   */
  public async attemptRecovery(error: BaseError): Promise<RecoveryResult> {
    const strategyKey = this.getStrategyKey(error);
    const strategy = this.recoveryStrategies.get(strategyKey);
    
    if (!strategy || !error.recoverable) {
      return {
        success: false,
        reason: 'No recovery strategy available',
        finalError: error
      };
    }

    let lastError: Error = error;
    
    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        this.logger.info('Recovery attempt started', {
          strategyKey,
          attempt,
          maxRetries: strategy.maxRetries
        });

        // 回復待機時間計算
        const delay = this.calculateDelay(strategy, attempt);
        if (delay > 0) {
          await this.sleep(delay);
        }

        // 回復処理実行
        const result = await strategy.recover(error, attempt);
        
        if (result.success) {
          this.metrics.incrementCounter('recovery_success', {
            strategy: strategyKey,
            attempt: attempt.toString()
          });
          
          this.logger.info('Recovery successful', {
            strategyKey,
            attempt
          });
          
          return {
            success: true,
            attempt,
            strategy: strategyKey
          };
        }
        
      } catch (recoveryError) {
        lastError = recoveryError as Error;
        
        this.logger.warn('Recovery attempt failed', {
          strategyKey,
          attempt,
          error: recoveryError
        });
        
        this.metrics.incrementCounter('recovery_attempt_failed', {
          strategy: strategyKey,
          attempt: attempt.toString()
        });
      }
    }

    // 全回復試行失敗
    this.metrics.incrementCounter('recovery_exhausted', {
      strategy: strategyKey
    });
    
    return {
      success: false,
      reason: 'All recovery attempts exhausted',
      finalError: lastError,
      attemptsUsed: strategy.maxRetries
    };
  }

  private getStrategyKey(error: BaseError): string {
    if (error instanceof DatabaseError) {
      return 'DATABASE_CONNECTION';
    } else if (error instanceof ExternalAPIError) {
      return 'EXTERNAL_API';
    } else if (error instanceof FileProcessingError) {
      return 'FILE_PROCESSING';
    }
    return 'DEFAULT';
  }

  private calculateDelay(strategy: RecoveryStrategy, attempt: number): number {
    switch (strategy.backoffStrategy) {
      case 'fixed':
        return strategy.baseDelay;
        
      case 'linear':
        return strategy.baseDelay * attempt;
        
      case 'exponential':
        return Math.min(
          strategy.baseDelay * Math.pow(2, attempt - 1),
          strategy.maxDelay
        );
        
      case 'exponential_jitter':
        const exponentialDelay = strategy.baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        return Math.min(exponentialDelay + jitter, strategy.maxDelay);
        
      default:
        return strategy.baseDelay;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 回復戦略定義
 */
interface RecoveryStrategy {
  maxRetries: number;
  backoffStrategy: 'fixed' | 'linear' | 'exponential' | 'exponential_jitter';
  baseDelay: number;
  maxDelay?: number;
  recover: (error: BaseError, attempt: number) => Promise<{ success: boolean }>;
}

/**
 * 回復結果
 */
interface RecoveryResult {
  success: boolean;
  attempt?: number;
  strategy?: string;
  reason?: string;
  finalError?: Error;
  attemptsUsed?: number;
}
```

### 4.2 サーキットブレーカー実装

```typescript
// src/shared/lib/circuit-breaker/circuit-breaker.ts

/**
 * サーキットブレーカー実装
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: Date | null = null;
  private successCount: number = 0;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig,
    private readonly logger: Logger,
    private readonly metrics: MetricsService
  ) {}

  /**
   * 保護された処理実行
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        throw new CircuitBreakerOpenError(this.name, this.getTimeUntilRetry());
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        this.logger.info(`Circuit breaker ${this.name} CLOSED`);
        this.metrics.incrementCounter('circuit_breaker_closed', {
          name: this.name
        });
      }
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.successCount = 0;
      this.logger.warn(`Circuit breaker ${this.name} OPENED from HALF_OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.logger.warn(`Circuit breaker ${this.name} OPENED`, {
        failureCount: this.failureCount,
        error: error.message
      });
      this.metrics.incrementCounter('circuit_breaker_opened', {
        name: this.name
      });
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const now = new Date();
    const timeSinceLastFailure = now.getTime() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.timeout;
  }

  private getTimeUntilRetry(): number {
    if (!this.lastFailureTime) return 0;
    
    const now = new Date();
    const timeSinceLastFailure = now.getTime() - this.lastFailureTime.getTime();
    return Math.max(0, this.config.timeout - timeSinceLastFailure);
  }

  public getState(): CircuitBreakerState {
    return this.state;
  }

  public getStats(): CircuitBreakerStats {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime?.toISOString() || null,
      timeUntilRetry: this.getTimeUntilRetry()
    };
  }
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;    // 連続失敗回数の閾値
  successThreshold: number;    // HALF_OPEN時の成功回数閾値
  timeout: number;            // OPEN状態の持続時間（ミリ秒）
}

interface CircuitBreakerStats {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime: string | null;
  timeUntilRetry: number;
}

/**
 * サーキットブレーカーオープンエラー
 */
export class CircuitBreakerOpenError extends BaseError {
  readonly code = 'CIRCUIT_BREAKER_OPEN';
  readonly severity = ErrorSeverity.HIGH;
  readonly category = ErrorCategory.SYSTEM;
  readonly recoverable = true;

  constructor(
    public readonly circuitBreakerName: string,
    public readonly retryAfter: number
  ) {
    super(
      `Circuit breaker ${circuitBreakerName} is OPEN`,
      { circuitBreakerName, retryAfter }
    );
  }

  get userMessage(): string {
    const seconds = Math.ceil(this.retryAfter / 1000);
    return `サービスが一時的に利用できません。${seconds}秒後に再度お試しください。`;
  }
}
```

---

## 5. ユーザーフレンドリーなエラーメッセージ

### 5.1 多言語対応エラーメッセージ

```typescript
// src/shared/lib/i18n/error-messages.ts

/**
 * エラーメッセージの国際化対応
 */
export const errorMessages = {
  ja: {
    // バリデーションエラー
    validation: {
      required: '「{field}」は必須項目です',
      email: '有効なメールアドレスを入力してください',
      minLength: '「{field}」は{min}文字以上で入力してください',
      maxLength: '「{field}」は{max}文字以内で入力してください',
      pattern: '「{field}」の形式が正しくありません',
      numeric: '「{field}」は数値で入力してください',
      date: '有効な日付を入力してください',
      future: '「{field}」は未来の日付は入力できません',
      past: '「{field}」は過去の日付は入力できません'
    },
    
    // 給料明細関連エラー
    salarySlip: {
      duplicate: '同じ期間の給料明細が既に存在します',
      invalidPdf: 'PDFファイルの読み取りに失敗しました',
      lowConfidence: '抽出されたデータの精度が低いです。内容を確認してください',
      fileCorrupted: 'ファイルが破損している可能性があります',
      fileTooBig: 'ファイルサイズは10MB以下にしてください',
      unsupportedFormat: 'PDFファイル以外はサポートしていません'
    },
    
    // 株式ポートフォリオ関連エラー
    portfolio: {
      insufficientShares: '売却数量が保有数量を超えています',
      invalidSymbol: '存在しない銘柄コードです',
      marketClosed: '市場が閉場中のため、リアルタイム価格を取得できません',
      priceNotAvailable: '株価情報の取得に失敗しました'
    },
    
    // システムエラー
    system: {
      networkError: 'ネットワーク接続を確認してください',
      serverError: 'サーバーエラーが発生しました。しばらく待ってから再度お試しください',
      maintenance: 'メンテナンス中です。しばらく待ってからアクセスしてください',
      sessionExpired: 'セッションが期限切れです。再度ログインしてください',
      rateLimitExceeded: 'アクセス制限に達しました。しばらく待ってから再度お試しください',
      serviceUnavailable: 'サービスが一時的に利用できません'
    },
    
    // 回復アクション
    actions: {
      retry: '再試行',
      reload: 'ページを更新',
      login: 'ログイン',
      goHome: 'ホームに戻る',
      contactSupport: 'サポートに連絡',
      checkConnection: 'インターネット接続を確認',
      tryLater: 'しばらく待ってから再度お試し'
    }
  },
  
  en: {
    validation: {
      required: '"{field}" is required',
      email: 'Please enter a valid email address',
      minLength: '"{field}" must be at least {min} characters',
      maxLength: '"{field}" must not exceed {max} characters',
      pattern: '"{field}" format is invalid',
      numeric: '"{field}" must be a number',
      date: 'Please enter a valid date',
      future: '"{field}" cannot be a future date',
      past: '"{field}" cannot be a past date'
    }
    // ... 英語版のメッセージ
  }
};

/**
 * エラーメッセージ取得サービス
 */
export class ErrorMessageService {
  constructor(
    private readonly currentLocale: string = 'ja'
  ) {}

  getMessage(
    category: string,
    key: string,
    params: Record<string, string | number> = {}
  ): string {
    const messages = errorMessages[this.currentLocale as keyof typeof errorMessages];
    if (!messages) return `Error: ${category}.${key}`;
    
    const categoryMessages = messages[category as keyof typeof messages];
    if (!categoryMessages) return `Error: ${category}.${key}`;
    
    let message = categoryMessages[key as keyof typeof categoryMessages] as string;
    if (!message) return `Error: ${category}.${key}`;
    
    // パラメータ置換
    for (const [param, value] of Object.entries(params)) {
      message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }
    
    return message;
  }

  getActionMessage(action: string): string {
    const messages = errorMessages[this.currentLocale as keyof typeof errorMessages];
    return messages.actions[action as keyof typeof messages.actions] || action;
  }
}
```

### 5.2 コンテキストアウェアエラーメッセージ

```typescript
// src/shared/lib/errors/contextual-error-messages.ts

/**
 * コンテキストを考慮したエラーメッセージ生成
 */
export class ContextualErrorMessageService {
  constructor(
    private readonly messageService: ErrorMessageService,
    private readonly logger: Logger
  ) {}

  /**
   * エラーとコンテキストから適切なユーザーメッセージを生成
   */
  public generateUserMessage(
    error: BaseError,
    context: ErrorDisplayContext
  ): ErrorDisplayMessage {
    const baseMessage = this.getBaseMessage(error);
    const actions = this.getSuggestedActions(error, context);
    const severity = this.getDisplaySeverity(error, context);
    
    return {
      title: this.getErrorTitle(error),
      message: baseMessage,
      description: this.getDetailedDescription(error, context),
      severity,
      actions,
      showDetails: context.showTechnicalDetails || false,
      autoHide: severity === 'info' ? 5000 : null,
      context: {
        correlationId: error.correlationId,
        timestamp: error.timestamp,
        canRetry: error.recoverable
      }
    };
  }

  private getBaseMessage(error: BaseError): string {
    if (error instanceof ValidationError) {
      return this.messageService.getMessage('validation', 'required', {
        field: error.field || 'フィールド'
      });
    }
    
    if (error instanceof FileProcessingError) {
      switch (error.code) {
        case 'FILE_TOO_LARGE':
          return this.messageService.getMessage('salarySlip', 'fileTooBig');
        case 'INVALID_FILE_FORMAT':
          return this.messageService.getMessage('salarySlip', 'unsupportedFormat');
        case 'FILE_CORRUPTED':
          return this.messageService.getMessage('salarySlip', 'fileCorrupted');
        default:
          return error.userMessage;
      }
    }
    
    if (error instanceof ExternalAPIError) {
      if (error.apiName.includes('stock')) {
        return this.messageService.getMessage('portfolio', 'priceNotAvailable');
      }
    }
    
    return error.userMessage;
  }

  private getSuggestedActions(
    error: BaseError, 
    context: ErrorDisplayContext
  ): ErrorAction[] {
    const actions: ErrorAction[] = [];
    
    // 基本的な回復アクション
    if (error.recoverable) {
      actions.push({
        type: 'retry',
        label: this.messageService.getActionMessage('retry'),
        primary: true,
        handler: context.onRetry
      });
    }
    
    // エラー種別別のアクション
    if (error instanceof DatabaseError) {
      actions.push({
        type: 'reload',
        label: this.messageService.getActionMessage('reload'),
        handler: () => window.location.reload()
      });
    }
    
    if (error.code === 'AUTHENTICATION_ERROR') {
      actions.push({
        type: 'login',
        label: this.messageService.getActionMessage('login'),
        primary: true,
        handler: () => window.location.href = '/login'
      });
    }
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      actions.push({
        type: 'support',
        label: this.messageService.getActionMessage('contactSupport'),
        handler: context.onContactSupport
      });
    }
    
    // 戻るアクション（常時提供）
    actions.push({
      type: 'dismiss',
      label: '閉じる',
      handler: context.onDismiss
    });
    
    return actions;
  }

  private getDisplaySeverity(error: BaseError, context: ErrorDisplayContext): DisplaySeverity {
    // コンテキストベースで重要度を調整
    if (context.userContext?.isNewUser && error.category === ErrorCategory.VALIDATION) {
      return 'info'; // 新規ユーザーのバリデーションエラーは優しく
    }
    
    if (context.operation === 'background_sync' && error.severity === ErrorSeverity.MEDIUM) {
      return 'warning'; // バックグラウンド処理のエラーは控えめに
    }
    
    // デフォルトマッピング
    switch (error.severity) {
      case ErrorSeverity.LOW: return 'info';
      case ErrorSeverity.MEDIUM: return 'warning';
      case ErrorSeverity.HIGH: return 'error';
      case ErrorSeverity.CRITICAL: return 'critical';
      default: return 'error';
    }
  }
}

/**
 * エラー表示コンテキスト
 */
interface ErrorDisplayContext {
  operation?: string;
  userContext?: {
    isNewUser: boolean;
    userLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  showTechnicalDetails?: boolean;
  onRetry?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
}

/**
 * エラー表示メッセージ
 */
interface ErrorDisplayMessage {
  title: string;
  message: string;
  description?: string;
  severity: DisplaySeverity;
  actions: ErrorAction[];
  showDetails: boolean;
  autoHide: number | null;
  context: {
    correlationId: string;
    timestamp: Date;
    canRetry: boolean;
  };
}

type DisplaySeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorAction {
  type: string;
  label: string;
  primary?: boolean;
  handler?: () => void;
}
```

---

## 6. パフォーマンス考慮事項

### 6.1 エラーハンドリング最適化

```typescript
// src/shared/lib/performance/error-performance.ts

/**
 * エラーハンドリングパフォーマンス最適化
 */
export class ErrorPerformanceOptimizer {
  private errorCache: Map<string, CachedError> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    private readonly config: ErrorPerformanceConfig
  ) {}

  /**
   * エラー処理の最適化実行
   */
  public optimizeErrorHandling(error: BaseError, context: ErrorContext): OptimizedErrorHandling {
    const optimizationKey = this.generateOptimizationKey(error, context);
    
    // 重複エラーの削除
    const isDuplicate = this.checkDuplicateError(optimizationKey, error);
    if (isDuplicate) {
      return { shouldProcess: false, reason: 'duplicate' };
    }
    
    // エラー処理のデバウンス
    if (this.shouldDebounce(error)) {
      return this.debounceErrorHandling(optimizationKey, error, context);
    }
    
    // バッチ処理対象エラー
    if (this.shouldBatch(error)) {
      return this.batchErrorHandling(error, context);
    }
    
    // 即座処理が必要なエラー
    if (this.isUrgentError(error)) {
      return { shouldProcess: true, priority: 'high' };
    }
    
    return { shouldProcess: true, priority: 'normal' };
  }

  /**
   * 重複エラーチェック
   */
  private checkDuplicateError(key: string, error: BaseError): boolean {
    const cached = this.errorCache.get(key);
    
    if (!cached) {
      this.errorCache.set(key, {
        error,
        count: 1,
        firstOccurrence: error.timestamp,
        lastOccurrence: error.timestamp
      });
      return false;
    }
    
    // 同一エラーが短時間に連続発生
    const timeDiff = error.timestamp.getTime() - cached.lastOccurrence.getTime();
    if (timeDiff < this.config.duplicateThreshold) {
      cached.count++;
      cached.lastOccurrence = error.timestamp;
      
      // 一定回数を超えた場合は集約して報告
      if (cached.count >= this.config.maxDuplicates) {
        this.reportAggregatedError(cached);
        this.errorCache.delete(key);
      }
      
      return true;
    }
    
    // 時間が経過していれば新しいエラーとして扱う
    this.errorCache.set(key, {
      error,
      count: 1,
      firstOccurrence: error.timestamp,
      lastOccurrence: error.timestamp
    });
    
    return false;
  }

  /**
   * エラー処理デバウンス
   */
  private debounceErrorHandling(
    key: string, 
    error: BaseError, 
    context: ErrorContext
  ): OptimizedErrorHandling {
    
    // 既存のタイマーをクリア
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // 新しいタイマー設定
    const timer = setTimeout(() => {
      this.processError(error, context);
      this.debounceTimers.delete(key);
    }, this.config.debounceDelay);
    
    this.debounceTimers.set(key, timer);
    
    return { shouldProcess: false, reason: 'debounced' };
  }

  /**
   * バッチエラー処理
   */
  private batchErrorHandling(error: BaseError, context: ErrorContext): OptimizedErrorHandling {
    // バッチ処理キューに追加
    this.addToBatchQueue(error, context);
    
    return { shouldProcess: false, reason: 'batched' };
  }

  private shouldDebounce(error: BaseError): boolean {
    return error.category === ErrorCategory.VALIDATION || 
           error.severity === ErrorSeverity.LOW;
  }

  private shouldBatch(error: BaseError): boolean {
    return error.category === ErrorCategory.FILE_PROCESSING && 
           error.severity === ErrorSeverity.MEDIUM;
  }

  private isUrgentError(error: BaseError): boolean {
    return error.severity === ErrorSeverity.CRITICAL ||
           error.category === ErrorCategory.AUTHENTICATION;
  }

  private generateOptimizationKey(error: BaseError, context: ErrorContext): string {
    return `${error.code}-${context.userId || 'anonymous'}-${context.action || 'unknown'}`;
  }
}

/**
 * エラーキャッシュ情報
 */
interface CachedError {
  error: BaseError;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

/**
 * 最適化設定
 */
interface ErrorPerformanceConfig {
  duplicateThreshold: number;  // 重複判定時間閾値（ms）
  maxDuplicates: number;       // 最大重複許可回数
  debounceDelay: number;       // デバウンス遅延時間（ms）
  batchSize: number;           // バッチ処理サイズ
  batchTimeout: number;        // バッチタイムアウト（ms）
}

/**
 * 最適化結果
 */
interface OptimizedErrorHandling {
  shouldProcess: boolean;
  reason?: string;
  priority?: 'high' | 'normal' | 'low';
}
```

---

## 7. テスト戦略

### 7.1 エラーハンドリングテスト設計

```typescript
// src/shared/lib/testing/error-handling-test.utils.ts

/**
 * エラーハンドリングテストユーティリティ
 */
export class ErrorHandlingTestUtils {
  
  /**
   * エラー発生のモック生成
   */
  public static createMockError<T extends BaseError>(
    ErrorClass: new (...args: any[]) => T,
    overrides: Partial<T> = {}
  ): T {
    const mockError = new ErrorClass('Test error message');
    return Object.assign(mockError, overrides);
  }

  /**
   * エラー境界のテスト
   */
  public static async testErrorBoundary(
    component: any,
    errorTrigger: () => Promise<void>
  ): Promise<ErrorBoundaryTestResult> {
    const errorCaught = new Promise<BaseError>((resolve, reject) => {
      const originalConsoleError = console.error;
      console.error = (error: any) => {
        if (error instanceof BaseError) {
          resolve(error);
        }
        originalConsoleError.call(console, error);
      };
      
      setTimeout(() => {
        console.error = originalConsoleError;
        reject(new Error('No error caught within timeout'));
      }, 5000);
    });

    try {
      await errorTrigger();
      const error = await errorCaught;
      
      return {
        errorCaught: true,
        error,
        fallbackRendered: this.checkFallbackRender(component),
        retryAvailable: error.recoverable
      };
    } catch (testError) {
      return {
        errorCaught: false,
        error: testError as Error,
        fallbackRendered: false,
        retryAvailable: false
      };
    }
  }

  /**
   * 回復メカニズムのテスト
   */
  public static async testRecoveryMechanism(
    recoveryService: AutoRecoveryService,
    error: BaseError,
    expectedAttempts: number
  ): Promise<RecoveryTestResult> {
    const startTime = Date.now();
    
    try {
      const result = await recoveryService.attemptRecovery(error);
      const endTime = Date.now();
      
      return {
        success: result.success,
        attemptsUsed: result.attempt || 0,
        expectedAttempts,
        totalTime: endTime - startTime,
        strategy: result.strategy
      };
    } catch (recoveryError) {
      const endTime = Date.now();
      
      return {
        success: false,
        attemptsUsed: 0,
        expectedAttempts,
        totalTime: endTime - startTime,
        error: recoveryError as Error
      };
    }
  }

  /**
   * エラーメッセージローカリゼーションテスト
   */
  public static testErrorLocalization(
    messageService: ErrorMessageService,
    error: BaseError,
    locales: string[]
  ): LocalizationTestResult[] {
    return locales.map(locale => {
      const originalLocale = messageService['currentLocale'];
      messageService['currentLocale'] = locale;
      
      try {
        const message = messageService.getMessage(
          error.category,
          error.code.toLowerCase()
        );
        
        return {
          locale,
          success: true,
          message,
          isTranslated: message !== error.code
        };
      } catch (error) {
        return {
          locale,
          success: false,
          error: error as Error,
          isTranslated: false
        };
      } finally {
        messageService['currentLocale'] = originalLocale;
      }
    });
  }

  /**
   * エラーパフォーマンステスト
   */
  public static async testErrorPerformance(
    errorGenerator: () => BaseError,
    iterations: number = 1000
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();
    
    const errors: BaseError[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const error = errorGenerator();
      errors.push(error);
      
      // エラー処理実行
      try {
        throw error;
      } catch (e) {
        // エラーキャッチのオーバーヘッド測定
      }
    }
    
    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();
    
    return {
      iterations,
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / iterations,
      memoryUsed: memoryAfter - memoryBefore,
      memoryPerError: (memoryAfter - memoryBefore) / iterations
    };
  }

  private static checkFallbackRender(component: any): boolean {
    // コンポーネントがフォールバック状態になっているかチェック
    // 実際の実装はフレームワーク固有
    return true;
  }

  private static getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    // ブラウザ環境では approximation
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
}

// テスト結果型定義
interface ErrorBoundaryTestResult {
  errorCaught: boolean;
  error: BaseError | Error;
  fallbackRendered: boolean;
  retryAvailable: boolean;
}

interface RecoveryTestResult {
  success: boolean;
  attemptsUsed: number;
  expectedAttempts: number;
  totalTime: number;
  strategy?: string;
  error?: Error;
}

interface LocalizationTestResult {
  locale: string;
  success: boolean;
  message?: string;
  isTranslated: boolean;
  error?: Error;
}

interface PerformanceTestResult {
  iterations: number;
  totalTime: number;
  averageTime: number;
  memoryUsed: number;
  memoryPerError: number;
}
```

---

## 8. 次のステップ

1. ✅ エラーハンドリング戦略総合設計書（本書）
2. → エラー分類体系とレベル定義書（15-02_error-classification.md）
3. → 監視・アラート・運用対応手順書（15-03_monitoring-alerting.md）

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| エラーハンドリング設計アーキテクト | エキスパートエラーハンドリング設計アーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | エキスパートエラーハンドリング設計アーキテクト |
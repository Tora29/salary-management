# 監査ログ設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: エキスパートロギング設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **前提条件**: logging-strategy、structured-logging の完了

---

## 1. 監査ログ概要

### 1.1 監査ログの目的

本システムの監査ログは、以下の目的を達成するために設計されています：

| 目的 | 詳細 | 重要度 |
|------|------|--------|
| **法的コンプライアンス** | 金融データの取り扱いに関する法的要件への対応 | 最高 |
| **セキュリティ監視** | 不正アクセスや疑わしい活動の検知・追跡 | 最高 |
| **データ完全性保証** | データ変更の完全な履歴と責任追跡 | 高 |
| **運用監視** | システム運用状況の把握と問題の早期発見 | 中 |
| **ビジネス分析** | ユーザー行動分析と業務プロセス改善 | 中 |

### 1.2 監査対象イベント分類

```
監査対象イベント
├── データ操作監査
│   ├── 給料明細 CRUD 操作
│   ├── 株式取引データ操作  
│   ├── ユーザー情報変更
│   └── 設定変更
├── セキュリティ監査
│   ├── 認証イベント
│   ├── 認可エラー
│   ├── 権限昇格
│   └── 疑わしい活動
├── システム監査
│   ├── 設定変更
│   ├── バックアップ・復旧
│   ├── メンテナンス作業
│   └── システム異常
└── 外部連携監査
    ├── API 呼び出し
    ├── ファイルインポート/エクスポート
    ├── 外部システム連携
    └── データ同期
```

---

## 2. 監査ログデータモデル

### 2.1 監査ログエンティティ

```typescript
// src/shared/domain/audit/audit-log.entity.ts

export class AuditLog {
  private constructor(
    private readonly _id: EntityId,
    private readonly _timestamp: Date,
    private readonly _userId: EntityId | null,
    private readonly _sessionId: string | null,
    private readonly _requestId: string,
    private readonly _traceId: string | null,
    private readonly _entityType: AuditEntityType,
    private readonly _entityId: string | null,
    private readonly _action: AuditAction,
    private readonly _result: AuditResult,
    private readonly _oldValue: Record<string, any> | null,
    private readonly _newValue: Record<string, any> | null,
    private readonly _reason: string | null,
    private readonly _metadata: AuditMetadata,
    private readonly _integrity: IntegrityInfo
  ) {}

  public static create(props: CreateAuditLogProps): AuditLog {
    const id = EntityId.generate();
    const timestamp = new Date();
    
    const auditLog = new AuditLog(
      id,
      timestamp,
      props.userId,
      props.sessionId,
      props.requestId,
      props.traceId,
      props.entityType,
      props.entityId,
      props.action,
      props.result,
      props.oldValue ? this.sanitizeData(props.oldValue) : null,
      props.newValue ? this.sanitizeData(props.newValue) : null,
      props.reason,
      props.metadata,
      this.generateIntegrity(props)
    );

    return auditLog;
  }

  private static sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private static generateIntegrity(props: CreateAuditLogProps): IntegrityInfo {
    const crypto = require('crypto');
    const content = JSON.stringify({
      userId: props.userId,
      entityType: props.entityType,
      action: props.action,
      oldValue: props.oldValue,
      newValue: props.newValue,
      timestamp: Date.now()
    });
    
    return {
      hash: crypto.createHash('sha256').update(content).digest('hex'),
      signature: crypto.createHmac('sha256', process.env.AUDIT_SIGNING_KEY)
        .update(content).digest('hex'),
      algorithm: 'HMAC-SHA256'
    };
  }

  // ゲッター群
  public get id(): EntityId { return this._id; }
  public get timestamp(): Date { return this._timestamp; }
  public get userId(): EntityId | null { return this._userId; }
  public get sessionId(): string | null { return this._sessionId; }
  public get requestId(): string { return this._requestId; }
  public get traceId(): string | null { return this._traceId; }
  public get entityType(): AuditEntityType { return this._entityType; }
  public get entityId(): string | null { return this._entityId; }
  public get action(): AuditAction { return this._action; }
  public get result(): AuditResult { return this._result; }
  public get oldValue(): Record<string, any> | null { return this._oldValue; }
  public get newValue(): Record<string, any> | null { return this._newValue; }
  public get reason(): string | null { return this._reason; }
  public get metadata(): AuditMetadata { return this._metadata; }
  public get integrity(): IntegrityInfo { return this._integrity; }

  // 整合性検証
  public verifyIntegrity(): boolean {
    const content = JSON.stringify({
      userId: this._userId,
      entityType: this._entityType,
      action: this._action,
      oldValue: this._oldValue,
      newValue: this._newValue,
      timestamp: this._timestamp.getTime()
    });
    
    const crypto = require('crypto');
    const expectedHash = crypto.createHash('sha256').update(content).digest('hex');
    const expectedSignature = crypto.createHmac('sha256', process.env.AUDIT_SIGNING_KEY)
      .update(content).digest('hex');
    
    return this._integrity.hash === expectedHash && 
           this._integrity.signature === expectedSignature;
  }
}

// 列挙型定義
export enum AuditEntityType {
  USER = 'user',
  SALARY_SLIP = 'salary_slip',
  STOCK_TRANSACTION = 'stock_transaction',
  STOCK_PORTFOLIO = 'stock_portfolio',
  USER_PREFERENCES = 'user_preferences',
  SYSTEM_CONFIG = 'system_config',
  FILE_UPLOAD = 'file_upload',
  API_KEY = 'api_key',
  SESSION = 'session'
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOCK = 'LOCK',
  UNLOCK = 'UNLOCK',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE'
}

export enum AuditResult {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED'
}

// 関連インターフェース
interface AuditMetadata {
  ipAddress: string;
  userAgent: string;
  source: 'web' | 'mobile' | 'api' | 'system';
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
  deviceInfo?: {
    platform: string;
    browser: string;
    version: string;
  };
  businessContext?: {
    department: string;
    role: string;
    accessLevel: string;
  };
}

interface IntegrityInfo {
  hash: string;
  signature: string;
  algorithm: string;
}

interface CreateAuditLogProps {
  userId: EntityId | null;
  sessionId?: string;
  requestId: string;
  traceId?: string;
  entityType: AuditEntityType;
  entityId?: string;
  action: AuditAction;
  result: AuditResult;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  reason?: string;
  metadata: AuditMetadata;
}
```

---

## 3. 監査ログサービス実装

### 3.1 監査ロガー実装

```typescript
// src/shared/infrastructure/audit/audit-logger.service.ts

import { Injectable } from '@nestjs/common';
import { AuditLog, AuditEntityType, AuditAction, AuditResult } from '../../domain/audit/audit-log.entity';
import { AuditLogRepository } from '../../domain/audit/audit-log.repository';
import { ContextProvider } from '../logging/context-provider';
import { CryptoService } from '../security/crypto.service';

@Injectable()
export class AuditLoggerService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly contextProvider: ContextProvider,
    private readonly cryptoService: CryptoService
  ) {}

  async logDataAccess(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const context = this.contextProvider.getContext();
    
    const auditLog = AuditLog.create({
      userId: context.userId ? EntityId.from(context.userId) : null,
      sessionId: context.sessionId,
      requestId: context.requestId,
      traceId: context.traceId,
      entityType,
      entityId,
      action,
      result: AuditResult.SUCCESS,
      metadata: {
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        source: this.determineSource(context),
        ...this.extractGeolocation(context.ipAddress),
        ...additionalData
      }
    });

    await this.auditLogRepository.save(auditLog);
  }

  async logDataModification(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    reason?: string
  ): Promise<void> {
    const context = this.contextProvider.getContext();
    
    const auditLog = AuditLog.create({
      userId: context.userId ? EntityId.from(context.userId) : null,
      sessionId: context.sessionId,
      requestId: context.requestId,
      traceId: context.traceId,
      entityType,
      entityId,
      action,
      result: AuditResult.SUCCESS,
      oldValue,
      newValue,
      reason,
      metadata: {
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        source: this.determineSource(context),
        businessContext: await this.getBusinessContext(context.userId)
      }
    });

    await this.auditLogRepository.save(auditLog);
    
    // 重要な変更の場合は即座に通知
    if (this.isHighImpactChange(entityType, action)) {
      await this.notifyHighImpactChange(auditLog);
    }
  }

  async logSecurityEvent(
    action: AuditAction,
    result: AuditResult,
    entityType: AuditEntityType = AuditEntityType.SESSION,
    entityId?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const context = this.contextProvider.getContext();
    
    const auditLog = AuditLog.create({
      userId: context.userId ? EntityId.from(context.userId) : null,
      sessionId: context.sessionId,
      requestId: context.requestId,
      traceId: context.traceId,
      entityType,
      entityId,
      action,
      result,
      metadata: {
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent || 'unknown',
        source: this.determineSource(context),
        geolocation: this.extractGeolocation(context.ipAddress),
        deviceInfo: this.extractDeviceInfo(context.userAgent),
        ...additionalData
      }
    });

    await this.auditLogRepository.save(auditLog);
    
    // セキュリティイベントは常に監視チームに通知
    await this.notifySecurityTeam(auditLog);
  }

  async logSystemEvent(
    entityType: AuditEntityType,
    action: AuditAction,
    result: AuditResult,
    description: string,
    systemData?: Record<string, any>
  ): Promise<void> {
    const auditLog = AuditLog.create({
      userId: null, // システムイベントはユーザーなし
      sessionId: null,
      requestId: 'system_' + Date.now(),
      traceId: null,
      entityType,
      entityId: null,
      action,
      result,
      reason: description,
      metadata: {
        ipAddress: 'system',
        userAgent: 'system',
        source: 'system',
        ...systemData
      }
    });

    await this.auditLogRepository.save(auditLog);
  }

  private determineSource(context: any): 'web' | 'mobile' | 'api' | 'system' {
    if (!context.userAgent) return 'system';
    
    const userAgent = context.userAgent.toLowerCase();
    
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return 'mobile';
    }
    
    if (context.path?.startsWith('/api/')) {
      return 'api';
    }
    
    return 'web';
  }

  private extractGeolocation(ipAddress?: string): { geolocation?: any } {
    if (!ipAddress || ipAddress === 'unknown') return {};
    
    // 実際の実装では IP ジオロケーションサービスを使用
    // ここでは簡略化
    return {
      geolocation: {
        country: 'JP',
        region: 'Tokyo',
        city: 'Tokyo'
      }
    };
  }

  private extractDeviceInfo(userAgent?: string): { deviceInfo?: any } {
    if (!userAgent) return {};
    
    // 実際の実装では User-Agent パーサーライブラリを使用
    return {
      deviceInfo: {
        platform: 'web',
        browser: 'chrome',
        version: '91.0'
      }
    };
  }

  private async getBusinessContext(userId?: string): Promise<{ businessContext?: any }> {
    if (!userId) return {};
    
    // 実際の実装では UserService から情報を取得
    return {
      businessContext: {
        department: 'finance',
        role: 'user',
        accessLevel: 'standard'
      }
    };
  }

  private isHighImpactChange(entityType: AuditEntityType, action: AuditAction): boolean {
    const highImpactCombinations = [
      { type: AuditEntityType.SALARY_SLIP, action: AuditAction.DELETE },
      { type: AuditEntityType.STOCK_TRANSACTION, action: AuditAction.DELETE },
      { type: AuditEntityType.USER, action: AuditAction.DELETE },
      { type: AuditEntityType.SYSTEM_CONFIG, action: AuditAction.UPDATE },
    ];
    
    return highImpactCombinations.some(combo => 
      combo.type === entityType && combo.action === action
    );
  }

  private async notifyHighImpactChange(auditLog: AuditLog): Promise<void> {
    // 重要な変更の通知実装
    // Slack、メール、Webhook等への通知
    console.log('High impact change detected:', auditLog.id);
  }

  private async notifySecurityTeam(auditLog: AuditLog): Promise<void> {
    // セキュリティチームへの通知実装
    console.log('Security event logged:', auditLog.id);
  }
}
```

### 3.2 監査ログインターセプター

```typescript
// src/shared/infrastructure/audit/audit.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLoggerService } from './audit-logger.service';
import { AuditEntityType, AuditAction, AuditResult } from '../../domain/audit/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogger: AuditLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const auditInfo = this.extractAuditInfo(request);
    
    if (!auditInfo) {
      return next.handle();
    }

    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(async (response) => {
        // 成功時の監査ログ
        await this.auditLogger.logDataAccess(
          auditInfo.entityType,
          auditInfo.entityId || 'unknown',
          auditInfo.action,
          {
            responseTime: Date.now() - startTime,
            responseSize: this.calculateResponseSize(response),
            httpMethod: request.method,
            path: request.path,
            statusCode: 200
          }
        );
      }),
      catchError(async (error) => {
        // エラー時の監査ログ
        await this.auditLogger.logDataAccess(
          auditInfo.entityType,
          auditInfo.entityId || 'unknown',
          auditInfo.action,
          {
            error: {
              name: error.name,
              message: error.message,
              statusCode: error.status || 500
            },
            responseTime: Date.now() - startTime,
            httpMethod: request.method,
            path: request.path
          }
        );
        
        throw error;
      })
    );
  }

  private extractAuditInfo(request: any): AuditInfo | null {
    const path = request.path;
    const method = request.method;
    
    // パスベースの監査対象判定
    if (path.includes('/salary-slips')) {
      return {
        entityType: AuditEntityType.SALARY_SLIP,
        entityId: this.extractEntityId(path),
        action: this.mapHttpMethodToAction(method)
      };
    }
    
    if (path.includes('/portfolio') || path.includes('/transactions')) {
      return {
        entityType: AuditEntityType.STOCK_TRANSACTION,
        entityId: this.extractEntityId(path),
        action: this.mapHttpMethodToAction(method)
      };
    }
    
    if (path.includes('/users')) {
      return {
        entityType: AuditEntityType.USER,
        entityId: this.extractEntityId(path),
        action: this.mapHttpMethodToAction(method)
      };
    }
    
    return null;
  }

  private extractEntityId(path: string): string | null {
    const matches = path.match(/\/([a-zA-Z0-9_-]+)(?:\/[^\/]*)*$/);
    return matches ? matches[1] : null;
  }

  private mapHttpMethodToAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'GET':
        return AuditAction.READ;
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.READ;
    }
  }

  private calculateResponseSize(response: any): number {
    if (!response) return 0;
    return JSON.stringify(response).length;
  }
}

interface AuditInfo {
  entityType: AuditEntityType;
  entityId: string | null;
  action: AuditAction;
}
```

---

## 4. セキュリティイベント監査

### 4.1 セキュリティイベント定義

```typescript
// src/shared/domain/audit/security-event.ts

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  MALICIOUS_FILE_UPLOAD = 'MALICIOUS_FILE_UPLOAD',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  description: string;
  evidence?: Record<string, any>;
  mitigation?: string;
  timestamp: Date;
}
```

### 4.2 セキュリティ監査実装

```typescript
// src/shared/infrastructure/audit/security-audit.service.ts

@Injectable()
export class SecurityAuditService {
  constructor(
    private readonly auditLogger: AuditLoggerService,
    private readonly alertService: AlertService,
    private readonly riskAssessment: RiskAssessmentService
  ) {}

  async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string
  ): Promise<void> {
    const eventType = success ? SecurityEventType.LOGIN_SUCCESS : SecurityEventType.LOGIN_FAILED;
    const severity = success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM;
    
    const securityEvent: SecurityEvent = {
      type: eventType,
      severity,
      userId,
      ipAddress,
      userAgent,
      description: `Login attempt for email ${this.maskEmail(email)}`,
      evidence: {
        email: this.maskEmail(email),
        timestamp: new Date().toISOString(),
        geoLocation: await this.getGeoLocation(ipAddress)
      },
      timestamp: new Date()
    };

    await this.auditLogger.logSecurityEvent(
      success ? AuditAction.LOGIN : AuditAction.LOGIN,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      AuditEntityType.SESSION,
      userId,
      securityEvent
    );

    // 連続失敗の監視
    if (!success) {
      await this.checkBruteForce(email, ipAddress);
    }

    // 異常な時間帯のログインチェック
    if (success) {
      await this.checkUnusualLoginTime(userId, ipAddress);
    }
  }

  async logUnauthorizedAccess(
    resource: string,
    action: string,
    userId?: string,
    ipAddress?: string,
    reason?: string
  ): Promise<void> {
    const securityEvent: SecurityEvent = {
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      severity: SecuritySeverity.HIGH,
      userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: 'unknown',
      description: `Unauthorized access attempt to ${resource}`,
      evidence: {
        resource,
        action,
        reason,
        timestamp: new Date().toISOString()
      },
      mitigation: 'Access denied, user session reviewed',
      timestamp: new Date()
    };

    await this.auditLogger.logSecurityEvent(
      AuditAction.READ,
      AuditResult.FAILURE,
      AuditEntityType.USER,
      userId,
      securityEvent
    );

    // 高リスクイベントとして即座に通知
    await this.alertService.sendSecurityAlert(securityEvent);
  }

  async logSuspiciousActivity(
    activityType: string,
    description: string,
    evidence: Record<string, any>,
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    const riskLevel = await this.riskAssessment.assessRisk(evidence);
    
    const securityEvent: SecurityEvent = {
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: this.mapRiskToSeverity(riskLevel),
      userId,
      ipAddress: ipAddress || 'unknown',
      userAgent: evidence.userAgent || 'unknown',
      description,
      evidence: {
        ...evidence,
        riskLevel,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    await this.auditLogger.logSecurityEvent(
      AuditAction.READ,
      AuditResult.FAILURE,
      AuditEntityType.USER,
      userId,
      securityEvent
    );

    // リスクレベルに応じた対応
    if (riskLevel >= 7) {
      await this.alertService.sendCriticalAlert(securityEvent);
      // 必要に応じてセッションを無効化
      if (userId) {
        await this.invalidateUserSessions(userId);
      }
    }
  }

  async logDataAccess(
    entityType: string,
    entityId: string,
    action: string,
    userId: string,
    sensitiveData?: boolean
  ): Promise<void> {
    if (sensitiveData) {
      const securityEvent: SecurityEvent = {
        type: SecurityEventType.DATA_BREACH_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        userId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        description: `Access to sensitive ${entityType} data`,
        evidence: {
          entityType,
          entityId: this.maskEntityId(entityId),
          action,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };

      await this.auditLogger.logSecurityEvent(
        this.mapStringToAuditAction(action),
        AuditResult.SUCCESS,
        this.mapStringToEntityType(entityType),
        entityId,
        securityEvent
      );
    }
  }

  private async checkBruteForce(email: string, ipAddress: string): Promise<void> {
    const recentFailures = await this.auditLogger.countRecentFailures(email, ipAddress, 900); // 15分
    
    if (recentFailures >= 5) {
      const securityEvent: SecurityEvent = {
        type: SecurityEventType.BRUTE_FORCE_DETECTED,
        severity: SecuritySeverity.CRITICAL,
        ipAddress,
        userAgent: 'unknown',
        description: `Brute force attack detected for ${this.maskEmail(email)}`,
        evidence: {
          email: this.maskEmail(email),
          failureCount: recentFailures,
          timeWindow: '15 minutes',
          timestamp: new Date().toISOString()
        },
        mitigation: 'IP blocked, account locked',
        timestamp: new Date()
      };

      await this.auditLogger.logSecurityEvent(
        AuditAction.LOGIN,
        AuditResult.FAILURE,
        AuditEntityType.SESSION,
        undefined,
        securityEvent
      );

      // IPブロックとアカウントロック
      await this.blockIP(ipAddress);
      await this.lockAccount(email);
      await this.alertService.sendCriticalAlert(securityEvent);
    }
  }

  private async checkUnusualLoginTime(userId: string, ipAddress: string): Promise<void> {
    const hour = new Date().getHours();
    
    // 深夜（23時〜6時）のログインを監視
    if (hour >= 23 || hour <= 6) {
      const securityEvent: SecurityEvent = {
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        severity: SecuritySeverity.MEDIUM,
        userId,
        ipAddress,
        userAgent: 'unknown',
        description: 'Login during unusual hours',
        evidence: {
          loginTime: new Date().toISOString(),
          hour,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      };

      await this.auditLogger.logSecurityEvent(
        AuditAction.LOGIN,
        AuditResult.SUCCESS,
        AuditEntityType.SESSION,
        userId,
        securityEvent
      );
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  private maskEntityId(entityId: string): string {
    if (entityId.length <= 4) return '****';
    return entityId.substring(0, 2) + '*'.repeat(entityId.length - 4) + entityId.substring(entityId.length - 2);
  }

  private mapRiskToSeverity(riskLevel: number): SecuritySeverity {
    if (riskLevel >= 8) return SecuritySeverity.CRITICAL;
    if (riskLevel >= 6) return SecuritySeverity.HIGH;
    if (riskLevel >= 4) return SecuritySeverity.MEDIUM;
    return SecuritySeverity.LOW;
  }

  private mapStringToAuditAction(action: string): AuditAction {
    switch (action.toUpperCase()) {
      case 'CREATE': return AuditAction.CREATE;
      case 'READ': return AuditAction.READ;
      case 'UPDATE': return AuditAction.UPDATE;
      case 'DELETE': return AuditAction.DELETE;
      default: return AuditAction.READ;
    }
  }

  private mapStringToEntityType(entityType: string): AuditEntityType {
    switch (entityType.toLowerCase()) {
      case 'user': return AuditEntityType.USER;
      case 'salary_slip': return AuditEntityType.SALARY_SLIP;
      case 'stock_transaction': return AuditEntityType.STOCK_TRANSACTION;
      default: return AuditEntityType.USER;
    }
  }

  private async getGeoLocation(ipAddress: string): Promise<any> {
    // 実際の実装では IP ジオロケーションサービスを使用
    return { country: 'JP', region: 'Tokyo', city: 'Tokyo' };
  }

  private async blockIP(ipAddress: string): Promise<void> {
    // IP ブロック実装
    console.log(`Blocking IP: ${ipAddress}`);
  }

  private async lockAccount(email: string): Promise<void> {
    // アカウントロック実装
    console.log(`Locking account: ${this.maskEmail(email)}`);
  }

  private async invalidateUserSessions(userId: string): Promise<void> {
    // ユーザーセッション無効化実装
    console.log(`Invalidating sessions for user: ${userId}`);
  }
}
```

---

## 5. 法的コンプライアンス対応

### 5.1 データ保護法対応

```typescript
// src/shared/infrastructure/audit/compliance.service.ts

@Injectable()
export class ComplianceService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly dataRetentionService: DataRetentionService,
    private readonly encryptionService: EncryptionService
  ) {}

  // GDPR Article 30 - 処理活動の記録
  async generateProcessingActivityRecord(): Promise<ProcessingActivityRecord> {
    const auditLogs = await this.auditLogRepository.findByDateRange(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90日前
      new Date()
    );

    return {
      controller: {
        name: 'Salary Management System',
        contact: 'dpo@company.com'
      },
      purposes: [
        'Salary data management',
        'Stock portfolio tracking',
        'User authentication and authorization'
      ],
      categories: {
        dataSubjects: ['Employees', 'System administrators'],
        personalData: ['Email addresses', 'Employment information', 'Financial data'],
        recipients: ['Internal staff', 'Auditors']
      },
      retentionPeriods: {
        auditLogs: '10 years',
        personalData: '5 years after employment termination',
        financialData: '7 years'
      },
      technicalMeasures: [
        'Encryption at rest',
        'Encryption in transit',
        'Access controls',
        'Audit logging',
        'Regular security assessments'
      ],
      dataTransfers: 'No international transfers',
      processingActivities: this.summarizeProcessingActivities(auditLogs)
    };
  }

  // データ主体の権利対応
  async handleDataSubjectRequest(
    requestType: DataSubjectRightType,
    userId: string,
    requesterInfo: RequesterInfo
  ): Promise<DataSubjectResponse> {
    // リクエストを監査ログに記録
    await this.auditLogRepository.save(
      AuditLog.create({
        userId: EntityId.from(userId),
        requestId: requesterInfo.requestId,
        entityType: AuditEntityType.USER,
        entityId: userId,
        action: AuditAction.READ,
        result: AuditResult.SUCCESS,
        reason: `Data subject right request: ${requestType}`,
        metadata: {
          ipAddress: requesterInfo.ipAddress,
          userAgent: requesterInfo.userAgent,
          source: 'web'
        }
      })
    );

    switch (requestType) {
      case DataSubjectRightType.ACCESS:
        return await this.handleAccessRequest(userId);
      
      case DataSubjectRightType.RECTIFICATION:
        return await this.handleRectificationRequest(userId, requesterInfo.correctionData);
      
      case DataSubjectRightType.ERASURE:
        return await this.handleErasureRequest(userId);
      
      case DataSubjectRightType.PORTABILITY:
        return await this.handlePortabilityRequest(userId);
      
      case DataSubjectRightType.RESTRICTION:
        return await this.handleRestrictionRequest(userId);
      
      default:
        throw new Error(`Unsupported request type: ${requestType}`);
    }
  }

  private async handleAccessRequest(userId: string): Promise<DataSubjectResponse> {
    const userData = await this.collectUserData(userId);
    const auditTrail = await this.auditLogRepository.findByUserId(userId);
    
    return {
      type: DataSubjectRightType.ACCESS,
      data: {
        personalData: userData,
        auditTrail: auditTrail.map(log => ({
          timestamp: log.timestamp,
          action: log.action,
          entityType: log.entityType,
          result: log.result,
          ipAddress: log.metadata.ipAddress
        })),
        dataRetentionInfo: await this.getRetentionInfo(userId)
      },
      completedAt: new Date(),
      format: 'JSON'
    };
  }

  private async handleErasureRequest(userId: string): Promise<DataSubjectResponse> {
    // 削除前の確認
    const legalBasisCheck = await this.checkLegalBasisForRetention(userId);
    
    if (legalBasisCheck.hasLegalBasis) {
      return {
        type: DataSubjectRightType.ERASURE,
        declined: true,
        reason: legalBasisCheck.reasons.join(', '),
        completedAt: new Date()
      };
    }

    // 段階的削除の実行
    await this.performErasure(userId);
    
    return {
      type: DataSubjectRightType.ERASURE,
      data: {
        deletedEntities: ['user_profile', 'salary_slips', 'stock_transactions'],
        retainedLogs: 'Audit logs retained for legal compliance',
        anonymizationDate: new Date()
      },
      completedAt: new Date()
    };
  }

  // 法的根拠の確認
  private async checkLegalBasisForRetention(userId: string): Promise<LegalBasisCheck> {
    const reasons: string[] = [];
    
    // 税務記録の保持義務確認
    const hasFinancialRecords = await this.hasRecentFinancialRecords(userId);
    if (hasFinancialRecords) {
      reasons.push('Tax record retention obligation (7 years)');
    }
    
    // 労働法上の記録保持義務
    const hasEmploymentRecords = await this.hasEmploymentRecords(userId);
    if (hasEmploymentRecords) {
      reasons.push('Employment record retention obligation (5 years)');
    }
    
    // 進行中の法的手続き
    const hasLegalProceedings = await this.hasOngoingLegalProceedings(userId);
    if (hasLegalProceedings) {
      reasons.push('Ongoing legal proceedings');
    }

    return {
      hasLegalBasis: reasons.length > 0,
      reasons
    };
  }

  // データ保持ポリシー管理
  async enforceRetentionPolicy(): Promise<RetentionEnforcementResult> {
    const policies = await this.getRetentionPolicies();
    const results: RetentionEnforcementResult = {
      policies: policies.length,
      itemsReviewed: 0,
      itemsArchived: 0,
      itemsDeleted: 0,
      errors: []
    };

    for (const policy of policies) {
      try {
        const policyResult = await this.enforcePolicy(policy);
        results.itemsReviewed += policyResult.reviewed;
        results.itemsArchived += policyResult.archived;
        results.itemsDeleted += policyResult.deleted;
      } catch (error) {
        results.errors.push({
          policy: policy.name,
          error: error.message
        });
      }
    }

    // 保持ポリシー実行の監査ログ
    await this.auditLogRepository.save(
      AuditLog.create({
        userId: null,
        requestId: 'system_retention_' + Date.now(),
        entityType: AuditEntityType.SYSTEM_CONFIG,
        entityId: 'retention_policy',
        action: AuditAction.UPDATE,
        result: results.errors.length === 0 ? AuditResult.SUCCESS : AuditResult.PARTIAL,
        reason: 'Automated retention policy enforcement',
        metadata: {
          ipAddress: 'system',
          userAgent: 'system',
          source: 'system',
          executionResults: results
        }
      })
    );

    return results;
  }

  private summarizeProcessingActivities(auditLogs: AuditLog[]): ProcessingSummary {
    const activities = auditLogs.reduce((acc, log) => {
      const key = `${log.entityType}_${log.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActivities: auditLogs.length,
      byType: activities,
      period: {
        start: auditLogs[0]?.timestamp,
        end: auditLogs[auditLogs.length - 1]?.timestamp
      }
    };
  }

  private async collectUserData(userId: string): Promise<Record<string, any>> {
    // 実際の実装では各サービスからデータを収集
    return {
      profile: {}, 
      salarySlips: [],
      stockTransactions: [],
      preferences: {}
    };
  }

  private async performErasure(userId: string): Promise<void> {
    // 実際の削除実装
    // 1. 個人データの削除
    // 2. 監査ログの匿名化
    // 3. バックアップからの削除スケジュール
  }
}

// 型定義
enum DataSubjectRightType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification', 
  ERASURE = 'erasure',
  RESTRICTION = 'restriction',
  PORTABILITY = 'portability',
  OBJECTION = 'objection'
}

interface ProcessingActivityRecord {
  controller: {
    name: string;
    contact: string;
  };
  purposes: string[];
  categories: {
    dataSubjects: string[];
    personalData: string[];
    recipients: string[];
  };
  retentionPeriods: Record<string, string>;
  technicalMeasures: string[];
  dataTransfers: string;
  processingActivities: ProcessingSummary;
}

interface DataSubjectResponse {
  type: DataSubjectRightType;
  data?: any;
  declined?: boolean;
  reason?: string;
  completedAt: Date;
  format?: string;
}

interface LegalBasisCheck {
  hasLegalBasis: boolean;
  reasons: string[];
}

interface RetentionEnforcementResult {
  policies: number;
  itemsReviewed: number;
  itemsArchived: number;
  itemsDeleted: number;
  errors: Array<{ policy: string; error: string }>;
}
```

---

## 6. 監査ログレポート生成

### 6.1 監査レポート生成サービス

```typescript
// src/shared/infrastructure/audit/audit-report.service.ts

@Injectable()
export class AuditReportService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly reportGenerator: ReportGenerator,
    private readonly pdfService: PdfService
  ) {}

  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    reportType: ComplianceReportType
  ): Promise<ComplianceReport> {
    const auditLogs = await this.auditLogRepository.findByDateRange(startDate, endDate);
    
    switch (reportType) {
      case ComplianceReportType.SOX:
        return await this.generateSOXReport(auditLogs, startDate, endDate);
      
      case ComplianceReportType.GDPR:
        return await this.generateGDPRReport(auditLogs, startDate, endDate);
      
      case ComplianceReportType.INTERNAL_AUDIT:
        return await this.generateInternalAuditReport(auditLogs, startDate, endDate);
      
      case ComplianceReportType.SECURITY:
        return await this.generateSecurityReport(auditLogs, startDate, endDate);
      
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async generateSOXReport(
    auditLogs: AuditLog[],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const financialDataAccess = auditLogs.filter(log => 
      log.entityType === AuditEntityType.SALARY_SLIP ||
      log.entityType === AuditEntityType.STOCK_TRANSACTION
    );

    const privilegedOperations = auditLogs.filter(log =>
      log.action === AuditAction.DELETE ||
      log.action === AuditAction.UPDATE
    );

    const controlsReview = {
      segregationOfDuties: this.reviewSegregationOfDuties(auditLogs),
      authorizationControls: this.reviewAuthorizationControls(auditLogs),
      changeManagement: this.reviewChangeManagement(auditLogs),
      dataIntegrity: this.reviewDataIntegrity(auditLogs)
    };

    return {
      type: ComplianceReportType.SOX,
      period: { start: startDate, end: endDate },
      summary: {
        totalEvents: auditLogs.length,
        financialDataAccess: financialDataAccess.length,
        privilegedOperations: privilegedOperations.length,
        controlEffectiveness: this.calculateControlEffectiveness(controlsReview)
      },
      findings: this.generateSOXFindings(controlsReview),
      recommendations: this.generateSOXRecommendations(controlsReview),
      attachments: [
        {
          name: 'Detailed Audit Trail',
          type: 'CSV',
          content: this.generateAuditTrailCSV(auditLogs)
        }
      ],
      certifications: {
        preparedBy: 'System Administrator',
        reviewedBy: 'Internal Auditor',
        approvedBy: 'Chief Financial Officer'
      }
    };
  }

  private async generateSecurityReport(
    auditLogs: AuditLog[],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const securityEvents = auditLogs.filter(log => 
      log.metadata.category === 'security'
    );

    const authenticationEvents = securityEvents.filter(log =>
      log.action === AuditAction.LOGIN || log.action === AuditAction.LOGOUT
    );

    const unauthorizedAccess = securityEvents.filter(log =>
      log.result === AuditResult.FAILURE &&
      log.reason?.includes('unauthorized')
    );

    const riskAnalysis = {
      highRiskEvents: this.identifyHighRiskEvents(securityEvents),
      trendAnalysis: this.analyzeTrends(securityEvents),
      threatAssessment: this.assessThreats(securityEvents)
    };

    return {
      type: ComplianceReportType.SECURITY,
      period: { start: startDate, end: endDate },
      summary: {
        totalSecurityEvents: securityEvents.length,
        authenticationEvents: authenticationEvents.length,
        unauthorizedAccessAttempts: unauthorizedAccess.length,
        riskScore: riskAnalysis.overallRiskScore
      },
      findings: this.generateSecurityFindings(riskAnalysis),
      recommendations: this.generateSecurityRecommendations(riskAnalysis),
      attachments: [
        {
          name: 'Security Event Details',
          type: 'JSON',
          content: JSON.stringify(securityEvents, null, 2)
        }
      ],
      certifications: {
        preparedBy: 'Security Administrator',
        reviewedBy: 'CISO',
        approvedBy: 'CTO'
      }
    };
  }

  // ユーザー固有の監査レポート
  async generateUserAuditReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserAuditReport> {
    const userLogs = await this.auditLogRepository.findByUserIdAndDateRange(
      userId, 
      startDate, 
      endDate
    );

    const activitySummary = this.summarizeUserActivity(userLogs);
    const dataAccessSummary = this.summarizeDataAccess(userLogs);
    const securityEventsSummary = this.summarizeSecurityEvents(userLogs);

    return {
      userId,
      period: { start: startDate, end: endDate },
      activitySummary,
      dataAccessSummary,
      securityEventsSummary,
      timeline: this.buildActivityTimeline(userLogs),
      riskAssessment: await this.assessUserRisk(userId, userLogs),
      complianceStatus: this.checkUserCompliance(userLogs)
    };
  }

  // レポートのPDF出力
  async exportReportToPdf(report: ComplianceReport): Promise<Buffer> {
    const htmlTemplate = await this.generateReportHtml(report);
    
    return await this.pdfService.generatePdf(htmlTemplate, {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      headerTemplate: this.generateHeaderTemplate(report),
      footerTemplate: this.generateFooterTemplate(),
      displayHeaderFooter: true
    });
  }

  private reviewSegregationOfDuties(auditLogs: AuditLog[]): ControlReview {
    // 職務分掌の確認
    const userActions = new Map<string, Set<string>>();
    
    auditLogs.forEach(log => {
      if (!log.userId) return;
      
      const actions = userActions.get(log.userId.value) || new Set();
      actions.add(`${log.entityType}_${log.action}`);
      userActions.set(log.userId.value, actions);
    });

    const violations = Array.from(userActions.entries())
      .filter(([_, actions]) => this.hasSODViolation(actions))
      .map(([userId, actions]) => ({
        userId,
        violation: 'Conflicting duties performed by same user',
        actions: Array.from(actions)
      }));

    return {
      controlName: 'Segregation of Duties',
      effective: violations.length === 0,
      violations,
      recommendations: violations.length > 0 ? [
        'Review user role assignments',
        'Implement approval workflows for sensitive operations'
      ] : []
    };
  }

  private hasSODViolation(actions: Set<string>): boolean {
    // SOD違反のパターンを定義
    const violationPatterns = [
      ['salary_slip_CREATE', 'salary_slip_APPROVE'],
      ['stock_transaction_CREATE', 'stock_transaction_DELETE'],
      ['user_CREATE', 'user_DELETE']
    ];

    return violationPatterns.some(pattern =>
      pattern.every(action => actions.has(action))
    );
  }

  private calculateControlEffectiveness(reviews: Record<string, ControlReview>): number {
    const totalControls = Object.keys(reviews).length;
    const effectiveControls = Object.values(reviews)
      .filter(review => review.effective).length;
    
    return Math.round((effectiveControls / totalControls) * 100);
  }
}

// 型定義
enum ComplianceReportType {
  SOX = 'sox',
  GDPR = 'gdpr', 
  INTERNAL_AUDIT = 'internal_audit',
  SECURITY = 'security'
}

interface ComplianceReport {
  type: ComplianceReportType;
  period: { start: Date; end: Date };
  summary: Record<string, any>;
  findings: Finding[];
  recommendations: Recommendation[];
  attachments: Attachment[];
  certifications: {
    preparedBy: string;
    reviewedBy: string;
    approvedBy: string;
  };
}

interface UserAuditReport {
  userId: string;
  period: { start: Date; end: Date };
  activitySummary: ActivitySummary;
  dataAccessSummary: DataAccessSummary;
  securityEventsSummary: SecurityEventsSummary;
  timeline: TimelineEvent[];
  riskAssessment: RiskAssessment;
  complianceStatus: ComplianceStatus;
}

interface ControlReview {
  controlName: string;
  effective: boolean;
  violations: any[];
  recommendations: string[];
}
```

---

## 7. 次のステップ

1. ✅ 監査ログ設計書 (16-03_audit-logging.md) ← 本書
2. → 監査インフラの構築・デプロイ
3. → セキュリティ監視ダッシュボードの作成
4. → コンプライアンス監査プロセスの確立
5. → 法的要件検証とドキュメント整備
6. → 運用チーム向けトレーニング実施

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| 監査ログ設計アーキテクト | エキスパートロギング設計アーキテクト | 2025-08-10 | ✅ |
| セキュリティ責任者 | - | - | [ ] |
| コンプライアンス責任者 | - | - | [ ] |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | エキスパートロギング設計アーキテクト |
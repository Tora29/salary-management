# ロギング戦略設計書

## 文書情報

- **作成日**: 2025-08-10
- **作成者**: エキスパートロギング設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **前提条件**: process-flow-designer、class-design-architect、api-specification の完了

---

## 1. ロギング戦略概要

### 1.1 設計原則

本システムのロギング戦略は以下の原則に基づいて設計されています：

| 原則                   | 詳細                                 | 実装方法                           |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| **構造化ロギング**     | 機械解析可能な JSON 形式でのログ記録 | JSON Schema による統一フォーマット |
| **相関ID追跡**         | リクエスト横断でのトレーサビリティ   | UUID ベースの相関 ID の伝播        |
| **適切なログレベル**   | 必要な情報を効率的に記録             | 5段階ログレベルの明確な定義        |
| **個人情報保護**       | PII データの適切なマスキング         | 自動データサニタイゼーション       |
| **パフォーマンス重視** | ログ出力によるシステム負荷最小化     | 非同期ログ出力とサンプリング       |
| **可観測性**           | 総合的なシステム監視                 | メトリクス、トレース、ログの統合   |

### 1.2 ログ分類体系

```
システムログ体系
├── アプリケーションログ
│   ├── ビジネスイベント (給料明細登録、取引記録)
│   ├── システムイベント (API 呼び出し、DB アクセス)
│   └── エラーイベント (例外、障害、警告)
├── セキュリティログ
│   ├── 認証イベント (ログイン、トークン更新)
│   ├── 認可イベント (アクセス制御、権限チェック)
│   └── セキュリティ違反 (不正アクセス、攻撃検知)
├── 監査ログ
│   ├── データ変更 (CRUD 操作の完全な記録)
│   ├── 設定変更 (システム設定、ユーザー設定)
│   └── 管理操作 (バックアップ、メンテナンス)
├── パフォーマンスログ
│   ├── レスポンス時間 (API、DB、外部連携)
│   ├── リソース使用量 (CPU、メモリ、ストレージ)
│   └── スループット (リクエスト処理数、同時接続数)
└── 外部連携ログ
    ├── 株価API呼び出し
    ├── Google OAuth 認証
    └── PDF処理サービス
```

---

## 2. ログレベル定義

### 2.1 レベル別使用基準

| レベル    | 重要度 | 使用場面                                   | 例                                 | 保存期間 |
| --------- | ------ | ------------------------------------------ | ---------------------------------- | -------- |
| **ERROR** | 最高   | システムエラー、データ不整合、外部API失敗  | PDF解析失敗、DB接続エラー          | 永続     |
| **WARN**  | 高     | 潜在的問題、リトライ可能なエラー、設定警告 | API レート制限接近、低信頼度データ | 1年      |
| **INFO**  | 中     | ビジネスイベント、重要な状態変化           | 給料明細作成、取引記録、ログイン   | 6ヶ月    |
| **DEBUG** | 低     | 開発者向け詳細情報、処理フロー             | SQL クエリ、変数値、条件分岐       | 30日     |
| **TRACE** | 最低   | 最詳細なデバッグ情報                       | 関数呼び出し、ループ処理           | 7日      |

### 2.2 レベル別出力制御

```typescript
// 環境別ログレベル設定
const logLevelConfig = {
	production: {
		default: 'INFO',
		database: 'WARN',
		external_api: 'INFO',
		security: 'INFO',
		audit: 'INFO'
	},
	staging: {
		default: 'DEBUG',
		database: 'INFO',
		external_api: 'DEBUG',
		security: 'DEBUG',
		audit: 'INFO'
	},
	development: {
		default: 'TRACE',
		database: 'DEBUG',
		external_api: 'TRACE',
		security: 'DEBUG',
		audit: 'DEBUG'
	}
};
```

---

## 3. 構造化ログ形式

### 3.1 共通ログスキーマ

```typescript
interface BaseLogEntry {
	// 基本情報
	timestamp: string; // ISO 8601 形式
	level: LogLevel; // ERROR | WARN | INFO | DEBUG | TRACE
	message: string; // 人間が読みやすいメッセージ

	// トレーサビリティ
	requestId: string; // リクエスト固有ID
	traceId?: string; // 分散トレーシングID
	spanId?: string; // スパンID
	userId?: string; // ユーザーID (認証済みの場合)
	sessionId?: string; // セッションID

	// システム情報
	service: string; // サービス名 (salary-management)
	version: string; // アプリケーションバージョン
	environment: string; // production | staging | development
	hostname: string; // サーバーホスト名

	// カテゴリ分類
	category: LogCategory; // business | system | security | audit | performance
	module: string; // モジュール名 (salary-slip, portfolio, auth)

	// 詳細情報
	context?: Record<string, any>; // 任意のコンテキスト情報
	error?: ErrorInfo; // エラー情報
	performance?: PerformanceInfo; // パフォーマンス情報

	// メタ情報
	labels: Record<string, string>; // 検索・フィルタ用ラベル
}

interface ErrorInfo {
	name: string; // エラー名
	message: string; // エラーメッセージ
	stack?: string; // スタックトレース
	code?: string; // エラーコード
	statusCode?: number; // HTTP ステータスコード
	cause?: string; // 根本原因
}

interface PerformanceInfo {
	duration: number; // 処理時間 (ms)
	memoryUsage?: number; // メモリ使用量 (bytes)
	dbQueries?: number; // DB クエリ数
	externalApiCalls?: number; // 外部API呼び出し数
}

type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
type LogCategory = 'business' | 'system' | 'security' | 'audit' | 'performance';
```

### 3.2 カテゴリ別ログ例

#### ビジネスイベントログ

```json
{
	"timestamp": "2025-08-10T12:00:00.000Z",
	"level": "INFO",
	"message": "給料明細PDFの解析が完了しました",
	"requestId": "req_cm3k8n4r90001oe6v8h7x2p1q",
	"traceId": "trace_3f2a1b4c5d6e7f8g",
	"userId": "cm3k8n4r90001oe6v8h7x2p1q",
	"service": "salary-management",
	"version": "1.0.0",
	"environment": "production",
	"hostname": "app-server-01",
	"category": "business",
	"module": "salary-slip",
	"context": {
		"operation": "pdf_analysis",
		"fileName": "給料明細_2025年1月.pdf",
		"companyName": "株式会社サンプル",
		"paymentDate": "2025-01-25",
		"netPay": "285000.00",
		"confidence": 0.95,
		"processingMethod": "ocr_ml"
	},
	"performance": {
		"duration": 15234,
		"memoryUsage": 45678912,
		"externalApiCalls": 1
	},
	"labels": {
		"event_type": "salary_slip_created",
		"source_type": "pdf",
		"confidence_level": "high"
	}
}
```

#### セキュリティイベントログ

```json
{
	"timestamp": "2025-08-10T12:00:00.000Z",
	"level": "WARN",
	"message": "連続ログイン失敗によりアカウントをロックしました",
	"requestId": "req_security_001",
	"service": "salary-management",
	"version": "1.0.0",
	"environment": "production",
	"hostname": "auth-server-01",
	"category": "security",
	"module": "authentication",
	"context": {
		"operation": "account_locked",
		"email": "user@*****.com", // マスキング済み
		"ipAddress": "192.168.1.100",
		"userAgent": "Mozilla/5.0...",
		"failedAttempts": 5,
		"lockDuration": 900,
		"reason": "brute_force_protection"
	},
	"labels": {
		"event_type": "security_violation",
		"threat_level": "medium",
		"action_taken": "account_locked"
	}
}
```

#### エラーログ

```json
{
	"timestamp": "2025-08-10T12:00:00.000Z",
	"level": "ERROR",
	"message": "株価API呼び出しでタイムアウトが発生しました",
	"requestId": "req_stock_price_001",
	"traceId": "trace_error_123",
	"userId": "cm3k8n4r90001oe6v8h7x2p1q",
	"service": "salary-management",
	"version": "1.0.0",
	"environment": "production",
	"hostname": "api-server-01",
	"category": "system",
	"module": "stock-price",
	"context": {
		"operation": "fetch_stock_price",
		"symbol": "7203",
		"apiProvider": "alpha_vantage",
		"timeout": 30000,
		"retryCount": 3
	},
	"error": {
		"name": "TimeoutError",
		"message": "Request timeout after 30000ms",
		"code": "EXTERNAL_API_TIMEOUT",
		"statusCode": 504,
		"cause": "network_latency"
	},
	"performance": {
		"duration": 30000,
		"externalApiCalls": 4
	},
	"labels": {
		"event_type": "external_api_error",
		"provider": "alpha_vantage",
		"error_category": "timeout"
	}
}
```

---

## 4. ログ出力実装設計

### 4.1 ロガー階層設計

```typescript
// src/shared/infrastructure/logging/logger.interface.ts
interface Logger {
	error(message: string, context?: LogContext): void;
	warn(message: string, context?: LogContext): void;
	info(message: string, context?: LogContext): void;
	debug(message: string, context?: LogContext): void;
	trace(message: string, context?: LogContext): void;

	// 構造化ログ専用メソッド
	logEvent(event: BusinessEvent): void;
	logSecurity(event: SecurityEvent): void;
	logAudit(event: AuditEvent): void;
	logPerformance(event: PerformanceEvent): void;
}

interface LogContext {
	requestId?: string;
	userId?: string;
	module?: string;
	operation?: string;
	data?: Record<string, any>;
	error?: Error;
	performance?: PerformanceInfo;
}
```

### 4.2 ロガーファクトリー

```typescript
// src/shared/infrastructure/logging/logger.factory.ts
export class LoggerFactory {
	private static instance: LoggerFactory;
	private loggers: Map<string, Logger> = new Map();

	static getInstance(): LoggerFactory {
		if (!LoggerFactory.instance) {
			LoggerFactory.instance = new LoggerFactory();
		}
		return LoggerFactory.instance;
	}

	getLogger(module: string): Logger {
		if (!this.loggers.has(module)) {
			const logger = this.createLogger(module);
			this.loggers.set(module, logger);
		}
		return this.loggers.get(module)!;
	}

	private createLogger(module: string): Logger {
		const config = this.getLogConfig();

		return new StructuredLogger({
			module,
			level: config.getLevel(module),
			transports: [
				new ConsoleTransport({
					format: config.environment === 'development' ? 'pretty' : 'json'
				}),
				new FileTransport({
					filename: `logs/${module}.log`,
					maxSize: '10mb',
					maxFiles: '10d'
				}),
				...(config.environment === 'production'
					? [
							new ElasticsearchTransport({
								endpoint: config.elasticsearch.endpoint,
								index: `salary-management-${config.environment}`
							})
						]
					: [])
			]
		});
	}
}
```

### 4.3 構造化ロガー実装

```typescript
// src/shared/infrastructure/logging/structured-logger.ts
export class StructuredLogger implements Logger {
	constructor(
		private config: LoggerConfig,
		private contextProvider: ContextProvider,
		private sanitizer: DataSanitizer
	) {}

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

	private log(level: LogLevel, message: string, context?: LogContext): void {
		if (!this.shouldLog(level)) return;

		const logEntry = this.buildLogEntry(level, message, context);
		this.output(logEntry);
	}

	private buildLogEntry(level: LogLevel, message: string, context?: LogContext): BaseLogEntry {
		const baseContext = this.contextProvider.getBaseContext();

		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			requestId: baseContext.requestId,
			traceId: baseContext.traceId,
			userId: baseContext.userId,
			sessionId: baseContext.sessionId,
			service: 'salary-management',
			version: baseContext.version,
			environment: baseContext.environment,
			hostname: baseContext.hostname,
			category: this.deriveCategory(context),
			module: context?.module || this.config.module,
			context: this.sanitizer.sanitize(context?.data),
			error: context?.error ? this.formatError(context.error) : undefined,
			performance: context?.performance,
			labels: this.buildLabels(level, context)
		};
	}

	private formatError(error: Error): ErrorInfo {
		return {
			name: error.name,
			message: error.message,
			stack: this.config.includeStackTrace ? error.stack : undefined,
			code: (error as any).code,
			statusCode: (error as any).statusCode,
			cause: (error as any).cause
		};
	}
}
```

---

## 5. 個人情報保護とデータサニタイゼーション

### 5.1 PII データ識別パターン

```typescript
// src/shared/infrastructure/logging/data-sanitizer.ts
export class DataSanitizer {
	private readonly piiPatterns: Array<{
		field: string;
		pattern: RegExp;
		replacement: string;
	}> = [
		// 個人識別情報
		{ field: 'email', pattern: /^(.{1,3}).*?(@.*)$/, replacement: '$1***$2' },
		{ field: 'name', pattern: /^(.)(.+)(.)$/, replacement: '$1***$3' },
		{ field: 'phone', pattern: /^(\d{3})-?(\d{4})-?(\d{4})$/, replacement: '$1-****-$3' },
		{ field: 'employeeId', pattern: /^(.{2})(.+)(.{2})$/, replacement: '$1***$3' },

		// 金融情報（部分マスキング）
		{ field: 'accountNumber', pattern: /^(.{4})(.*)(.{4})$/, replacement: '$1****$3' },
		{ field: 'creditCard', pattern: /^(\d{4})(\d+)(\d{4})$/, replacement: '$1-****-$3' },

		// 住所情報
		{ field: 'address', pattern: /^(.{5})(.+)$/, replacement: '$1***' },
		{ field: 'postalCode', pattern: /^(\d{3})-?(\d{4})$/, replacement: '$1-****' },

		// IPアドレス（部分マスキング）
		{ field: 'ipAddress', pattern: /^(\d+\.\d+)\.\d+\.\d+$/, replacement: '$1.***' }
	];

	sanitize(data: any): any {
		if (!data || typeof data !== 'object') {
			return data;
		}

		const sanitized = { ...data };

		// 再帰的にオブジェクトを処理
		for (const [key, value] of Object.entries(sanitized)) {
			if (typeof value === 'string') {
				sanitized[key] = this.sanitizeValue(key, value);
			} else if (typeof value === 'object' && value !== null) {
				sanitized[key] = this.sanitize(value);
			}
		}

		return sanitized;
	}

	private sanitizeValue(fieldName: string, value: string): string {
		const pattern = this.piiPatterns.find(
			(p) => p.field === fieldName || fieldName.toLowerCase().includes(p.field)
		);

		if (pattern) {
			return value.replace(pattern.pattern, pattern.replacement);
		}

		return value;
	}
}
```

### 5.2 機密データ除外設定

```typescript
// 完全に除外すべきフィールド
const EXCLUDED_FIELDS = [
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
];

// ログレベル別出力制御
const LOG_LEVEL_FIELDS = {
	ERROR: ['userId', 'requestId', 'error', 'stack'],
	WARN: ['userId', 'requestId', 'operation', 'reason'],
	INFO: ['userId', 'requestId', 'operation', 'result'],
	DEBUG: ['userId', 'requestId', 'operation', 'params', 'result'],
	TRACE: ['*'] // すべてのフィールド
};
```

---

## 6. パフォーマンス最適化

### 6.1 非同期ログ出力

```typescript
// src/shared/infrastructure/logging/async-logger.ts
export class AsyncLogBuffer {
	private buffer: BaseLogEntry[] = [];
	private readonly bufferSize = 100;
	private readonly flushInterval = 5000; // 5秒
	private flushTimer: NodeJS.Timeout | null = null;

	constructor(private transport: LogTransport) {
		this.startFlushTimer();
	}

	add(entry: BaseLogEntry): void {
		this.buffer.push(entry);

		if (this.buffer.length >= this.bufferSize) {
			this.flush();
		}
	}

	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			if (this.buffer.length > 0) {
				this.flush();
			}
		}, this.flushInterval);
	}

	private async flush(): Promise<void> {
		if (this.buffer.length === 0) return;

		const entries = this.buffer.splice(0);

		try {
			await this.transport.writeBatch(entries);
		} catch (error) {
			// ログ出力エラーは別の仕組みで記録
			console.error('Log flush failed:', error);

			// 重要なログは別チャネルで出力
			const criticalLogs = entries.filter((e) => e.level === 'ERROR' || e.category === 'security');

			if (criticalLogs.length > 0) {
				this.fallbackOutput(criticalLogs);
			}
		}
	}

	private fallbackOutput(entries: BaseLogEntry[]): void {
		// ファイルシステムへの直接出力など
		entries.forEach((entry) => {
			console.error(JSON.stringify(entry));
		});
	}
}
```

### 6.2 サンプリング戦略

```typescript
// src/shared/infrastructure/logging/sampling-strategy.ts
export class LogSampler {
	private readonly sampleRates: Record<LogLevel, number> = {
		ERROR: 1.0, // 全て記録
		WARN: 1.0, // 全て記録
		INFO: 0.1, // 10%をサンプリング
		DEBUG: 0.01, // 1%をサンプリング
		TRACE: 0.001 // 0.1%をサンプリング
	};

	shouldSample(level: LogLevel, context?: LogContext): boolean {
		// 重要なイベントは常に記録
		if (this.isCriticalEvent(context)) {
			return true;
		}

		// エラーレベルは常に記録
		if (level === 'ERROR') {
			return true;
		}

		// レベル別サンプリング
		const rate = this.sampleRates[level];
		return Math.random() < rate;
	}

	private isCriticalEvent(context?: LogContext): boolean {
		if (!context) return false;

		const criticalOperations = [
			'user_login',
			'user_logout',
			'salary_slip_created',
			'transaction_created',
			'security_violation',
			'data_export'
		];

		return criticalOperations.includes(context.operation || '');
	}
}
```

---

## 7. 監査ログ特殊要件

### 7.1 改ざん検知メカニズム

```typescript
// src/shared/infrastructure/logging/audit-logger.ts
export class AuditLogger extends StructuredLogger {
	constructor(
		config: LoggerConfig,
		private cryptoService: CryptoService,
		private integrityStore: IntegrityStore
	) {
		super(config);
	}

	async logAudit(event: AuditEvent): Promise<void> {
		const auditEntry = this.buildAuditEntry(event);

		// デジタル署名の追加
		const signature = await this.cryptoService.sign(JSON.stringify(auditEntry));

		const signedEntry = {
			...auditEntry,
			signature,
			hash: this.cryptoService.hash(JSON.stringify(auditEntry))
		};

		// 改ざん検知用の整合性情報を保存
		await this.integrityStore.store(signedEntry.id, {
			hash: signedEntry.hash,
			signature: signedEntry.signature,
			timestamp: signedEntry.timestamp
		});

		this.output(signedEntry);
	}

	private buildAuditEntry(event: AuditEvent): AuditLogEntry {
		return {
			id: generateId(),
			timestamp: new Date().toISOString(),
			userId: event.userId,
			entityType: event.entityType,
			entityId: event.entityId,
			action: event.action,
			oldValue: this.sanitizer.sanitize(event.oldValue),
			newValue: this.sanitizer.sanitize(event.newValue),
			reason: event.reason,
			ipAddress: event.context.ipAddress,
			userAgent: event.context.userAgent,
			requestId: event.context.requestId,
			metadata: event.metadata
		};
	}
}
```

### 7.2 監査ログフォーマット

```typescript
interface AuditLogEntry extends BaseLogEntry {
	// 監査固有フィールド
	entityType: string; // 操作対象のエンティティ型
	entityId: string; // 操作対象のID
	action: AuditAction; // 実行されたアクション
	oldValue?: Record<string, any>; // 変更前の値
	newValue?: Record<string, any>; // 変更後の値
	reason?: string; // 変更理由

	// トレーサビリティ
	ipAddress: string; // クライアントIPアドレス
	userAgent: string; // ユーザーエージェント

	// 整合性保証
	signature?: string; // デジタル署名
	hash?: string; // ハッシュ値
}

type AuditAction =
	| 'CREATE'
	| 'READ'
	| 'UPDATE'
	| 'DELETE'
	| 'LOGIN'
	| 'LOGOUT'
	| 'EXPORT'
	| 'IMPORT'
	| 'APPROVE'
	| 'REJECT'
	| 'LOCK'
	| 'UNLOCK';
```

---

## 8. ログ保存・管理戦略

### 8.1 保存期間ポリシー

| ログカテゴリ         | 保存期間 | 圧縮    | アーカイブ先               | 削除条件           |
| -------------------- | -------- | ------- | -------------------------- | ------------------ |
| **監査ログ**         | 10年     | 1年後   | 長期アーカイブストレージ   | 法的要件による     |
| **セキュリティログ** | 5年      | 6ヶ月後 | セキュリティ専用ストレージ | 法的要件による     |
| **ビジネスログ**     | 3年      | 3ヶ月後 | 標準アーカイブストレージ   | ビジネス要件による |
| **システムログ**     | 1年      | 1ヶ月後 | 標準ストレージ             | 運用要件による     |
| **デバッグログ**     | 30日     | なし    | 高速ストレージ             | 自動削除           |

### 8.2 ログローテーション設定

```typescript
// src/shared/infrastructure/logging/log-rotation.config.ts
export const logRotationConfig = {
	// 日次ローテーション
	daily: {
		frequency: '0 0 * * *', // 毎日午前0時
		keepFiles: 30,
		compress: true,
		pattern: 'YYYY-MM-DD'
	},

	// サイズベースローテーション
	sizeBasedRotation: {
		maxSize: '100MB',
		maxFiles: 10,
		compress: true
	},

	// レベル別ファイル分離
	levelSeparation: {
		error: 'logs/error-%DATE%.log',
		warn: 'logs/warn-%DATE%.log',
		info: 'logs/info-%DATE%.log',
		debug: 'logs/debug-%DATE%.log'
	}
};
```

---

## 9. 監視・アラート設定

### 9.1 ログベース監視指標

```typescript
// 監視すべき主要指標
const monitoringMetrics = {
	// エラー率監視
	errorRate: {
		query: 'level:ERROR',
		threshold: {
			warning: '> 1%',
			critical: '> 5%'
		},
		window: '5m'
	},

	// 認証失敗監視
	authFailures: {
		query: 'category:security AND operation:login_failed',
		threshold: {
			warning: '> 10 per 15m',
			critical: '> 50 per 15m'
		}
	},

	// API レスポンス時間監視
	slowRequests: {
		query: 'performance.duration:>5000',
		threshold: {
			warning: '> 10 per 5m',
			critical: '> 50 per 5m'
		}
	},

	// 外部API障害監視
	externalApiErrors: {
		query: 'module:stock-price AND level:ERROR',
		threshold: {
			warning: '> 5 per 10m',
			critical: '> 20 per 10m'
		}
	}
};
```

### 9.2 アラート通知設定

```typescript
// src/shared/infrastructure/logging/alert-manager.ts
export class AlertManager {
	async processLogEntry(entry: BaseLogEntry): Promise<void> {
		// 即座アラートが必要なログレベル
		if (this.requiresImmediateAlert(entry)) {
			await this.sendImmediateAlert(entry);
		}

		// パターンベースのアラート検知
		await this.checkAlertPatterns(entry);
	}

	private requiresImmediateAlert(entry: BaseLogEntry): boolean {
		return (
			(entry.level === 'ERROR' && entry.category === 'security') ||
			entry.context?.operation === 'data_breach_detected' ||
			entry.error?.code === 'SYSTEM_CRITICAL_ERROR'
		);
	}

	private async sendImmediateAlert(entry: BaseLogEntry): Promise<void> {
		const alert = {
			severity: 'HIGH',
			title: `[${entry.level}] ${entry.message}`,
			description: this.buildAlertDescription(entry),
			timestamp: entry.timestamp,
			metadata: {
				service: entry.service,
				module: entry.module,
				requestId: entry.requestId
			}
		};

		// 複数チャネルへの通知
		await Promise.all([
			this.slackNotifier.send(alert),
			this.emailNotifier.send(alert),
			this.webhookNotifier.send(alert)
		]);
	}
}
```

---

## 10. 開発・運用ガイドライン

### 10.1 ログ出力ガイドライン

```typescript
// 推奨されるログ出力パターン

// ✅ 良い例: 構造化ログ
logger.info('給料明細の作成が完了しました', {
	operation: 'create_salary_slip',
	userId: user.id,
	salarySlipId: salarySlip.id,
	data: {
		companyName: salarySlip.companyName,
		paymentDate: salarySlip.paymentDate,
		netPay: salarySlip.netPay
	},
	performance: {
		duration: processingTime
	}
});

// ❌ 避けるべき例: 非構造化ログ
logger.info(
	`User ${user.id} created salary slip ${salarySlip.id} with net pay ${salarySlip.netPay}`
);

// ✅ 良い例: エラーログ
logger.error('PDF解析でエラーが発生しました', {
	operation: 'parse_pdf',
	userId: user.id,
	fileName: file.name,
	error: error,
	performance: {
		duration: processingTime
	}
});

// ❌ 避けるべき例: 情報不足
logger.error('PDF解析エラー', error);
```

### 10.2 パフォーマンス考慮事項

```typescript
// 高頻度処理でのログ出力最適化
class HighFrequencyOperation {
	private logSampler = new LogSampler();

	async processData(data: any[]): Promise<void> {
		// 開始ログは常に出力
		logger.info('一括処理を開始します', {
			operation: 'bulk_process',
			itemCount: data.length
		});

		for (const item of data) {
			try {
				await this.processItem(item);

				// 成功ログはサンプリング
				if (this.logSampler.shouldSample('DEBUG')) {
					logger.debug('アイテム処理完了', {
						operation: 'process_item',
						itemId: item.id
					});
				}
			} catch (error) {
				// エラーログは常に出力
				logger.error('アイテム処理でエラーが発生', {
					operation: 'process_item',
					itemId: item.id,
					error
				});
			}
		}

		// 完了ログは常に出力
		logger.info('一括処理が完了しました', {
			operation: 'bulk_process',
			itemCount: data.length,
			performance: {
				duration: Date.now() - startTime
			}
		});
	}
}
```

---

## 11. 法的要件・コンプライアンス

### 11.1 データ保護法対応

```typescript
// GDPR/個人情報保護法対応
const complianceConfig = {
	// データ保持期間
	dataRetention: {
		personalData: '3年', // 個人データ
		financialData: '5年', // 金融データ
		auditLogs: '10年', // 監査ログ
		systemLogs: '1年' // システムログ
	},

	// データ削除権対応
	rightToErasure: {
		enabled: true,
		anonymizationDelay: '30日',
		completeDeletionDelay: '90日'
	},

	// データポータビリティ対応
	dataExport: {
		formats: ['JSON', 'CSV'],
		includeAuditLogs: true,
		excludeSystemLogs: true
	}
};
```

### 11.2 セキュリティログ要件

```typescript
// 金融業界向けセキュリティログ要件
const securityLogRequirements = {
	// 必須記録イベント
	mandatoryEvents: [
		'user_authentication',
		'authorization_failure',
		'sensitive_data_access',
		'configuration_change',
		'privilege_escalation',
		'data_export',
		'system_shutdown'
	],

	// ログの完全性保証
	integrityProtection: {
		digitalSignature: true,
		hashChaining: true,
		tamperEvidentStorage: true
	},

	// ログアクセス制御
	accessControl: {
		roleBasedAccess: true,
		auditLogAccess: true,
		minimumPrivileges: true
	}
};
```

---

## 12. 次のステップ

1. ✅ ロギング戦略設計 (16-01_logging-strategy.md) ← 本書
2. → 構造化ログ実装設計 (16-02_structured-logging.md)
3. → 監査ログ詳細設計 (16-03_audit-logging.md)
4. → ログ監視・アラート設定
5. → ログ分析ダッシュボード設計
6. → 法的要件コンプライアンス検証

---

## 承認

| 役割                     | 名前                                 | 日付       | 署名 |
| ------------------------ | ------------------------------------ | ---------- | ---- |
| ロギング設計アーキテクト | エキスパートロギング設計アーキテクト | 2025-08-10 | ✅   |
| レビュアー               | -                                    | -          | [ ]  |
| 承認者                   | -                                    | -          | [ ]  |

---

**改訂履歴**

| バージョン | 日付       | 変更内容 | 作成者                               |
| ---------- | ---------- | -------- | ------------------------------------ |
| 1.0.0      | 2025-08-10 | 初版作成 | エキスパートロギング設計アーキテクト |

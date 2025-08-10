# デザインパターン適用設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: デザインパターンアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ

---

## 1. 設計概要

### 1.1 デザインパターン適用方針

本システムでは、以下の方針に基づいてデザインパターンを適用します：

| 方針 | 目的 | 適用パターン |
|------|------|-------------|
| **保守性向上** | コードの変更や拡張を容易にする | Strategy, Factory, Observer |
| **疎結合実現** | 依存関係を最小限に抑える | Repository, Dependency Injection |
| **再利用性確保** | コンポーネントの再利用を促進する | Builder, Template Method |
| **責任の明確化** | 各オブジェクトの責任を明確にする | Command, Chain of Responsibility |
| **複雑性の管理** | 複雑なビジネスロジックを整理する | State, Specification |

### 1.2 パターン適用マトリクス

```
                           │ 生成 │ 構造 │ 振舞 │ アーキ │
├─────────────────────────┼──────┼──────┼──────┼────────┤
│ User Management         │  ✓   │  ✓   │  ✓   │   ✓    │
│ Salary Slip Processing  │  ✓   │  ✓   │  ✓✓  │   ✓    │
│ Stock Portfolio         │  ✓   │  ✓   │  ✓   │   ✓    │
│ PDF Parsing             │  ✓   │  ✓✓  │  ✓   │   ✓    │
│ Notification System     │  ✓   │      │  ✓✓  │   ✓    │
│ Caching                 │  ✓   │  ✓   │  ✓   │   ✓    │
│ Event Processing        │      │      │  ✓✓  │   ✓✓   │
└─────────────────────────┴──────┴──────┴──────┴────────┘
```

---

## 2. 生成パターン (Creational Patterns)

### 2.1 Factory Pattern

#### 2.1.1 Abstract Factory - PDF Parser Factory

```typescript
// src/shared/infrastructure/pdf/factories/pdf-parser.abstract-factory.ts

/**
 * PDF解析器抽象ファクトリー
 * 
 * @description 異なる種類のPDF解析器を生成
 * 給料明細の形式や言語に応じて適切なパーサーを選択
 */
export abstract class PdfParserAbstractFactory {
  abstract createSalarySlipParser(): SalarySlipPdfParser;
  abstract createReceiptParser(): ReceiptPdfParser;
  abstract createInvoiceParser(): InvoicePdfParser;
  
  // ファクトリー選択のメソッド
  public static createFactory(type: PdfDocumentType): PdfParserAbstractFactory {
    switch (type) {
      case PdfDocumentType.JAPANESE_SALARY_SLIP:
        return new JapaneseSalarySlipParserFactory();
      case PdfDocumentType.ENGLISH_SALARY_SLIP:
        return new EnglishSalarySlipParserFactory();
      case PdfDocumentType.GENERIC_DOCUMENT:
        return new GenericDocumentParserFactory();
      default:
        throw new UnsupportedDocumentTypeError(type);
    }
  }
}

/**
 * 日本語給料明細パーサーファクトリー
 */
export class JapaneseSalarySlipParserFactory extends PdfParserAbstractFactory {
  createSalarySlipParser(): SalarySlipPdfParser {
    return new JapaneseSalarySlipPdfParser(
      new JapaneseTextExtractor(),
      new JapaneseAmountParser(),
      new JapaneseDateParser(),
      new JapaneseCompanyNameExtractor()
    );
  }

  createReceiptParser(): ReceiptPdfParser {
    return new JapaneseReceiptPdfParser();
  }

  createInvoiceParser(): InvoicePdfParser {
    return new JapaneseInvoicePdfParser();
  }
}

/**
 * 英語給料明細パーサーファクトリー
 */
export class EnglishSalarySlipParserFactory extends PdfParserAbstractFactory {
  createSalarySlipParser(): SalarySlipPdfParser {
    return new EnglishSalarySlipPdfParser(
      new EnglishTextExtractor(),
      new EnglishAmountParser(),
      new EnglishDateParser(),
      new EnglishCompanyNameExtractor()
    );
  }

  createReceiptParser(): ReceiptPdfParser {
    return new EnglishReceiptPdfParser();
  }

  createInvoiceParser(): InvoicePdfParser {
    return new EnglishInvoicePdfParser();
  }
}
```

#### 2.1.2 Factory Method - Event Factory

```typescript
// src/shared/domain/events/factories/domain-event.factory.ts

/**
 * ドメインイベントファクトリー
 * 
 * @description イベントタイプに基づいて適切なイベントオブジェクトを生成
 */
export abstract class DomainEventFactory {
  abstract createEvent(eventType: string, data: any): DomainEvent;
  
  public static create(): DomainEventFactory {
    return new ConcreteDomainEventFactory();
  }
}

export class ConcreteDomainEventFactory extends DomainEventFactory {
  private readonly eventRegistry = new Map<string, EventConstructor>();
  
  constructor() {
    super();
    this.registerEvents();
  }
  
  createEvent(eventType: string, data: any): DomainEvent {
    const EventConstructor = this.eventRegistry.get(eventType);
    if (!EventConstructor) {
      throw new UnknownEventTypeError(eventType);
    }
    
    return new EventConstructor(data);
  }
  
  private registerEvents(): void {
    this.eventRegistry.set('SalarySlipCreated', SalarySlipCreatedEvent);
    this.eventRegistry.set('SalarySlipUpdated', SalarySlipUpdatedEvent);
    this.eventRegistry.set('SalarySlipDeleted', SalarySlipDeletedEvent);
    this.eventRegistry.set('StockTransactionProcessed', StockTransactionProcessedEvent);
    this.eventRegistry.set('PortfolioRebalanced', PortfolioRebalancedEvent);
    this.eventRegistry.set('UserRegistered', UserRegisteredEvent);
    this.eventRegistry.set('UserPreferencesUpdated', UserPreferencesUpdatedEvent);
  }
}

type EventConstructor = new (data: any) => DomainEvent;
```

### 2.2 Builder Pattern

#### 2.2.1 Complex Query Builder

```typescript
// src/features/salary-slip/domain/builders/salary-slip-query.builder.ts

/**
 * 給料明細クエリビルダー
 * 
 * @description 複雑な検索条件を段階的に構築
 */
export class SalarySlipQueryBuilder {
  private userId?: EntityId;
  private dateRange?: DateRange;
  private amountRange?: MoneyAmountRange;
  private companies: string[] = [];
  private statuses: SalarySlipStatus[] = [];
  private sourceTypes: SalarySlipSourceType[] = [];
  private searchTerms: string[] = [];
  private sortCriteria: SortCriteria[] = [];
  private pagination?: PaginationOptions;
  private includeDeleted: boolean = false;
  private includeArchived: boolean = true;

  public forUser(userId: EntityId): this {
    this.userId = userId;
    return this;
  }

  public inDateRange(start: Date, end: Date): this {
    this.dateRange = new DateRange(start, end);
    return this;
  }

  public inAmountRange(min: MoneyAmount, max: MoneyAmount): this {
    this.amountRange = new MoneyAmountRange(min, max);
    return this;
  }

  public fromCompanies(companies: string[]): this {
    this.companies = [...this.companies, ...companies];
    return this;
  }

  public fromCompany(company: string): this {
    this.companies.push(company);
    return this;
  }

  public withStatuses(statuses: SalarySlipStatus[]): this {
    this.statuses = [...this.statuses, ...statuses];
    return this;
  }

  public withStatus(status: SalarySlipStatus): this {
    this.statuses.push(status);
    return this;
  }

  public fromSources(sourceTypes: SalarySlipSourceType[]): this {
    this.sourceTypes = [...this.sourceTypes, ...sourceTypes];
    return this;
  }

  public fromSource(sourceType: SalarySlipSourceType): this {
    this.sourceTypes.push(sourceType);
    return this;
  }

  public searchFor(term: string): this {
    this.searchTerms.push(term);
    return this;
  }

  public sortBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.sortCriteria.push({ field, direction });
    return this;
  }

  public paginate(page: number, limit: number): this {
    this.pagination = { page, limit };
    return this;
  }

  public includeDeletedRecords(): this {
    this.includeDeleted = true;
    return this;
  }

  public excludeArchivedRecords(): this {
    this.includeArchived = false;
    return this;
  }

  public build(): SalarySlipQuery {
    if (!this.userId) {
      throw new QueryBuilderError('User ID is required');
    }

    return new SalarySlipQuery({
      userId: this.userId,
      dateRange: this.dateRange,
      amountRange: this.amountRange,
      companies: [...this.companies],
      statuses: [...this.statuses],
      sourceTypes: [...this.sourceTypes],
      searchTerms: [...this.searchTerms],
      sortCriteria: [...this.sortCriteria],
      pagination: this.pagination,
      includeDeleted: this.includeDeleted,
      includeArchived: this.includeArchived
    });
  }

  // プリセットビルダーメソッド
  public static forCurrentYear(userId: EntityId): SalarySlipQueryBuilder {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    return new SalarySlipQueryBuilder()
      .forUser(userId)
      .inDateRange(startOfYear, endOfYear)
      .withStatus(SalarySlipStatus.CONFIRMED)
      .sortBy('paymentDate', 'desc');
  }

  public static forDashboard(userId: EntityId): SalarySlipQueryBuilder {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    return new SalarySlipQueryBuilder()
      .forUser(userId)
      .inDateRange(threeMonthsAgo, new Date())
      .withStatuses([SalarySlipStatus.CONFIRMED, SalarySlipStatus.DRAFT])
      .sortBy('paymentDate', 'desc')
      .paginate(1, 10);
  }

  public static forExport(userId: EntityId, year: number): SalarySlipQueryBuilder {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return new SalarySlipQueryBuilder()
      .forUser(userId)
      .inDateRange(startOfYear, endOfYear)
      .withStatus(SalarySlipStatus.CONFIRMED)
      .sortBy('paymentDate', 'asc')
      .excludeArchivedRecords();
  }
}
```

### 2.3 Singleton Pattern

#### 2.3.1 Configuration Manager

```typescript
// src/shared/infrastructure/config/configuration-manager.ts

/**
 * 設定管理シングルトン
 * 
 * @description アプリケーション全体の設定を一元管理
 * スレッドセーフで環境変数の変更を監視
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: ApplicationConfig;
  private readonly configWatcher: ConfigWatcher;
  private readonly logger: Logger;

  private constructor() {
    this.config = this.loadConfiguration();
    this.configWatcher = new ConfigWatcher();
    this.logger = LoggerFactory.create('ConfigurationManager');
    this.setupConfigWatcher();
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public get database(): DatabaseConfig {
    return this.config.database;
  }

  public get redis(): RedisConfig {
    return this.config.redis;
  }

  public get pdf(): PdfConfig {
    return this.config.pdf;
  }

  public get stockApi(): StockApiConfig {
    return this.config.stockApi;
  }

  public get notification(): NotificationConfig {
    return this.config.notification;
  }

  public get security(): SecurityConfig {
    return this.config.security;
  }

  public reload(): void {
    const oldConfig = { ...this.config };
    this.config = this.loadConfiguration();
    
    this.logger.info('Configuration reloaded', {
      changedKeys: this.getChangedKeys(oldConfig, this.config)
    });
  }

  private loadConfiguration(): ApplicationConfig {
    return {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/salary_management',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'),
        ssl: process.env.DB_SSL === 'true'
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'salary_mgmt:',
        maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
        retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000')
      },
      pdf: {
        ocrProvider: (process.env.OCR_PROVIDER as 'tesseract' | 'google' | 'aws') || 'tesseract',
        confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '0.7'),
        maxFileSize: parseInt(process.env.PDF_MAX_FILE_SIZE || '10485760'), // 10MB
        allowedMimeTypes: ['application/pdf'],
        tempDirectory: process.env.PDF_TEMP_DIR || '/tmp/pdf_processing'
      },
      stockApi: {
        provider: (process.env.STOCK_API_PROVIDER as 'alpha_vantage' | 'yahoo' | 'polygon') || 'alpha_vantage',
        apiKey: process.env.STOCK_API_KEY || '',
        rateLimitPerMinute: parseInt(process.env.STOCK_API_RATE_LIMIT || '5'),
        timeout: parseInt(process.env.STOCK_API_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.STOCK_API_RETRY_ATTEMPTS || '3')
      },
      notification: {
        email: {
          provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'ses' | 'smtp') || 'sendgrid',
          apiKey: process.env.EMAIL_API_KEY || '',
          fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@salary-management.app',
          fromName: process.env.EMAIL_FROM_NAME || 'Salary Management'
        },
        push: {
          vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
          vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
          vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@salary-management.app'
        }
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        jwtExpiryHours: parseInt(process.env.JWT_EXPIRY_HOURS || '24'),
        refreshTokenExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7'),
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
      }
    };
  }

  private setupConfigWatcher(): void {
    this.configWatcher.on('change', () => {
      this.logger.info('Environment configuration changed, reloading...');
      this.reload();
    });
  }

  private getChangedKeys(oldConfig: ApplicationConfig, newConfig: ApplicationConfig): string[] {
    const changes: string[] = [];
    
    const compareObjects = (obj1: any, obj2: any, prefix: string = '') => {
      for (const key in obj1) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj1[key] === 'object' && obj1[key] !== null) {
          if (typeof obj2[key] === 'object' && obj2[key] !== null) {
            compareObjects(obj1[key], obj2[key], fullKey);
          } else {
            changes.push(fullKey);
          }
        } else if (obj1[key] !== obj2[key]) {
          changes.push(fullKey);
        }
      }
    };

    compareObjects(oldConfig, newConfig);
    return changes;
  }
}
```

---

## 3. 構造パターン (Structural Patterns)

### 3.1 Adapter Pattern

#### 3.1.1 Stock API Adapter

```typescript
// src/shared/infrastructure/stock-api/adapters/stock-api.adapter.ts

/**
 * 株価API統合アダプター
 * 
 * @description 複数の株価APIプロバイダーを統一インターフェースで利用
 */
export interface StockApiProvider {
  getCurrentPrice(symbol: string): Promise<StockPrice>;
  getHistoricalPrices(symbol: string, period: TimePeriod): Promise<StockPriceHistory[]>;
  searchStocks(query: string): Promise<StockSearchResult[]>;
  getStockInfo(symbol: string): Promise<StockInfo>;
}

/**
 * Alpha Vantage API アダプター
 */
export class AlphaVantageAdapter implements StockApiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly httpClient: HttpClient,
    private readonly rateLimiter: RateLimiter
  ) {}

  async getCurrentPrice(symbol: string): Promise<StockPrice> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
    );

    return this.mapAlphaVantageQuoteToStockPrice(response.data);
  }

  async getHistoricalPrices(symbol: string, period: TimePeriod): Promise<StockPriceHistory[]> {
    await this.rateLimiter.waitForAvailableSlot();

    const function_type = this.mapPeriodToAlphaVantageFunction(period);
    const response = await this.httpClient.get(
      `https://www.alphavantage.co/query?function=${function_type}&symbol=${symbol}&apikey=${this.apiKey}`
    );

    return this.mapAlphaVantageTimeSeriestoHistory(response.data, period);
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${this.apiKey}`
    );

    return this.mapAlphaVantageSearchResults(response.data);
  }

  async getStockInfo(symbol: string): Promise<StockInfo> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${this.apiKey}`
    );

    return this.mapAlphaVantageOverviewToStockInfo(response.data);
  }

  private mapAlphaVantageQuoteToStockPrice(data: any): StockPrice {
    const quote = data['Global Quote'];
    if (!quote) {
      throw new StockApiError('Invalid response format from Alpha Vantage');
    }

    return StockPrice.create({
      symbol: quote['01. symbol'],
      currentPrice: MoneyAmount.from(quote['05. price']),
      previousClose: MoneyAmount.from(quote['08. previous close']),
      dayChange: MoneyAmount.from(quote['09. change']),
      dayChangePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      dayHigh: MoneyAmount.from(quote['03. high']),
      dayLow: MoneyAmount.from(quote['04. low']),
      volume: quote['06. volume'],
      lastUpdated: new Date(quote['07. latest trading day'])
    });
  }

  private mapPeriodToAlphaVantageFunction(period: TimePeriod): string {
    switch (period) {
      case TimePeriod.DAILY:
        return 'TIME_SERIES_DAILY';
      case TimePeriod.WEEKLY:
        return 'TIME_SERIES_WEEKLY';
      case TimePeriod.MONTHLY:
        return 'TIME_SERIES_MONTHLY';
      default:
        return 'TIME_SERIES_DAILY';
    }
  }

  private mapAlphaVantageTimeSeriestoHistory(data: any, period: TimePeriod): StockPriceHistory[] {
    const timeSeriesKey = this.getTimeSeriesKey(period);
    const timeSeries = data[timeSeriesKey];
    
    if (!timeSeries) {
      throw new StockApiError('Invalid time series response from Alpha Vantage');
    }

    return Object.entries(timeSeries).map(([date, values]: [string, any]) => 
      StockPriceHistory.create({
        date: new Date(date),
        open: MoneyAmount.from(values['1. open']),
        high: MoneyAmount.from(values['2. high']),
        low: MoneyAmount.from(values['3. low']),
        close: MoneyAmount.from(values['4. close']),
        volume: values['5. volume']
      })
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getTimeSeriesKey(period: TimePeriod): string {
    switch (period) {
      case TimePeriod.DAILY:
        return 'Time Series (Daily)';
      case TimePeriod.WEEKLY:
        return 'Weekly Time Series';
      case TimePeriod.MONTHLY:
        return 'Monthly Time Series';
      default:
        return 'Time Series (Daily)';
    }
  }
}

/**
 * Yahoo Finance API アダプター
 */
export class YahooFinanceAdapter implements StockApiProvider {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly rateLimiter: RateLimiter
  ) {}

  async getCurrentPrice(symbol: string): Promise<StockPrice> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );

    return this.mapYahooQuoteToStockPrice(response.data, symbol);
  }

  async getHistoricalPrices(symbol: string, period: TimePeriod): Promise<StockPriceHistory[]> {
    await this.rateLimiter.waitForAvailableSlot();

    const { period1, period2 } = this.mapPeriodToYahooParams(period);
    const response = await this.httpClient.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`
    );

    return this.mapYahooHistoricalData(response.data);
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`
    );

    return this.mapYahooSearchResults(response.data);
  }

  async getStockInfo(symbol: string): Promise<StockInfo> {
    await this.rateLimiter.waitForAvailableSlot();

    const response = await this.httpClient.get(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=summaryProfile,financialData`
    );

    return this.mapYahooSummaryToStockInfo(response.data);
  }

  private mapYahooQuoteToStockPrice(data: any, symbol: string): StockPrice {
    const result = data.chart?.result?.[0];
    if (!result) {
      throw new StockApiError('Invalid response format from Yahoo Finance');
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    
    return StockPrice.create({
      symbol: symbol,
      currentPrice: MoneyAmount.from(currentPrice.toString()),
      previousClose: MoneyAmount.from(meta.previousClose.toString()),
      dayChange: MoneyAmount.from((currentPrice - meta.previousClose).toString()),
      dayChangePercent: ((currentPrice - meta.previousClose) / meta.previousClose) * 100,
      dayHigh: MoneyAmount.from(meta.regularMarketDayHigh?.toString() || currentPrice.toString()),
      dayLow: MoneyAmount.from(meta.regularMarketDayLow?.toString() || currentPrice.toString()),
      volume: meta.regularMarketVolume?.toString() || '0',
      lastUpdated: new Date(meta.regularMarketTime * 1000)
    });
  }

  private mapPeriodToYahooParams(period: TimePeriod): { period1: number, period2: number } {
    const now = Math.floor(Date.now() / 1000);
    
    switch (period) {
      case TimePeriod.DAILY:
        return { period1: now - (30 * 24 * 60 * 60), period2: now }; // 30 days
      case TimePeriod.WEEKLY:
        return { period1: now - (365 * 24 * 60 * 60), period2: now }; // 1 year
      case TimePeriod.MONTHLY:
        return { period1: now - (5 * 365 * 24 * 60 * 60), period2: now }; // 5 years
      default:
        return { period1: now - (30 * 24 * 60 * 60), period2: now };
    }
  }
}
```

### 3.2 Decorator Pattern

#### 3.2.1 Cache Decorator

```typescript
// src/shared/infrastructure/cache/decorators/cache.decorator.ts

/**
 * キャッシュデコレーター
 * 
 * @description メソッドの結果をキャッシュして性能を向上
 */
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cacheService = Container.get<CacheService>('CacheService');
    const logger = Container.get<Logger>('Logger');

    descriptor.value = async function (...args: any[]) {
      const cacheKey = generateCacheKey(
        target.constructor.name,
        propertyName,
        args,
        options.keyGenerator
      );

      // キャッシュから取得を試行
      if (options.ttl !== 0) { // TTL が 0 の場合はキャッシュしない
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult !== null) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cachedResult;
        }
      }

      // メソッドを実行
      const result = await method.apply(this, args);

      // 結果をキャッシュに保存
      if (options.ttl !== 0 && result !== null && result !== undefined) {
        const ttl = options.ttl || 300; // デフォルト5分
        await cacheService.set(cacheKey, result, ttl);
        logger.debug(`Cached result for ${cacheKey} with TTL ${ttl}s`);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * キャッシュ無効化デコレーター
 */
export function CacheEvict(options: CacheEvictOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cacheService = Container.get<CacheService>('CacheService');
    const logger = Container.get<Logger>('Logger');

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      // キャッシュを削除
      if (options.keys) {
        for (const keyPattern of options.keys) {
          const key = interpolateKeyPattern(keyPattern, args, this);
          if (keyPattern.includes('*')) {
            await cacheService.deleteByPattern(key);
          } else {
            await cacheService.delete(key);
          }
          logger.debug(`Cache evicted for pattern: ${key}`);
        }
      }

      if (options.allEntries) {
        await cacheService.clear();
        logger.debug('All cache entries evicted');
      }

      return result;
    };

    return descriptor;
  };
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (target: string, method: string, args: any[]) => string;
}

interface CacheEvictOptions {
  keys?: string[]; // Cache key patterns to evict
  allEntries?: boolean; // Evict all cache entries
}

// 使用例
export class SalarySlipQueryService {
  @Cacheable({ ttl: 1800 }) // 30分キャッシュ
  async searchSalarySlips(query: SalarySlipSearchQuery): Promise<PaginatedResult<SalarySlipListView>> {
    // 実装...
  }

  @CacheEvict({ 
    keys: ['salary_slip:search:*#{userId}*', 'salary_slip:dashboard:*#{userId}*'] 
  })
  async createSalarySlip(salarySlip: SalarySlip): Promise<void> {
    // 実装...
  }
}
```

### 3.3 Facade Pattern

#### 3.3.1 PDF Processing Facade

```typescript
// src/features/salary-slip/application/facades/pdf-processing.facade.ts

/**
 * PDF処理ファサード
 * 
 * @description PDF処理の複雑なサブシステムを単純なインターフェースで提供
 */
export class PdfProcessingFacade {
  constructor(
    private readonly pdfValidator: PdfValidator,
    private readonly ocrService: OcrService,
    private readonly textExtractor: TextExtractor,
    private readonly dataParser: SalarySlipDataParser,
    private readonly confidenceAnalyzer: ConfidenceAnalyzer,
    private readonly duplicateDetector: DuplicateDetector,
    private readonly fileStorage: FileStorage,
    private readonly auditLogger: AuditLogger
  ) {}

  /**
   * PDF から給料明細データを抽出する統合メソッド
   */
  async processPdfFiles(
    userId: EntityId,
    files: PdfFile[],
    options: ProcessingOptions = {}
  ): Promise<PdfProcessingResult> {
    const processingId = cuid();
    
    this.auditLogger.logProcessingStart(processingId, userId, files.length);

    try {
      // ステップ1: ファイル検証
      const validationResults = await this.validateFiles(files);
      const validFiles = validationResults.filter(r => r.isValid).map(r => r.file);
      
      if (validFiles.length === 0) {
        throw new NoValidFilesError('No valid PDF files to process');
      }

      // ステップ2: 並列でOCR処理
      const ocrResults = await this.performOcrProcessing(validFiles, options.ocrOptions);

      // ステップ3: テキスト抽出と構造化
      const extractionResults = await this.extractStructuredData(ocrResults);

      // ステップ4: データ解析と検証
      const parsingResults = await this.parseAndValidateData(extractionResults);

      // ステップ5: 重複チェック
      const deduplicationResults = await this.checkForDuplicates(
        userId, 
        parsingResults,
        options.allowDuplicates
      );

      // ステップ6: ファイル保存（オプション）
      if (options.saveOriginalFiles) {
        await this.saveOriginalFiles(processingId, validFiles);
      }

      // ステップ7: 結果集計
      const finalResults = this.aggregateResults(
        validationResults,
        deduplicationResults,
        options
      );

      this.auditLogger.logProcessingComplete(processingId, finalResults);

      return finalResults;

    } catch (error) {
      this.auditLogger.logProcessingError(processingId, error);
      throw new PdfProcessingError(`PDF processing failed: ${error.message}`, error);
    }
  }

  /**
   * 単一PDFファイルの高速処理
   */
  async processSignlePdfFile(
    userId: EntityId,
    file: PdfFile,
    options: SingleFileProcessingOptions = {}
  ): Promise<SingleFileProcessingResult> {
    const processingId = cuid();
    
    try {
      // 簡略化された処理パイプライン
      const validationResult = await this.pdfValidator.validate(file);
      if (!validationResult.isValid) {
        throw new InvalidPdfFileError(validationResult.errors);
      }

      const ocrResult = await this.ocrService.extractText(file, {
        language: options.language || 'jpn',
        confidenceThreshold: options.confidenceThreshold || 0.7
      });

      const extractedData = await this.textExtractor.extractSalarySlipData(
        ocrResult.text,
        ocrResult.confidence
      );

      const parsedData = await this.dataParser.parse(extractedData);
      
      const confidence = this.confidenceAnalyzer.calculateOverallConfidence([
        ocrResult.confidence,
        parsedData.confidence
      ]);

      // 最小限の重複チェック（パフォーマンス重視）
      const hasDuplicate = await this.duplicateDetector.quickCheck(
        userId,
        parsedData.paymentDate,
        parsedData.companyName
      );

      return SingleFileProcessingResult.create({
        fileName: file.name,
        success: true,
        extractedData: parsedData,
        confidence,
        hasDuplicate,
        processingTime: Date.now() - processingId.timestamp
      });

    } catch (error) {
      return SingleFileProcessingResult.create({
        fileName: file.name,
        success: false,
        error,
        processingTime: Date.now() - processingId.timestamp
      });
    }
  }

  /**
   * バッチ処理の進捗監視
   */
  async monitorBatchProgress(batchId: string): Promise<BatchProgressStatus> {
    // Redis やメモリを使った進捗状況の監視実装
    return this.getBatchStatus(batchId);
  }

  // プライベートメソッド群
  private async validateFiles(files: PdfFile[]): Promise<FileValidationResult[]> {
    return Promise.all(
      files.map(file => this.pdfValidator.validate(file))
    );
  }

  private async performOcrProcessing(
    files: PdfFile[],
    ocrOptions?: OcrOptions
  ): Promise<OcrResult[]> {
    const concurrency = Math.min(files.length, 3); // 最大3ファイル並列処理
    
    return pMap(files, async (file) => {
      return this.ocrService.extractText(file, ocrOptions);
    }, { concurrency });
  }

  private async extractStructuredData(ocrResults: OcrResult[]): Promise<ExtractionResult[]> {
    return Promise.all(
      ocrResults.map(result => 
        this.textExtractor.extractSalarySlipData(result.text, result.confidence)
      )
    );
  }

  private async parseAndValidateData(
    extractionResults: ExtractionResult[]
  ): Promise<ParsedSalarySlipData[]> {
    return Promise.all(
      extractionResults.map(result => this.dataParser.parse(result))
    );
  }

  private async checkForDuplicates(
    userId: EntityId,
    parsedData: ParsedSalarySlipData[],
    allowDuplicates: boolean = false
  ): Promise<DeduplicationResult[]> {
    if (allowDuplicates) {
      return parsedData.map(data => ({ data, isDuplicate: false }));
    }

    return Promise.all(
      parsedData.map(async data => {
        const isDuplicate = await this.duplicateDetector.check(
          userId,
          data.paymentDate,
          data.companyName,
          data.employeeName
        );
        return { data, isDuplicate };
      })
    );
  }

  private async saveOriginalFiles(
    processingId: string,
    files: PdfFile[]
  ): Promise<void> {
    await Promise.all(
      files.map(file => 
        this.fileStorage.saveFile(
          `processing/${processingId}/${file.name}`,
          file.buffer
        )
      )
    );
  }

  private aggregateResults(
    validationResults: FileValidationResult[],
    deduplicationResults: DeduplicationResult[],
    options: ProcessingOptions
  ): PdfProcessingResult {
    const successfulResults = deduplicationResults.filter(r => !r.isDuplicate);
    const duplicateResults = deduplicationResults.filter(r => r.isDuplicate);
    const failedResults = validationResults.filter(r => !r.isValid);

    return PdfProcessingResult.create({
      totalFiles: validationResults.length,
      successCount: successfulResults.length,
      duplicateCount: duplicateResults.length,
      failureCount: failedResults.length,
      results: deduplicationResults,
      processingTime: Date.now(),
      options
    });
  }

  private async getBatchStatus(batchId: string): Promise<BatchProgressStatus> {
    // 実装: Redis等からバッチ処理の進捗を取得
    return {
      batchId,
      status: 'processing',
      totalFiles: 10,
      processedFiles: 7,
      successCount: 5,
      failureCount: 1,
      duplicateCount: 1,
      estimatedTimeRemaining: 120000
    };
  }
}
```

---

## 4. 振舞パターン (Behavioral Patterns)

### 4.1 Strategy Pattern

#### 4.1.1 Notification Strategy

```typescript
// src/shared/infrastructure/notification/strategies/notification.strategy.ts

/**
 * 通知戦略インターフェース
 */
export interface NotificationStrategy {
  send(notification: NotificationRequest): Promise<NotificationResult>;
  isAvailable(): Promise<boolean>;
  getType(): NotificationType;
  getPriority(): number; // 優先度（数値が低いほど優先）
}

/**
 * 通知コンテキスト
 */
export class NotificationContext {
  private strategies: Map<NotificationType, NotificationStrategy[]> = new Map();
  private fallbackStrategies: NotificationStrategy[] = [];

  constructor(private readonly logger: Logger) {}

  public registerStrategy(strategy: NotificationStrategy): void {
    const type = strategy.getType();
    
    if (!this.strategies.has(type)) {
      this.strategies.set(type, []);
    }
    
    this.strategies.get(type)!.push(strategy);
    
    // 優先度順にソート
    this.strategies.get(type)!.sort((a, b) => a.getPriority() - b.getPriority());
  }

  public registerFallbackStrategy(strategy: NotificationStrategy): void {
    this.fallbackStrategies.push(strategy);
    this.fallbackStrategies.sort((a, b) => a.getPriority() - b.getPriority());
  }

  public async send(request: NotificationRequest): Promise<NotificationResult> {
    const strategies = this.strategies.get(request.type) || [];
    
    // プライマリー戦略を試行
    for (const strategy of strategies) {
      try {
        if (await strategy.isAvailable()) {
          const result = await strategy.send(request);
          if (result.success) {
            return result;
          }
        }
      } catch (error) {
        this.logger.warn(`Notification strategy ${strategy.constructor.name} failed`, {
          error: error.message,
          notificationType: request.type
        });
      }
    }

    // フォールバック戦略を試行
    for (const strategy of this.fallbackStrategies) {
      try {
        if (await strategy.isAvailable()) {
          const result = await strategy.send(request);
          if (result.success) {
            this.logger.info(`Fallback notification strategy succeeded`, {
              strategy: strategy.constructor.name,
              originalType: request.type
            });
            return result;
          }
        }
      } catch (error) {
        this.logger.error(`Fallback notification strategy failed`, {
          strategy: strategy.constructor.name,
          error: error.message
        });
      }
    }

    return NotificationResult.failure('All notification strategies failed');
  }
}

/**
 * メール通知戦略
 */
export class EmailNotificationStrategy implements NotificationStrategy {
  constructor(
    private readonly emailService: EmailService,
    private readonly templateEngine: TemplateEngine,
    private readonly userRepository: UserRepository
  ) {}

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      // ユーザー情報取得
      const user = await this.userRepository.findById(notification.userId);
      if (!user) {
        return NotificationResult.failure('User not found');
      }

      // ユーザーの通知設定確認
      if (!user.preferences.notificationEmail) {
        return NotificationResult.skipped('User disabled email notifications');
      }

      // テンプレート適用
      const emailContent = await this.templateEngine.render(
        this.getTemplate(notification.type),
        {
          user,
          notification,
          unsubscribeUrl: this.generateUnsubscribeUrl(user.id)
        }
      );

      // メール送信
      await this.emailService.send({
        to: user.email.value,
        subject: notification.title,
        html: emailContent.html,
        text: emailContent.text
      });

      return NotificationResult.success('Email sent successfully');

    } catch (error) {
      return NotificationResult.failure(`Email sending failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.emailService.isHealthy();
  }

  getType(): NotificationType {
    return NotificationType.EMAIL;
  }

  getPriority(): number {
    return 1;
  }

  private getTemplate(type: string): string {
    const templates = {
      'SALARY_SLIP_CREATED': 'salary-slip-created',
      'STOCK_PRICE_ALERT': 'stock-price-alert',
      'PORTFOLIO_REBALANCE': 'portfolio-rebalance-reminder',
      'USER_REGISTERED': 'welcome-email'
    };
    return templates[type] || 'generic-notification';
  }

  private generateUnsubscribeUrl(userId: EntityId): string {
    return `${process.env.APP_URL}/unsubscribe?token=${this.createUnsubscribeToken(userId)}`;
  }

  private createUnsubscribeToken(userId: EntityId): string {
    // 実装: JWT トークン生成
    return 'unsubscribe_token';
  }
}

/**
 * プッシュ通知戦略
 */
export class PushNotificationStrategy implements NotificationStrategy {
  constructor(
    private readonly webPushService: WebPushService,
    private readonly deviceRepository: DeviceRepository
  ) {}

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    try {
      // ユーザーのデバイス情報取得
      const devices = await this.deviceRepository.findActiveDevicesByUserId(notification.userId);
      
      if (devices.length === 0) {
        return NotificationResult.skipped('No active devices found for push notification');
      }

      // 全デバイスに並列送信
      const sendPromises = devices.map(device =>
        this.webPushService.sendNotification(device.pushSubscription, {
          title: notification.title,
          body: notification.message,
          icon: '/icons/notification-icon.png',
          badge: '/icons/badge-icon.png',
          data: notification.data,
          actions: this.generateNotificationActions(notification.type),
          requireInteraction: notification.priority === 'high',
          tag: notification.type,
          timestamp: Date.now()
        })
      );

      const results = await Promise.allSettled(sendPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        return NotificationResult.success(
          `Push notification sent to ${successCount}/${devices.length} devices`
        );
      } else {
        return NotificationResult.failure('Push notification failed for all devices');
      }

    } catch (error) {
      return NotificationResult.failure(`Push notification failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.webPushService.isConfigured();
  }

  getType(): NotificationType {
    return NotificationType.PUSH;
  }

  getPriority(): number {
    return 2;
  }

  private generateNotificationActions(type: string): NotificationAction[] {
    const actionMap: Record<string, NotificationAction[]> = {
      'SALARY_SLIP_CREATED': [
        { action: 'view', title: '確認', icon: '/icons/view.png' },
        { action: 'dismiss', title: '閉じる', icon: '/icons/close.png' }
      ],
      'STOCK_PRICE_ALERT': [
        { action: 'view_portfolio', title: 'ポートフォリオを見る', icon: '/icons/portfolio.png' },
        { action: 'dismiss', title: '閉じる', icon: '/icons/close.png' }
      ]
    };

    return actionMap[type] || [];
  }
}

/**
 * SMS通知戦略（緊急時用）
 */
export class SmsNotificationStrategy implements NotificationStrategy {
  constructor(
    private readonly smsService: SmsService,
    private readonly userRepository: UserRepository
  ) {}

  async send(notification: NotificationRequest): Promise<NotificationResult> {
    // 緊急性の高い通知のみSMSで送信
    if (notification.priority !== 'high') {
      return NotificationResult.skipped('SMS reserved for high priority notifications');
    }

    try {
      const user = await this.userRepository.findById(notification.userId);
      if (!user || !user.phoneNumber) {
        return NotificationResult.failure('User phone number not available');
      }

      await this.smsService.send({
        to: user.phoneNumber,
        message: this.formatSmsMessage(notification)
      });

      return NotificationResult.success('SMS sent successfully');

    } catch (error) {
      return NotificationResult.failure(`SMS sending failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.smsService.isHealthy();
  }

  getType(): NotificationType {
    return NotificationType.SMS;
  }

  getPriority(): number {
    return 10; // 低優先度（フォールバック用）
  }

  private formatSmsMessage(notification: NotificationRequest): string {
    // SMS用に短縮されたメッセージ形式
    return `[給料管理] ${notification.title} ${notification.message}`;
  }
}
```

### 4.2 Observer Pattern

#### 4.2.1 Event Bus Implementation

```typescript
// src/shared/infrastructure/events/event-bus.ts

/**
 * ドメインイベントバス
 * 
 * @description Observer パターンによるイベント駆動アーキテクチャの実装
 */
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
  clear(): void;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  getEventType(): string;
  getPriority(): number;
}

/**
 * インメモリ Event Bus 実装
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandlerRegistration[]>();
  private readonly eventQueue: QueuedEvent[] = [];
  private isProcessing = false;

  constructor(
    private readonly logger: Logger,
    private readonly retryPolicy: RetryPolicy = new ExponentialBackoffRetry(3)
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.debug(`Publishing event: ${event.eventType}`, {
      eventId: event.eventId,
      aggregateId: event.aggregateId.value
    });

    this.eventQueue.push({
      event,
      publishedAt: new Date(),
      retryCount: 0
    });

    // 非同期でイベント処理開始
    setImmediate(() => this.processEventQueue());
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const registration = new EventHandlerRegistration(handler, new Date());
    this.handlers.get(eventType)!.push(registration);

    // 優先度順にソート
    this.handlers.get(eventType)!.sort(
      (a, b) => a.handler.getPriority() - b.handler.getPriority()
    );

    this.logger.debug(`Event handler registered for ${eventType}`, {
      handlerName: handler.constructor.name,
      priority: handler.getPriority()
    });
  }

  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex(reg => reg.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.logger.debug(`Event handler unregistered for ${eventType}`, {
          handlerName: handler.constructor.name
        });
      }
    }
  }

  clear(): void {
    this.handlers.clear();
    this.eventQueue.length = 0;
    this.logger.debug('Event bus cleared');
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift()!;
        await this.processEvent(queuedEvent);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(queuedEvent: QueuedEvent): Promise<void> {
    const { event } = queuedEvent;
    const handlers = this.handlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      this.logger.warn(`No handlers registered for event type: ${event.eventType}`, {
        eventId: event.eventId
      });
      return;
    }

    // 並列でハンドラーを実行
    const handlerPromises = handlers.map(registration => 
      this.executeHandler(registration.handler, event, queuedEvent)
    );

    await Promise.allSettled(handlerPromises);
  }

  private async executeHandler(
    handler: EventHandler<any>,
    event: DomainEvent,
    queuedEvent: QueuedEvent
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await this.retryPolicy.execute(async () => {
        await handler.handle(event);
      });

      this.logger.debug(`Event handler completed successfully`, {
        handlerName: handler.constructor.name,
        eventId: event.eventId,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      this.logger.error(`Event handler failed after retries`, {
        handlerName: handler.constructor.name,
        eventId: event.eventId,
        eventType: event.eventType,
        error: error.message,
        retryCount: queuedEvent.retryCount,
        processingTime: Date.now() - startTime
      });

      // Dead Letter Queue に移動（実装は省略）
      this.moveToDeadLetterQueue(queuedEvent, error);
    }
  }

  private moveToDeadLetterQueue(queuedEvent: QueuedEvent, error: Error): void {
    // 実装: 失敗したイベントをDead Letter Queueに移動
    this.logger.error('Moving event to dead letter queue', {
      eventId: queuedEvent.event.eventId,
      eventType: queuedEvent.event.eventType,
      error: error.message
    });
  }
}

/**
 * Redis Event Bus 実装（分散環境用）
 */
export class RedisEventBus implements EventBus {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly serviceName: string
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const eventData = JSON.stringify(event.toJSON());
    
    await this.redis.publish(`events:${event.eventType}`, eventData);
    
    this.logger.debug(`Event published to Redis`, {
      eventId: event.eventId,
      eventType: event.eventType,
      channel: `events:${event.eventType}`
    });
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const event of events) {
      const eventData = JSON.stringify(event.toJSON());
      pipeline.publish(`events:${event.eventType}`, eventData);
    }
    
    await pipeline.exec();
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const subscriber = this.redis.duplicate();
    
    subscriber.subscribe(`events:${eventType}`, (error, count) => {
      if (error) {
        this.logger.error('Redis subscription error', { error, eventType });
        return;
      }
      
      this.logger.debug(`Subscribed to event type: ${eventType}`);
    });

    subscriber.on('message', async (channel, message) => {
      try {
        const eventData = JSON.parse(message);
        const event = this.deserializeEvent(eventData);
        
        await handler.handle(event as T);
        
      } catch (error) {
        this.logger.error('Event handling error', {
          error: error.message,
          channel,
          handlerName: handler.constructor.name
        });
      }
    });
  }

  unsubscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    // Redis購読の解除実装
    this.logger.debug(`Unsubscribed from event type: ${eventType}`);
  }

  clear(): void {
    // 実装: Redis購読のクリア
  }

  private deserializeEvent(eventData: any): DomainEvent {
    // 実装: JSON データからドメインイベントオブジェクトを復元
    const factory = DomainEventFactory.create();
    return factory.createEvent(eventData.eventType, eventData.data);
  }
}

interface QueuedEvent {
  event: DomainEvent;
  publishedAt: Date;
  retryCount: number;
}

class EventHandlerRegistration {
  constructor(
    public readonly handler: EventHandler<any>,
    public readonly registeredAt: Date
  ) {}
}
```

### 4.3 Command Pattern

#### 4.3.1 Command Bus Implementation

```typescript
// src/shared/application/commands/command-bus.ts

/**
 * コマンドバス
 * 
 * @description Command パターンによる処理要求の抽象化
 */
export interface CommandBus {
  execute<TResult>(command: Command<TResult>): Promise<TResult>;
  register<TCommand extends Command<any>>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void;
}

export interface Command<TResult = any> {
  getType(): string;
  validate(): ValidationResult;
}

export interface CommandHandler<TCommand extends Command<any>> {
  handle(command: TCommand): Promise<any>;
  getCommandType(): string;
}

/**
 * インメモリ Command Bus 実装
 */
export class InMemoryCommandBus implements CommandBus {
  private readonly handlers = new Map<string, CommandHandler<any>>();
  private readonly middleware: CommandMiddleware[] = [];

  constructor(private readonly logger: Logger) {}

  async execute<TResult>(command: Command<TResult>): Promise<TResult> {
    this.logger.debug(`Executing command: ${command.getType()}`);

    // コマンド検証
    const validationResult = command.validate();
    if (!validationResult.isValid) {
      throw new CommandValidationError(
        'Command validation failed',
        validationResult.errors
      );
    }

    // ハンドラー取得
    const handler = this.handlers.get(command.getType());
    if (!handler) {
      throw new CommandHandlerNotFoundError(command.getType());
    }

    // ミドルウェアチェーンを通してコマンドを実行
    const pipeline = this.buildMiddlewarePipeline(handler);
    return pipeline.execute(command);
  }

  register<TCommand extends Command<any>>(
    commandType: string,
    handler: CommandHandler<TCommand>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new DuplicateCommandHandlerError(commandType);
    }

    this.handlers.set(commandType, handler);
    this.logger.debug(`Command handler registered: ${commandType}`, {
      handlerName: handler.constructor.name
    });
  }

  addMiddleware(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  private buildMiddlewarePipeline(handler: CommandHandler<any>): MiddlewarePipeline {
    return new MiddlewarePipeline([...this.middleware], handler, this.logger);
  }
}

/**
 * コマンドミドルウェア基底クラス
 */
export abstract class CommandMiddleware {
  abstract execute<TResult>(
    command: Command<TResult>,
    next: (command: Command<TResult>) => Promise<TResult>
  ): Promise<TResult>;
}

/**
 * ログミドルウェア
 */
export class LoggingMiddleware extends CommandMiddleware {
  constructor(private readonly logger: Logger) {
    super();
  }

  async execute<TResult>(
    command: Command<TResult>,
    next: (command: Command<TResult>) => Promise<TResult>
  ): Promise<TResult> {
    const startTime = Date.now();
    const commandType = command.getType();

    this.logger.info(`Command execution started`, { commandType });

    try {
      const result = await next(command);
      const duration = Date.now() - startTime;

      this.logger.info(`Command execution completed`, {
        commandType,
        duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Command execution failed`, {
        commandType,
        duration,
        error: error.message
      });

      throw error;
    }
  }
}

/**
 * トランザクションミドルウェア
 */
export class TransactionMiddleware extends CommandMiddleware {
  constructor(private readonly unitOfWork: UnitOfWork) {
    super();
  }

  async execute<TResult>(
    command: Command<TResult>,
    next: (command: Command<TResult>) => Promise<TResult>
  ): Promise<TResult> {
    return this.unitOfWork.withTransaction(async () => {
      return next(command);
    });
  }
}

/**
 * 認可ミドルウェア
 */
export class AuthorizationMiddleware extends CommandMiddleware {
  constructor(private readonly authorizationService: AuthorizationService) {
    super();
  }

  async execute<TResult>(
    command: Command<TResult>,
    next: (command: Command<TResult>) => Promise<TResult>
  ): Promise<TResult> {
    const isAuthorized = await this.authorizationService.authorize(command);
    
    if (!isAuthorized) {
      throw new UnauthorizedCommandError(command.getType());
    }

    return next(command);
  }
}

/**
 * ミドルウェアパイプライン
 */
class MiddlewarePipeline {
  constructor(
    private readonly middleware: CommandMiddleware[],
    private readonly handler: CommandHandler<any>,
    private readonly logger: Logger
  ) {}

  async execute<TResult>(command: Command<TResult>): Promise<TResult> {
    let index = 0;

    const next = async (cmd: Command<TResult>): Promise<TResult> => {
      if (index >= this.middleware.length) {
        // 全ミドルウェアを通過、ハンドラーを実行
        return this.handler.handle(cmd);
      }

      const middleware = this.middleware[index++];
      return middleware.execute(cmd, next);
    };

    return next(command);
  }
}

// 使用例: Create Salary Slip Command
export class CreateSalarySlipFromPdfCommand implements Command<SalarySlipCreationResult> {
  constructor(
    public readonly userId: EntityId,
    public readonly files: PdfFile[],
    public readonly options: ProcessingOptions = {}
  ) {}

  getType(): string {
    return 'CreateSalarySlipFromPdf';
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.files || this.files.length === 0) {
      errors.push('At least one PDF file is required');
    }

    if (this.files && this.files.length > 10) {
      errors.push('Maximum 10 files allowed');
    }

    return ValidationResult.create(errors.length === 0, errors);
  }
}

export class CreateSalarySlipFromPdfCommandHandler 
  implements CommandHandler<CreateSalarySlipFromPdfCommand> {
  
  constructor(private readonly useCase: CreateSalarySlipFromPdfUseCase) {}

  async handle(command: CreateSalarySlipFromPdfCommand): Promise<SalarySlipCreationResult> {
    return this.useCase.execute(command);
  }

  getCommandType(): string {
    return 'CreateSalarySlipFromPdf';
  }
}
```

### 4.4 State Pattern

#### 4.4.1 Salary Slip State Machine

```typescript
// src/entities/salary-slip/domain/states/salary-slip.state.ts

/**
 * 給料明細状態インターフェース
 */
export interface SalarySlipState {
  getStatus(): SalarySlipStatus;
  canConfirm(): boolean;
  canArchive(): boolean;
  canEdit(): boolean;
  canDelete(): boolean;
  confirm(context: SalarySlipStateContext): void;
  archive(context: SalarySlipStateContext): void;
  edit(context: SalarySlipStateContext, changes: Partial<SalarySlipData>): void;
  delete(context: SalarySlipStateContext): void;
}

/**
 * 給料明細状態コンテキスト
 */
export class SalarySlipStateContext {
  private state: SalarySlipState;

  constructor(
    private readonly salarySlip: SalarySlip,
    initialState?: SalarySlipState
  ) {
    this.state = initialState || this.createInitialState();
  }

  public setState(state: SalarySlipState): void {
    this.state = state;
  }

  public getState(): SalarySlipState {
    return this.state;
  }

  public getStatus(): SalarySlipStatus {
    return this.state.getStatus();
  }

  public canConfirm(): boolean {
    return this.state.canConfirm();
  }

  public canArchive(): boolean {
    return this.state.canArchive();
  }

  public canEdit(): boolean {
    return this.state.canEdit();
  }

  public canDelete(): boolean {
    return this.state.canDelete();
  }

  public confirm(): void {
    if (!this.state.canConfirm()) {
      throw new InvalidStateTransitionError(
        this.state.getStatus(),
        SalarySlipStatus.CONFIRMED
      );
    }
    this.state.confirm(this);
  }

  public archive(): void {
    if (!this.state.canArchive()) {
      throw new InvalidStateTransitionError(
        this.state.getStatus(),
        SalarySlipStatus.ARCHIVED
      );
    }
    this.state.archive(this);
  }

  public edit(changes: Partial<SalarySlipData>): void {
    if (!this.state.canEdit()) {
      throw new InvalidStateOperationError('edit', this.state.getStatus());
    }
    this.state.edit(this, changes);
  }

  public delete(): void {
    if (!this.state.canDelete()) {
      throw new InvalidStateOperationError('delete', this.state.getStatus());
    }
    this.state.delete(this);
  }

  public getSalarySlip(): SalarySlip {
    return this.salarySlip;
  }

  private createInitialState(): SalarySlipState {
    switch (this.salarySlip.status) {
      case SalarySlipStatus.DRAFT:
        return new DraftState();
      case SalarySlipStatus.CONFIRMED:
        return new ConfirmedState();
      case SalarySlipStatus.ARCHIVED:
        return new ArchivedState();
      default:
        throw new UnknownStateError(this.salarySlip.status);
    }
  }
}

/**
 * 下書き状態
 */
export class DraftState implements SalarySlipState {
  getStatus(): SalarySlipStatus {
    return SalarySlipStatus.DRAFT;
  }

  canConfirm(): boolean {
    return true;
  }

  canArchive(): boolean {
    return false; // 下書きから直接アーカイブはできない
  }

  canEdit(): boolean {
    return true;
  }

  canDelete(): boolean {
    return true;
  }

  confirm(context: SalarySlipStateContext): void {
    // ビジネスルール検証
    this.validateForConfirmation(context.getSalarySlip());
    
    // 状態遷移
    context.setState(new ConfirmedState());
    
    // 給料明細エンティティの状態更新
    context.getSalarySlip().markAsConfirmed();
  }

  archive(context: SalarySlipStateContext): void {
    throw new InvalidStateTransitionError(
      SalarySlipStatus.DRAFT,
      SalarySlipStatus.ARCHIVED
    );
  }

  edit(context: SalarySlipStateContext, changes: Partial<SalarySlipData>): void {
    const salarySlip = context.getSalarySlip();
    
    // 編集可能フィールドの検証
    this.validateEditableFields(changes);
    
    // 変更適用
    this.applyChanges(salarySlip, changes);
  }

  delete(context: SalarySlipStateContext): void {
    // 下書き状態では削除可能
    context.getSalarySlip().markAsDeleted();
  }

  private validateForConfirmation(salarySlip: SalarySlip): void {
    const errors: string[] = [];

    if (salarySlip.netPay.isNegative()) {
      errors.push('手取り金額がマイナスです');
    }

    if (salarySlip.totalEarnings.isZero()) {
      errors.push('総収入が0です');
    }

    if (errors.length > 0) {
      throw new SalarySlipValidationError('確定できません', errors);
    }
  }

  private validateEditableFields(changes: Partial<SalarySlipData>): void {
    // 下書き状態では全フィールド編集可能
    // 特別な制限はなし
  }

  private applyChanges(salarySlip: SalarySlip, changes: Partial<SalarySlipData>): void {
    if (changes.earnings) {
      salarySlip.updateEarnings(changes.earnings);
    }
    if (changes.deductions) {
      salarySlip.updateDeductions(changes.deductions);
    }
    if (changes.attendance) {
      salarySlip.updateAttendance(changes.attendance);
    }
  }
}

/**
 * 確定状態
 */
export class ConfirmedState implements SalarySlipState {
  getStatus(): SalarySlipStatus {
    return SalarySlipStatus.CONFIRMED;
  }

  canConfirm(): boolean {
    return false; // 既に確定済み
  }

  canArchive(): boolean {
    return true;
  }

  canEdit(): boolean {
    return true; // 限定的な編集のみ可能
  }

  canDelete(): boolean {
    return false; // 確定済みは削除不可
  }

  confirm(context: SalarySlipStateContext): void {
    throw new InvalidStateOperationError('confirm', SalarySlipStatus.CONFIRMED);
  }

  archive(context: SalarySlipStateContext): void {
    // アーカイブ条件の確認
    this.validateForArchiving(context.getSalarySlip());
    
    // 状態遷移
    context.setState(new ArchivedState());
    
    // 給料明細エンティティの状態更新
    context.getSalarySlip().markAsArchived();
  }

  edit(context: SalarySlipStateContext, changes: Partial<SalarySlipData>): void {
    // 確定状態では限定的な編集のみ許可
    this.validateLimitedEditFields(changes);
    
    const salarySlip = context.getSalarySlip();
    this.applyLimitedChanges(salarySlip, changes);
  }

  delete(context: SalarySlipStateContext): void {
    throw new InvalidStateOperationError('delete', SalarySlipStatus.CONFIRMED);
  }

  private validateForArchiving(salarySlip: SalarySlip): void {
    // アーカイブ可能条件の確認
    const currentDate = new Date();
    const paymentDate = salarySlip.paymentDate;
    const daysDiff = Math.floor(
      (currentDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 365) { // 1年未満はアーカイブ不可
      throw new SalarySlipValidationError(
        '1年以上経過した給料明細のみアーカイブできます'
      );
    }
  }

  private validateLimitedEditFields(changes: Partial<SalarySlipData>): void {
    const allowedFields = ['notes', 'tags']; // 確定後は備考とタグのみ編集可能
    
    const changedFields = Object.keys(changes);
    const forbiddenFields = changedFields.filter(field => !allowedFields.includes(field));
    
    if (forbiddenFields.length > 0) {
      throw new InvalidEditOperationError(
        `確定済みの給料明細では以下のフィールドは編集できません: ${forbiddenFields.join(', ')}`
      );
    }
  }

  private applyLimitedChanges(salarySlip: SalarySlip, changes: Partial<SalarySlipData>): void {
    // 限定的な変更のみ適用
    if (changes.notes) {
      salarySlip.updateNotes(changes.notes);
    }
    if (changes.tags) {
      salarySlip.updateTags(changes.tags);
    }
  }
}

/**
 * アーカイブ状態
 */
export class ArchivedState implements SalarySlipState {
  getStatus(): SalarySlipStatus {
    return SalarySlipStatus.ARCHIVED;
  }

  canConfirm(): boolean {
    return false;
  }

  canArchive(): boolean {
    return false;
  }

  canEdit(): boolean {
    return false; // アーカイブ済みは編集不可
  }

  canDelete(): boolean {
    return false; // アーカイブ済みは削除不可
  }

  confirm(context: SalarySlipStateContext): void {
    throw new InvalidStateOperationError('confirm', SalarySlipStatus.ARCHIVED);
  }

  archive(context: SalarySlipStateContext): void {
    throw new InvalidStateOperationError('archive', SalarySlipStatus.ARCHIVED);
  }

  edit(context: SalarySlipStateContext, changes: Partial<SalarySlipData>): void {
    throw new InvalidStateOperationError('edit', SalarySlipStatus.ARCHIVED);
  }

  delete(context: SalarySlipStateContext): void {
    throw new InvalidStateOperationError('delete', SalarySlipStatus.ARCHIVED);
  }
}
```

---

## 5. アーキテクチャパターン

### 5.1 CQRS (Command Query Responsibility Segregation)

#### 5.1.1 Read/Write Model分離

```typescript
// src/shared/application/cqrs/read-model.ts

/**
 * 読み取りモデル基底インターフェース
 */
export interface ReadModel {
  readonly id: string;
  readonly version: number;
  readonly lastUpdated: Date;
}

/**
 * 給料明細リストビューモデル
 */
export interface SalarySlipListReadModel extends ReadModel {
  readonly userId: string;
  readonly companyName: string;
  readonly employeeName: string;
  readonly paymentDate: string;
  readonly displayMonth: string;
  readonly totalEarnings: string;
  readonly totalDeductions: string;
  readonly netPay: string;
  readonly currency: string;
  readonly status: SalarySlipStatus;
  readonly sourceType: SalarySlipSourceType;
  readonly overtimeHours: number;
  readonly hasAttachment: boolean;
  readonly tags: string[];
}

/**
 * 給料明細統計読み取りモデル
 */
export interface SalarySlipStatisticsReadModel extends ReadModel {
  readonly userId: string;
  readonly year: number;
  readonly totalAnnualIncome: string;
  readonly averageMonthlyIncome: string;
  readonly totalTax: string;
  readonly averageOvertimeHours: number;
  readonly incomeGrowthRate: number;
  readonly monthlyBreakdown: MonthlyStatistic[];
  readonly categoryBreakdown: CategoryBreakdown[];
  readonly generatedAt: Date;
}

/**
 * 読み取りモデル更新サービス
 */
export class ReadModelUpdateService {
  constructor(
    private readonly salarySlipReadModelRepository: SalarySlipReadModelRepository,
    private readonly statisticsReadModelRepository: StatisticsReadModelRepository,
    private readonly eventStore: EventStore,
    private readonly logger: Logger
  ) {}

  @EventHandler(SalarySlipCreatedEvent)
  async handleSalarySlipCreated(event: SalarySlipCreatedEvent): Promise<void> {
    const readModel: SalarySlipListReadModel = {
      id: event.salarySlip.id.value,
      version: 1,
      lastUpdated: new Date(),
      userId: event.salarySlip.userId.value,
      companyName: event.salarySlip.companyName,
      employeeName: event.salarySlip.employeeName,
      paymentDate: event.salarySlip.paymentDate.toISOString(),
      displayMonth: this.formatDisplayMonth(event.salarySlip.paymentDate),
      totalEarnings: event.salarySlip.totalEarnings.value,
      totalDeductions: event.salarySlip.totalDeductions.value,
      netPay: event.salarySlip.netPay.value,
      currency: event.salarySlip.currency,
      status: event.salarySlip.status,
      sourceType: event.salarySlip.sourceType,
      overtimeHours: event.salarySlip.attendance.overtimeHours + 
                     event.salarySlip.attendance.overtimeHoursOver60,
      hasAttachment: false, // TODO: 添付ファイル情報を含める
      tags: []
    };

    await this.salarySlipReadModelRepository.save(readModel);

    // 統計読み取りモデルの更新も非同期でトリガー
    await this.updateStatisticsReadModel(event.salarySlip.userId);
  }

  @EventHandler(SalarySlipUpdatedEvent)
  async handleSalarySlipUpdated(event: SalarySlipUpdatedEvent): Promise<void> {
    const existingModel = await this.salarySlipReadModelRepository.findById(
      event.salarySlip.id.value
    );

    if (existingModel) {
      const updatedModel: SalarySlipListReadModel = {
        ...existingModel,
        version: existingModel.version + 1,
        lastUpdated: new Date(),
        totalEarnings: event.salarySlip.totalEarnings.value,
        totalDeductions: event.salarySlip.totalDeductions.value,
        netPay: event.salarySlip.netPay.value,
        status: event.salarySlip.status,
        overtimeHours: event.salarySlip.attendance.overtimeHours + 
                       event.salarySlip.attendance.overtimeHoursOver60
      };

      await this.salarySlipReadModelRepository.save(updatedModel);
      await this.updateStatisticsReadModel(event.salarySlip.userId);
    }
  }

  private async updateStatisticsReadModel(userId: EntityId): Promise<void> {
    // バックグラウンドで統計を再計算
    setImmediate(async () => {
      try {
        const currentYear = new Date().getFullYear();
        const salarySlips = await this.getSalarySlipsForYear(userId, currentYear);
        
        if (salarySlips.length > 0) {
          const statistics = this.calculateStatistics(salarySlips);
          
          const statisticsModel: SalarySlipStatisticsReadModel = {
            id: `${userId.value}_${currentYear}`,
            version: 1,
            lastUpdated: new Date(),
            userId: userId.value,
            year: currentYear,
            ...statistics,
            generatedAt: new Date()
          };

          await this.statisticsReadModelRepository.save(statisticsModel);
        }
      } catch (error) {
        this.logger.error('Failed to update statistics read model', {
          userId: userId.value,
          error: error.message
        });
      }
    });
  }

  private formatDisplayMonth(date: Date): string {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  private async getSalarySlipsForYear(userId: EntityId, year: number): Promise<SalarySlip[]> {
    // 実装: 指定年の給料明細を取得
    return [];
  }

  private calculateStatistics(salarySlips: SalarySlip[]): Partial<SalarySlipStatisticsReadModel> {
    // 実装: 統計計算
    return {};
  }
}
```

### 5.2 Event Sourcing

#### 5.2.1 Event Store Implementation

```typescript
// src/shared/infrastructure/events/event-store.ts

/**
 * イベントストア
 */
export interface EventStore {
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<StoredEvent[]>;
  getAllEvents(fromPosition?: number, maxCount?: number): Promise<StoredEvent[]>;
  createSnapshot(aggregateId: string, snapshot: AggregateSnapshot): Promise<void>;
  getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null>;
}

export interface StoredEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly eventData: any;
  readonly eventVersion: number;
  readonly timestamp: Date;
  readonly position: number;
}

export interface AggregateSnapshot {
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly version: number;
  readonly data: any;
  readonly timestamp: Date;
}

/**
 * PostgreSQL Event Store 実装
 */
export class PostgreSqlEventStore implements EventStore {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventSerializer: EventSerializer,
    private readonly logger: Logger
  ) {}

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    if (events.length === 0) return;

    return this.prisma.$transaction(async (tx) => {
      // 現在のバージョンを確認
      const currentVersion = await this.getCurrentVersion(tx, aggregateId);
      
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but current version is ${currentVersion}`
        );
      }

      // イベントを連番で保存
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;
        
        await tx.storedEvent.create({
          data: {
            eventId: event.eventId,
            aggregateId,
            eventType: event.eventType,
            eventData: this.eventSerializer.serialize(event),
            eventVersion: version,
            timestamp: event.occurredOn
          }
        });
      }

      this.logger.debug(`Saved ${events.length} events for aggregate ${aggregateId}`, {
        aggregateId,
        eventTypes: events.map(e => e.eventType),
        versions: events.map((_, i) => expectedVersion + i + 1)
      });
    });
  }

  async getEvents(aggregateId: string, fromVersion: number = 0): Promise<StoredEvent[]> {
    const events = await this.prisma.storedEvent.findMany({
      where: {
        aggregateId,
        eventVersion: {
          gt: fromVersion
        }
      },
      orderBy: {
        eventVersion: 'asc'
      }
    });

    return events.map(event => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: this.eventSerializer.deserialize(event.eventData, event.eventType),
      eventVersion: event.eventVersion,
      timestamp: event.timestamp,
      position: event.position
    }));
  }

  async getAllEvents(fromPosition: number = 0, maxCount: number = 1000): Promise<StoredEvent[]> {
    const events = await this.prisma.storedEvent.findMany({
      where: {
        position: {
          gt: fromPosition
        }
      },
      orderBy: {
        position: 'asc'
      },
      take: maxCount
    });

    return events.map(event => ({
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      eventType: event.eventType,
      eventData: this.eventSerializer.deserialize(event.eventData, event.eventType),
      eventVersion: event.eventVersion,
      timestamp: event.timestamp,
      position: event.position
    }));
  }

  async createSnapshot(aggregateId: string, snapshot: AggregateSnapshot): Promise<void> {
    await this.prisma.aggregateSnapshot.upsert({
      where: { aggregateId },
      create: {
        aggregateId: snapshot.aggregateId,
        aggregateType: snapshot.aggregateType,
        version: snapshot.version,
        data: snapshot.data,
        timestamp: snapshot.timestamp
      },
      update: {
        version: snapshot.version,
        data: snapshot.data,
        timestamp: snapshot.timestamp
      }
    });

    this.logger.debug(`Snapshot created for aggregate ${aggregateId}`, {
      aggregateId,
      version: snapshot.version
    });
  }

  async getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null> {
    const snapshot = await this.prisma.aggregateSnapshot.findUnique({
      where: { aggregateId }
    });

    if (!snapshot) return null;

    return {
      aggregateId: snapshot.aggregateId,
      aggregateType: snapshot.aggregateType,
      version: snapshot.version,
      data: snapshot.data,
      timestamp: snapshot.timestamp
    };
  }

  private async getCurrentVersion(tx: any, aggregateId: string): Promise<number> {
    const lastEvent = await tx.storedEvent.findFirst({
      where: { aggregateId },
      orderBy: { eventVersion: 'desc' }
    });

    return lastEvent?.eventVersion || 0;
  }
}

/**
 * Event Sourced Aggregate 基底クラス
 */
export abstract class EventSourcedAggregate {
  protected uncommittedEvents: DomainEvent[] = [];
  protected version = 0;

  public getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  public markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }

  public getVersion(): number {
    return this.version;
  }

  protected addEvent(event: DomainEvent): void {
    this.uncommittedEvents.push(event);
    this.apply(event);
  }

  public loadFromHistory(events: StoredEvent[]): void {
    for (const event of events) {
      this.apply(event.eventData);
      this.version = event.eventVersion;
    }
  }

  protected abstract apply(event: DomainEvent): void;
}

/**
 * Event Sourced Salary Slip Aggregate
 */
export class EventSourcedSalarySlip extends EventSourcedAggregate {
  private _id?: EntityId;
  private _userId?: EntityId;
  private _companyName?: string;
  private _employeeName?: string;
  private _paymentDate?: Date;
  private _totalEarnings?: MoneyAmount;
  private _netPay?: MoneyAmount;
  private _status?: SalarySlipStatus;

  public static create(props: CreateSalarySlipProps): EventSourcedSalarySlip {
    const aggregate = new EventSourcedSalarySlip();
    
    const event = new SalarySlipCreatedEvent({
      id: EntityId.generate(),
      userId: props.userId,
      companyName: props.companyName,
      employeeName: props.employeeName,
      employeeId: props.employeeId,
      paymentDate: props.paymentDate,
      earnings: props.earnings,
      deductions: props.deductions,
      currency: props.currency,
      status: SalarySlipStatus.DRAFT,
      sourceType: props.sourceType
    });

    aggregate.addEvent(event);
    return aggregate;
  }

  public confirm(): void {
    if (this._status === SalarySlipStatus.CONFIRMED) {
      throw new SalarySlipError('Already confirmed');
    }

    const event = new SalarySlipConfirmedEvent(this._id!);
    this.addEvent(event);
  }

  protected apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'SalarySlipCreated':
        this.applyCreated(event as SalarySlipCreatedEvent);
        break;
      case 'SalarySlipConfirmed':
        this.applyConfirmed(event as SalarySlipConfirmedEvent);
        break;
      // 他のイベントタイプ...
    }
  }

  private applyCreated(event: SalarySlipCreatedEvent): void {
    this._id = event.data.id;
    this._userId = event.data.userId;
    this._companyName = event.data.companyName;
    this._employeeName = event.data.employeeName;
    this._paymentDate = event.data.paymentDate;
    this._totalEarnings = MoneyAmount.from(event.data.totalEarnings);
    this._netPay = MoneyAmount.from(event.data.netPay);
    this._status = event.data.status;
  }

  private applyConfirmed(event: SalarySlipConfirmedEvent): void {
    this._status = SalarySlipStatus.CONFIRMED;
  }

  // Getters
  public get id(): EntityId { return this._id!; }
  public get userId(): EntityId { return this._userId!; }
  public get companyName(): string { return this._companyName!; }
  public get status(): SalarySlipStatus { return this._status!; }
  // ... 他のgetters
}
```

---

## 6. パターン統合と最適化

### 6.1 パターン連携マトリクス

```typescript
// src/shared/infrastructure/patterns/pattern-coordination.service.ts

/**
 * パターン統合調整サービス
 * 
 * @description 複数のデザインパターンの協調動作を管理
 */
export class PatternCoordinationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStore,
    private readonly cacheService: CacheService,
    private readonly notificationContext: NotificationContext,
    private readonly logger: Logger
  ) {}

  /**
   * 統合処理パイプライン
   * Command -> Event -> Cache -> Notification の流れを調整
   */
  async executeIntegratedWorkflow<TResult>(
    command: Command<TResult>,
    options: WorkflowOptions = {}
  ): Promise<WorkflowResult<TResult>> {
    const workflowId = cuid();
    const startTime = Date.now();

    this.logger.info(`Starting integrated workflow`, {
      workflowId,
      commandType: command.getType(),
      options
    });

    try {
      // 1. Command実行
      const commandResult = await this.commandBus.execute(command);

      // 2. Event処理（非同期）
      if (options.publishEvents !== false) {
        setImmediate(() => this.processEventsAsync(workflowId));
      }

      // 3. Cache更新（必要に応じて）
      if (options.updateCache !== false) {
        setImmediate(() => this.updateCacheAsync(workflowId, command));
      }

      // 4. 通知送信（バックグラウンド）
      if (options.sendNotifications !== false) {
        setImmediate(() => this.sendNotificationsAsync(workflowId, commandResult));
      }

      const processingTime = Date.now() - startTime;

      this.logger.info(`Integrated workflow completed`, {
        workflowId,
        processingTime
      });

      return WorkflowResult.success(commandResult, {
        workflowId,
        processingTime,
        steps: this.getExecutedSteps(options)
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(`Integrated workflow failed`, {
        workflowId,
        error: error.message,
        processingTime
      });

      return WorkflowResult.failure(error, {
        workflowId,
        processingTime
      });
    }
  }

  /**
   * Event Sourcing パターンとの統合
   */
  async executeEventSourcedCommand<TResult>(
    command: Command<TResult>,
    aggregateType: string
  ): Promise<TResult> {
    return this.eventStore.withTransaction(async () => {
      // Event Sourced Aggregate のロード
      const aggregate = await this.loadEventSourcedAggregate(
        command.aggregateId,
        aggregateType
      );

      // Command実行
      const result = await this.commandBus.execute(command);

      // イベント保存
      const uncommittedEvents = aggregate.getUncommittedEvents();
      if (uncommittedEvents.length > 0) {
        await this.eventStore.saveEvents(
          command.aggregateId,
          uncommittedEvents,
          aggregate.getVersion()
        );

        // イベント発行
        for (const event of uncommittedEvents) {
          await this.eventBus.publish(event);
        }

        aggregate.markEventsAsCommitted();
      }

      return result;
    });
  }

  /**
   * CQRS パターンとの統合
   */
  async executeCqrsOperation<TResult>(
    operation: CqrsOperation<TResult>
  ): Promise<TResult> {
    if (operation.isQuery()) {
      // Read Model から取得
      return this.executeQuery(operation.query);
    } else {
      // Command実行 → Read Model更新
      const result = await this.commandBus.execute(operation.command);
      
      // Read Model更新イベント発行
      await this.eventBus.publish(new ReadModelUpdateRequiredEvent(
        operation.command.getType(),
        operation.command.aggregateId
      ));

      return result;
    }
  }

  private async processEventsAsync(workflowId: string): Promise<void> {
    try {
      // 未処理イベントを処理
      this.logger.debug(`Processing events for workflow ${workflowId}`);
      
      // Event Store から最新イベントを取得して処理
      const events = await this.eventStore.getAllEvents();
      
      for (const event of events) {
        await this.eventBus.publish(event.eventData);
      }
      
    } catch (error) {
      this.logger.error(`Event processing failed for workflow ${workflowId}`, {
        error: error.message
      });
    }
  }

  private async updateCacheAsync(workflowId: string, command: Command<any>): Promise<void> {
    try {
      this.logger.debug(`Updating cache for workflow ${workflowId}`);
      
      // Command種別に応じてキャッシュを更新
      const cacheKeys = this.getCacheKeysForCommand(command);
      
      for (const key of cacheKeys) {
        await this.cacheService.deleteByPattern(key);
      }
      
    } catch (error) {
      this.logger.error(`Cache update failed for workflow ${workflowId}`, {
        error: error.message
      });
    }
  }

  private async sendNotificationsAsync(
    workflowId: string,
    result: any
  ): Promise<void> {
    try {
      this.logger.debug(`Sending notifications for workflow ${workflowId}`);
      
      // 結果に基づいて通知を生成・送信
      const notifications = this.generateNotifications(result);
      
      for (const notification of notifications) {
        await this.notificationContext.send(notification);
      }
      
    } catch (error) {
      this.logger.error(`Notification sending failed for workflow ${workflowId}`, {
        error: error.message
      });
    }
  }

  private getCacheKeysForCommand(command: Command<any>): string[] {
    // Command種別に応じてキャッシュキーパターンを返す
    const commandType = command.getType();
    
    switch (commandType) {
      case 'CreateSalarySlipFromPdf':
        return ['salary_slip:*', 'statistics:*', 'dashboard:*'];
      case 'ProcessStockTransaction':
        return ['portfolio:*', 'stock_price:*'];
      default:
        return [];
    }
  }

  private generateNotifications(result: any): NotificationRequest[] {
    // 実行結果に基づいて通知要求を生成
    // 実装は省略
    return [];
  }

  private getExecutedSteps(options: WorkflowOptions): string[] {
    const steps = ['command'];
    
    if (options.publishEvents !== false) steps.push('events');
    if (options.updateCache !== false) steps.push('cache');
    if (options.sendNotifications !== false) steps.push('notifications');
    
    return steps;
  }

  private async loadEventSourcedAggregate(
    aggregateId: string,
    aggregateType: string
  ): Promise<EventSourcedAggregate> {
    // 実装: Event Store からイベントを読み込んでAggregateを復元
    throw new Error('Not implemented');
  }

  private async executeQuery<TResult>(query: any): Promise<TResult> {
    // 実装: Read Model からクエリ実行
    throw new Error('Not implemented');
  }
}

interface WorkflowOptions {
  publishEvents?: boolean;
  updateCache?: boolean;
  sendNotifications?: boolean;
  timeout?: number;
}

class WorkflowResult<TResult> {
  private constructor(
    public readonly success: boolean,
    public readonly data?: TResult,
    public readonly error?: Error,
    public readonly metadata?: any
  ) {}

  static success<T>(data: T, metadata?: any): WorkflowResult<T> {
    return new WorkflowResult(true, data, undefined, metadata);
  }

  static failure<T>(error: Error, metadata?: any): WorkflowResult<T> {
    return new WorkflowResult<T>(false, undefined, error, metadata);
  }
}
```

---

## 7. パフォーマンス最適化パターン

### 7.1 オブジェクトプール

```typescript
// src/shared/infrastructure/patterns/object-pool.ts

/**
 * オブジェクトプールパターン
 * 
 * @description 重いオブジェクトの生成コストを削減
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;
  private readonly maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    maxSize: number = 50
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T {
    let obj = this.available.pop();
    
    if (!obj) {
      obj = this.factory();
    }
    
    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      return; // プールに属さないオブジェクト
    }
    
    this.inUse.delete(obj);
    this.reset(obj);
    
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  size(): { available: number; inUse: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size
    };
  }
}

// 使用例：PDF パーサープール
export const pdfParserPool = new ObjectPool<PdfParser>(
  () => new TesseractPdfParser({
    language: 'jpn',
    psm: 6, // Uniform block of text
    oem: 3  // Default OCR Engine Mode
  }),
  (parser) => {
    parser.reset(); // パーサーの状態をリセット
  },
  5 // 最大5つのパーサーインスタンス
);
```

### 7.2 Flyweight Pattern

```typescript
// src/entities/salary-slip/model/flyweights/attendance-info.flyweight.ts

/**
 * Flyweight パターンによる勤怠情報の最適化
 */
export class AttendanceInfoFlyweight {
  private static instances = new Map<string, AttendanceInfoFlyweight>();
  
  private constructor(
    public readonly overtimeHours: number,
    public readonly lateNightHours: number,
    public readonly holidayWorkDays: number,
    public readonly workingDays: number,
    public readonly scheduledWorkDays: number
  ) {}

  public static getInstance(
    overtimeHours: number,
    lateNightHours: number,
    holidayWorkDays: number,
    workingDays: number,
    scheduledWorkDays: number
  ): AttendanceInfoFlyweight {
    const key = `${overtimeHours}-${lateNightHours}-${holidayWorkDays}-${workingDays}-${scheduledWorkDays}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new AttendanceInfoFlyweight(
        overtimeHours,
        lateNightHours,
        holidayWorkDays,
        workingDays,
        scheduledWorkDays
      ));
    }
    
    return this.instances.get(key)!;
  }

  public calculateContext(
    baseSalary: MoneyAmount,
    overtimeRate: number,
    lateNightRate: number
  ): AttendanceCalculationResult {
    // 外部状態（Context）を使って計算を実行
    const overtimePay = MoneyAmount.multiply(baseSalary, this.overtimeHours * overtimeRate / 100);
    const lateNightPay = MoneyAmount.multiply(baseSalary, this.lateNightHours * lateNightRate / 100);
    
    return new AttendanceCalculationResult(
      overtimePay,
      lateNightPay,
      this.calculateAttendanceRate()
    );
  }

  private calculateAttendanceRate(): number {
    return this.workingDays / this.scheduledWorkDays;
  }

  public static getInstanceCount(): number {
    return this.instances.size;
  }

  public static clearCache(): void {
    this.instances.clear();
  }
}
```

---

## 8. 次のステップ

1. ✅ クラス構造設計
2. ✅ ビジネスロジック設計  
3. ✅ デザインパターン適用設計（本書）
4. → 実装ガイドライン作成
5. → ユニットテスト戦略定義
6. → パフォーマンスチューニング指針
7. → 実装フェーズ開始

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| デザインパターンアーキテクト | デザインパターンアーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | デザインパターンアーキテクト |
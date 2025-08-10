# クラス構造設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: クラス設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ

---

## 1. 設計概要

### 1.1 設計原則

本システムのクラス構造は以下のSOLID原則とDDD（ドメイン駆動設計）の概念に基づいて設計されています：

| 原則 | 適用方法 | 具体例 |
|------|----------|--------|
| **単一責任の原則 (SRP)** | 各クラスは単一の責務を持つ | SalarySlipService、StockPriceService |
| **開放閉鎖原則 (OCP)** | 拡張に開いて、修正に閉じる | PaymentProcessor抽象クラス |
| **リスコフ置換原則 (LSP)** | 派生クラスは基底クラスを置換可能 | 各種Repository実装 |
| **インターフェース分離原則 (ISP)** | クライアントは使用しないメソッドに依存しない | 細分化されたインターフェース |
| **依存関係逆転原則 (DIP)** | 抽象に依存し、具象に依存しない | 依存性注入による抽象依存 |

### 1.2 アーキテクチャレイヤー

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│     (UI Components / API Routes)        │
├─────────────────────────────────────────┤
│           Application Layer             │
│        (Services / Use Cases)           │
├─────────────────────────────────────────┤
│             Domain Layer                │
│    (Entities / Value Objects)           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│    (Repositories / External APIs)       │
└─────────────────────────────────────────┘
```

---

## 2. ドメイン層クラス構造

### 2.1 給料明細ドメイン

#### 2.1.1 SalarySlip エンティティ

```typescript
// src/entities/salary-slip/model/salary-slip.entity.ts

import type { 
  EntityId, 
  MoneyAmount, 
  ISODateString, 
  CurrencyCode 
} from '@/shared/types/common';
import { AttendanceInfo } from './attendance-info.value-object';
import { EarningsDetail } from './earnings-detail.value-object';
import { DeductionsDetail } from './deductions-detail.value-object';

/**
 * 給料明細エンティティ
 * 
 * @description 給料明細の中核となるドメインエンティティ
 * ビジネスルールと不変条件を保持し、関連する計算ロジックを提供
 */
export class SalarySlip {
  private constructor(
    private readonly _id: EntityId,
    private readonly _userId: EntityId,
    private _companyName: string,
    private _employeeName: string,
    private _employeeId: string,
    private _paymentDate: Date,
    private _targetPeriod: DateRange,
    private _attendance: AttendanceInfo,
    private _earnings: EarningsDetail,
    private _deductions: DeductionsDetail,
    private _currency: CurrencyCode,
    private _status: SalarySlipStatus,
    private _sourceType: SalarySlipSourceType,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  // ファクトリーメソッド
  public static create(props: CreateSalarySlipProps): SalarySlip {
    const id = EntityId.generate();
    const now = new Date();
    
    const salarySlip = new SalarySlip(
      id,
      props.userId,
      props.companyName,
      props.employeeName,
      props.employeeId,
      props.paymentDate,
      new DateRange(props.targetPeriodStart, props.targetPeriodEnd),
      props.attendance,
      props.earnings,
      props.deductions,
      props.currency,
      SalarySlipStatus.DRAFT,
      props.sourceType,
      now,
      now
    );

    salarySlip.validate();
    return salarySlip;
  }

  public static reconstitute(props: ReconstituteSalarySlipProps): SalarySlip {
    return new SalarySlip(
      props.id,
      props.userId,
      props.companyName,
      props.employeeName,
      props.employeeId,
      props.paymentDate,
      new DateRange(props.targetPeriodStart, props.targetPeriodEnd),
      props.attendance,
      props.earnings,
      props.deductions,
      props.currency,
      props.status,
      props.sourceType,
      props.createdAt,
      props.updatedAt
    );
  }

  // ビジネスロジック
  public calculateTotalEarnings(): MoneyAmount {
    return this._earnings.calculateTotal();
  }

  public calculateTotalDeductions(): MoneyAmount {
    return this._deductions.calculateTotal();
  }

  public calculateNetPay(): MoneyAmount {
    const totalEarnings = this.calculateTotalEarnings();
    const totalDeductions = this.calculateTotalDeductions();
    return MoneyAmount.subtract(totalEarnings, totalDeductions);
  }

  public confirm(): void {
    if (this._status === SalarySlipStatus.ARCHIVED) {
      throw new SalarySlipError('アーカイブ済みの給料明細は確定できません');
    }
    this._status = SalarySlipStatus.CONFIRMED;
    this._updatedAt = new Date();
  }

  public archive(): void {
    this._status = SalarySlipStatus.ARCHIVED;
    this._updatedAt = new Date();
  }

  public updateEarnings(earnings: EarningsDetail): void {
    if (this._status === SalarySlipStatus.ARCHIVED) {
      throw new SalarySlipError('アーカイブ済みの給料明細は変更できません');
    }
    this._earnings = earnings;
    this._updatedAt = new Date();
  }

  public updateDeductions(deductions: DeductionsDetail): void {
    if (this._status === SalarySlipStatus.ARCHIVED) {
      throw new SalarySlipError('アーカイブ済みの給料明細は変更できません');
    }
    this._deductions = deductions;
    this._updatedAt = new Date();
  }

  private validate(): void {
    if (!this._companyName || this._companyName.trim().length === 0) {
      throw new SalarySlipError('会社名は必須です');
    }
    if (!this._employeeName || this._employeeName.trim().length === 0) {
      throw new SalarySlipError('従業員名は必須です');
    }
    if (this._targetPeriod.start > this._targetPeriod.end) {
      throw new SalarySlipError('対象期間の開始日は終了日より前である必要があります');
    }
  }

  // ゲッター
  public get id(): EntityId { return this._id; }
  public get userId(): EntityId { return this._userId; }
  public get companyName(): string { return this._companyName; }
  public get employeeName(): string { return this._employeeName; }
  public get employeeId(): string { return this._employeeId; }
  public get paymentDate(): Date { return this._paymentDate; }
  public get targetPeriod(): DateRange { return this._targetPeriod; }
  public get attendance(): AttendanceInfo { return this._attendance; }
  public get earnings(): EarningsDetail { return this._earnings; }
  public get deductions(): DeductionsDetail { return this._deductions; }
  public get currency(): CurrencyCode { return this._currency; }
  public get status(): SalarySlipStatus { return this._status; }
  public get sourceType(): SalarySlipSourceType { return this._sourceType; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }

  public get totalEarnings(): MoneyAmount {
    return this.calculateTotalEarnings();
  }

  public get totalDeductions(): MoneyAmount {
    return this.calculateTotalDeductions();
  }

  public get netPay(): MoneyAmount {
    return this.calculateNetPay();
  }
}
```

#### 2.1.2 値オブジェクト群

```typescript
// src/entities/salary-slip/model/earnings-detail.value-object.ts

/**
 * 収入詳細値オブジェクト
 */
export class EarningsDetail {
  private constructor(
    public readonly baseSalary: MoneyAmount,
    public readonly overtimePay: MoneyAmount,
    public readonly overtimePayOver60: MoneyAmount,
    public readonly lateNightPay: MoneyAmount,
    public readonly holidayWorkPay: MoneyAmount,
    public readonly fixedOvertimeAllowance: MoneyAmount,
    public readonly transportationAllowance: MoneyAmount,
    public readonly housingAllowance: MoneyAmount,
    public readonly familyAllowance: MoneyAmount,
    public readonly qualificationAllowance: MoneyAmount,
    public readonly expenseReimbursement: MoneyAmount,
    public readonly stockPurchaseIncentive: MoneyAmount,
    public readonly bonus: MoneyAmount,
    public readonly otherEarnings: MoneyAmount
  ) {}

  public static create(props: CreateEarningsDetailProps): EarningsDetail {
    return new EarningsDetail(
      MoneyAmount.from(props.baseSalary),
      MoneyAmount.from(props.overtimePay || '0'),
      MoneyAmount.from(props.overtimePayOver60 || '0'),
      MoneyAmount.from(props.lateNightPay || '0'),
      MoneyAmount.from(props.holidayWorkPay || '0'),
      MoneyAmount.from(props.fixedOvertimeAllowance || '0'),
      MoneyAmount.from(props.transportationAllowance || '0'),
      MoneyAmount.from(props.housingAllowance || '0'),
      MoneyAmount.from(props.familyAllowance || '0'),
      MoneyAmount.from(props.qualificationAllowance || '0'),
      MoneyAmount.from(props.expenseReimbursement || '0'),
      MoneyAmount.from(props.stockPurchaseIncentive || '0'),
      MoneyAmount.from(props.bonus || '0'),
      MoneyAmount.from(props.otherEarnings || '0')
    );
  }

  public calculateTotal(): MoneyAmount {
    return MoneyAmount.sum([
      this.baseSalary,
      this.overtimePay,
      this.overtimePayOver60,
      this.lateNightPay,
      this.holidayWorkPay,
      this.fixedOvertimeAllowance,
      this.transportationAllowance,
      this.housingAllowance,
      this.familyAllowance,
      this.qualificationAllowance,
      this.expenseReimbursement,
      this.stockPurchaseIncentive,
      this.bonus,
      this.otherEarnings
    ]);
  }

  public equals(other: EarningsDetail): boolean {
    return this.baseSalary.equals(other.baseSalary) &&
           this.overtimePay.equals(other.overtimePay) &&
           this.overtimePayOver60.equals(other.overtimePayOver60) &&
           this.lateNightPay.equals(other.lateNightPay) &&
           this.holidayWorkPay.equals(other.holidayWorkPay) &&
           this.fixedOvertimeAllowance.equals(other.fixedOvertimeAllowance) &&
           this.transportationAllowance.equals(other.transportationAllowance) &&
           this.housingAllowance.equals(other.housingAllowance) &&
           this.familyAllowance.equals(other.familyAllowance) &&
           this.qualificationAllowance.equals(other.qualificationAllowance) &&
           this.expenseReimbursement.equals(other.expenseReimbursement) &&
           this.stockPurchaseIncentive.equals(other.stockPurchaseIncentive) &&
           this.bonus.equals(other.bonus) &&
           this.otherEarnings.equals(other.otherEarnings);
  }
}
```

### 2.2 株式ポートフォリオドメイン

#### 2.2.1 StockPortfolio エンティティ

```typescript
// src/entities/stock/model/stock-portfolio.entity.ts

/**
 * 株式ポートフォリオエンティティ
 */
export class StockPortfolio {
  private constructor(
    private readonly _id: EntityId,
    private readonly _userId: EntityId,
    private readonly _stockId: EntityId,
    private _quantity: Quantity,
    private _averagePurchasePrice: MoneyAmount,
    private _totalInvestment: MoneyAmount,
    private _firstPurchaseDate: Date | null,
    private _lastPurchaseDate: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  public static create(props: CreateStockPortfolioProps): StockPortfolio {
    const id = EntityId.generate();
    const now = new Date();

    return new StockPortfolio(
      id,
      props.userId,
      props.stockId,
      Quantity.from(props.quantity),
      MoneyAmount.from(props.averagePurchasePrice),
      MoneyAmount.from(props.totalInvestment),
      props.firstPurchaseDate,
      props.lastPurchaseDate,
      now,
      now
    );
  }

  // 取引処理メソッド
  public processBuyTransaction(transaction: StockTransaction): void {
    const newQuantity = this._quantity.add(transaction.quantity);
    const newInvestment = MoneyAmount.add(
      this._totalInvestment,
      transaction.totalAmount
    );
    
    this._averagePurchasePrice = MoneyAmount.divide(
      newInvestment,
      newQuantity.value
    );
    
    this._quantity = newQuantity;
    this._totalInvestment = newInvestment;
    
    if (!this._firstPurchaseDate) {
      this._firstPurchaseDate = transaction.transactionDate;
    }
    this._lastPurchaseDate = transaction.transactionDate;
    this._updatedAt = new Date();
  }

  public processSellTransaction(transaction: StockTransaction): void {
    if (this._quantity.value < transaction.quantity.value) {
      throw new StockPortfolioError('売却数量が保有数量を超えています');
    }

    const newQuantity = this._quantity.subtract(transaction.quantity);
    const sellRatio = transaction.quantity.value / this._quantity.value;
    const soldInvestment = MoneyAmount.multiply(
      this._totalInvestment,
      sellRatio
    );
    
    this._quantity = newQuantity;
    this._totalInvestment = MoneyAmount.subtract(
      this._totalInvestment,
      soldInvestment
    );
    this._updatedAt = new Date();
  }

  // 評価損益計算
  public calculateUnrealizedGainLoss(currentPrice: MoneyAmount): UnrealizedGainLoss {
    const currentValue = MoneyAmount.multiply(currentPrice, this._quantity.value);
    const gainLoss = MoneyAmount.subtract(currentValue, this._totalInvestment);
    const gainLossRate = this._totalInvestment.isZero() 
      ? 0 
      : gainLoss.divide(this._totalInvestment).multiply(100).value;

    return new UnrealizedGainLoss(
      currentValue,
      gainLoss,
      gainLossRate
    );
  }

  // ゲッター
  public get id(): EntityId { return this._id; }
  public get userId(): EntityId { return this._userId; }
  public get stockId(): EntityId { return this._stockId; }
  public get quantity(): Quantity { return this._quantity; }
  public get averagePurchasePrice(): MoneyAmount { return this._averagePurchasePrice; }
  public get totalInvestment(): MoneyAmount { return this._totalInvestment; }
  public get firstPurchaseDate(): Date | null { return this._firstPurchaseDate; }
  public get lastPurchaseDate(): Date | null { return this._lastPurchaseDate; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }
}
```

### 2.3 ユーザードメイン

#### 2.3.1 User エンティティ

```typescript
// src/entities/user/model/user.entity.ts

/**
 * ユーザーエンティティ
 */
export class User {
  private constructor(
    private readonly _id: EntityId,
    private _email: Email,
    private _name: string,
    private _googleId: string | null,
    private _avatarUrl: string | null,
    private _isActive: boolean,
    private _preferences: UserPreferences,
    private _emailVerifiedAt: Date | null,
    private _lastLoginAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  public static create(props: CreateUserProps): User {
    const id = EntityId.generate();
    const now = new Date();

    const user = new User(
      id,
      Email.from(props.email),
      props.name,
      props.googleId || null,
      props.avatarUrl || null,
      true,
      props.preferences || UserPreferences.default(),
      null,
      null,
      now,
      now
    );

    user.validate();
    return user;
  }

  // ビジネスロジック
  public updateProfile(props: UpdateUserProfileProps): void {
    if (props.name) {
      this._name = props.name;
    }
    if (props.avatarUrl !== undefined) {
      this._avatarUrl = props.avatarUrl;
    }
    this._updatedAt = new Date();
  }

  public updatePreferences(preferences: UserPreferences): void {
    this._preferences = preferences;
    this._updatedAt = new Date();
  }

  public verifyEmail(): void {
    this._emailVerifiedAt = new Date();
    this._updatedAt = new Date();
  }

  public recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public reactivate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new UserError('ユーザー名は必須です');
    }
    if (this._name.length > 100) {
      throw new UserError('ユーザー名は100文字以内で入力してください');
    }
  }

  // ゲッター
  public get id(): EntityId { return this._id; }
  public get email(): Email { return this._email; }
  public get name(): string { return this._name; }
  public get googleId(): string | null { return this._googleId; }
  public get avatarUrl(): string | null { return this._avatarUrl; }
  public get isActive(): boolean { return this._isActive; }
  public get preferences(): UserPreferences { return this._preferences; }
  public get emailVerifiedAt(): Date | null { return this._emailVerifiedAt; }
  public get lastLoginAt(): Date | null { return this._lastLoginAt; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }
}
```

---

## 3. アプリケーション層クラス構造

### 3.1 サービス層の基底クラス

```typescript
// src/shared/application/base-service.ts

/**
 * サービス層の基底クラス
 */
export abstract class BaseService {
  constructor(
    protected readonly logger: Logger,
    protected readonly eventBus: EventBus,
    protected readonly unitOfWork: UnitOfWork
  ) {}

  protected async executeInTransaction<T>(
    operation: (uow: UnitOfWork) => Promise<T>
  ): Promise<T> {
    return this.unitOfWork.withTransaction(async (uow) => {
      try {
        const result = await operation(uow);
        await uow.commit();
        return result;
      } catch (error) {
        await uow.rollback();
        throw error;
      }
    });
  }

  protected publishEvent(event: DomainEvent): void {
    this.eventBus.publish(event);
  }

  protected logOperation(operation: string, data: any): void {
    this.logger.info(`Service operation: ${operation}`, { data });
  }

  protected logError(operation: string, error: Error): void {
    this.logger.error(`Service error in ${operation}`, { error });
  }
}
```

### 3.2 給料明細サービス

```typescript
// src/features/salary-slip/application/salary-slip.service.ts

/**
 * 給料明細アプリケーションサービス
 */
export class SalarySlipService extends BaseService {
  constructor(
    private readonly salarySlipRepository: SalarySlipRepository,
    private readonly pdfParserService: PdfParserService,
    private readonly statisticsService: SalaryStatisticsService,
    logger: Logger,
    eventBus: EventBus,
    unitOfWork: UnitOfWork
  ) {
    super(logger, eventBus, unitOfWork);
  }

  async createFromPdf(
    userId: EntityId,
    files: PdfFile[]
  ): Promise<SalarySlipCreationResult> {
    this.logOperation('createFromPdf', { userId, fileCount: files.length });

    return this.executeInTransaction(async (uow) => {
      const results: SalarySlipProcessResult[] = [];
      
      for (const file of files) {
        try {
          // PDF解析
          const extractedData = await this.pdfParserService.extract(file);
          
          // 重複チェック
          const existing = await this.salarySlipRepository.findByPaymentDate(
            userId,
            extractedData.paymentDate
          );
          
          if (existing) {
            results.push({
              fileName: file.name,
              status: 'duplicate',
              error: new SalarySlipError('重複する給料明細が存在します')
            });
            continue;
          }

          // エンティティ作成
          const salarySlip = SalarySlip.create({
            userId,
            ...extractedData,
            sourceType: SalarySlipSourceType.PDF
          });

          // 保存
          await this.salarySlipRepository.save(salarySlip);
          
          // イベント発行
          this.publishEvent(new SalarySlipCreatedEvent(salarySlip));

          results.push({
            fileName: file.name,
            status: 'success',
            salarySlipId: salarySlip.id,
            confidence: extractedData.confidence
          });
          
        } catch (error) {
          this.logError('createFromPdf', error);
          results.push({
            fileName: file.name,
            status: 'failed',
            error
          });
        }
      }

      return new SalarySlipCreationResult(results);
    });
  }

  async findByUserId(
    userId: EntityId,
    criteria: SalarySlipSearchCriteria
  ): Promise<PaginatedResult<SalarySlip>> {
    this.logOperation('findByUserId', { userId, criteria });
    
    const specification = SalarySlipSpecification.create(criteria);
    return this.salarySlipRepository.findBySpecification(userId, specification);
  }

  async getStatistics(
    userId: EntityId,
    period: StatisticsPeriod
  ): Promise<SalaryStatistics> {
    this.logOperation('getStatistics', { userId, period });
    
    return this.statisticsService.calculate(userId, period);
  }

  async confirm(userId: EntityId, salarySlipId: EntityId): Promise<void> {
    return this.executeInTransaction(async (uow) => {
      const salarySlip = await this.salarySlipRepository.findByIdAndUserId(
        salarySlipId,
        userId
      );
      
      if (!salarySlip) {
        throw new SalarySlipNotFoundError(salarySlipId);
      }

      salarySlip.confirm();
      await this.salarySlipRepository.save(salarySlip);
      
      this.publishEvent(new SalarySlipConfirmedEvent(salarySlip));
    });
  }
}
```

### 3.3 株式ポートフォリオサービス

```typescript
// src/features/portfolio/application/portfolio.service.ts

/**
 * 株式ポートフォリオアプリケーションサービス
 */
export class PortfolioService extends BaseService {
  constructor(
    private readonly portfolioRepository: StockPortfolioRepository,
    private readonly stockRepository: StockRepository,
    private readonly transactionRepository: StockTransactionRepository,
    private readonly stockPriceService: StockPriceService,
    logger: Logger,
    eventBus: EventBus,
    unitOfWork: UnitOfWork
  ) {
    super(logger, eventBus, unitOfWork);
  }

  async processTransaction(
    userId: EntityId,
    transactionData: CreateStockTransactionInput
  ): Promise<StockTransaction> {
    this.logOperation('processTransaction', { userId, transactionData });

    return this.executeInTransaction(async (uow) => {
      // 株式情報取得または作成
      const stock = await this.getOrCreateStock(transactionData.symbol);
      
      // ポートフォリオ取得または作成
      let portfolio = await this.portfolioRepository.findByUserIdAndStockId(
        userId,
        stock.id
      );

      if (!portfolio) {
        portfolio = StockPortfolio.create({
          userId,
          stockId: stock.id,
          quantity: '0',
          averagePurchasePrice: '0',
          totalInvestment: '0',
          firstPurchaseDate: null,
          lastPurchaseDate: null
        });
      }

      // 取引エンティティ作成
      const transaction = StockTransaction.create({
        portfolioId: portfolio.id,
        stockId: stock.id,
        userId,
        ...transactionData
      });

      // ポートフォリオ更新
      if (transaction.transactionType === TransactionType.BUY) {
        portfolio.processBuyTransaction(transaction);
      } else if (transaction.transactionType === TransactionType.SELL) {
        portfolio.processSellTransaction(transaction);
      }

      // 保存
      await this.transactionRepository.save(transaction);
      await this.portfolioRepository.save(portfolio);

      // イベント発行
      this.publishEvent(new StockTransactionProcessedEvent(transaction, portfolio));

      return transaction;
    });
  }

  async getPortfolioSummary(userId: EntityId): Promise<PortfolioSummary> {
    this.logOperation('getPortfolioSummary', { userId });

    const portfolios = await this.portfolioRepository.findByUserId(userId);
    const currentPrices = await this.stockPriceService.getCurrentPrices(
      portfolios.map(p => p.stockId)
    );

    let totalInvestment = MoneyAmount.zero();
    let totalCurrentValue = MoneyAmount.zero();
    const compositions: PortfolioComposition[] = [];

    for (const portfolio of portfolios) {
      const currentPrice = currentPrices.get(portfolio.stockId);
      if (!currentPrice) continue;

      const gainLoss = portfolio.calculateUnrealizedGainLoss(currentPrice.currentPrice);
      
      totalInvestment = MoneyAmount.add(totalInvestment, portfolio.totalInvestment);
      totalCurrentValue = MoneyAmount.add(totalCurrentValue, gainLoss.currentValue);

      compositions.push(
        PortfolioComposition.create({
          stockId: portfolio.stockId,
          value: gainLoss.currentValue,
          gainLoss: gainLoss.unrealizedGainLoss,
          gainLossRate: gainLoss.unrealizedGainLossRate
        })
      );
    }

    return PortfolioSummary.create({
      totalInvestment,
      totalCurrentValue,
      totalUnrealizedGainLoss: MoneyAmount.subtract(totalCurrentValue, totalInvestment),
      totalUnrealizedGainLossRate: totalInvestment.isZero() 
        ? 0 
        : MoneyAmount.subtract(totalCurrentValue, totalInvestment)
            .divide(totalInvestment)
            .multiply(100).value,
      composition: compositions
    });
  }

  private async getOrCreateStock(symbol: string): Promise<Stock> {
    let stock = await this.stockRepository.findBySymbol(symbol);
    
    if (!stock) {
      const stockInfo = await this.stockPriceService.getStockInfo(symbol);
      stock = Stock.create({
        symbol: stockInfo.symbol,
        name: stockInfo.name,
        exchange: stockInfo.exchange,
        currency: stockInfo.currency
      });
      await this.stockRepository.save(stock);
    }

    return stock;
  }
}
```

---

## 4. インフラストラクチャ層クラス構造

### 4.1 Repository基底クラス

```typescript
// src/shared/infrastructure/base-repository.ts

/**
 * Repository基底クラス
 */
export abstract class BaseRepository<TEntity extends { id: EntityId }> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly logger: Logger
  ) {}

  protected async executeQuery<T>(
    operation: string,
    query: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await query();
      const duration = Date.now() - startTime;
      
      this.logger.debug(`Repository query executed`, {
        operation,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(`Repository query failed`, {
        operation,
        duration,
        error
      });
      
      throw error;
    }
  }

  protected abstract toDomain(raw: any): TEntity;
  protected abstract toPersistence(entity: TEntity): any;
}
```

### 4.2 給料明細Repository実装

```typescript
// src/features/salary-slip/infrastructure/salary-slip.repository.ts

/**
 * 給料明細Repository実装
 */
export class PrismaSalarySlipRepository 
  extends BaseRepository<SalarySlip> 
  implements SalarySlipRepository {

  async save(salarySlip: SalarySlip): Promise<void> {
    return this.executeQuery('save', async () => {
      const data = this.toPersistence(salarySlip);
      
      await this.prisma.salarySlip.upsert({
        where: { id: salarySlip.id.value },
        create: data,
        update: data
      });
    });
  }

  async findById(id: EntityId): Promise<SalarySlip | null> {
    return this.executeQuery('findById', async () => {
      const raw = await this.prisma.salarySlip.findUnique({
        where: { id: id.value },
        include: {
          earnings: true,
          deductions: true,
          attendance: true
        }
      });

      return raw ? this.toDomain(raw) : null;
    });
  }

  async findByUserId(
    userId: EntityId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<SalarySlip>> {
    return this.executeQuery('findByUserId', async () => {
      const [data, total] = await Promise.all([
        this.prisma.salarySlip.findMany({
          where: { userId: userId.value },
          include: {
            earnings: true,
            deductions: true,
            attendance: true
          },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
          orderBy: { paymentDate: 'desc' }
        }),
        this.prisma.salarySlip.count({
          where: { userId: userId.value }
        })
      ]);

      return new PaginatedResult(
        data.map(raw => this.toDomain(raw)),
        total,
        pagination
      );
    });
  }

  async findBySpecification(
    userId: EntityId,
    specification: SalarySlipSpecification
  ): Promise<PaginatedResult<SalarySlip>> {
    return this.executeQuery('findBySpecification', async () => {
      const whereClause = this.buildWhereClause(userId, specification);
      
      const [data, total] = await Promise.all([
        this.prisma.salarySlip.findMany({
          where: whereClause,
          include: {
            earnings: true,
            deductions: true,
            attendance: true
          },
          skip: (specification.pagination.page - 1) * specification.pagination.limit,
          take: specification.pagination.limit,
          orderBy: { [specification.sortBy]: specification.sortOrder }
        }),
        this.prisma.salarySlip.count({
          where: whereClause
        })
      ]);

      return new PaginatedResult(
        data.map(raw => this.toDomain(raw)),
        total,
        specification.pagination
      );
    });
  }

  async findByPaymentDate(
    userId: EntityId,
    paymentDate: Date
  ): Promise<SalarySlip | null> {
    return this.executeQuery('findByPaymentDate', async () => {
      const raw = await this.prisma.salarySlip.findFirst({
        where: {
          userId: userId.value,
          paymentDate: {
            gte: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate()),
            lt: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate() + 1)
          }
        },
        include: {
          earnings: true,
          deductions: true,
          attendance: true
        }
      });

      return raw ? this.toDomain(raw) : null;
    });
  }

  protected toDomain(raw: any): SalarySlip {
    return SalarySlip.reconstitute({
      id: EntityId.from(raw.id),
      userId: EntityId.from(raw.userId),
      companyName: raw.companyName,
      employeeName: raw.employeeName,
      employeeId: raw.employeeId,
      paymentDate: raw.paymentDate,
      targetPeriodStart: raw.targetPeriodStart,
      targetPeriodEnd: raw.targetPeriodEnd,
      attendance: AttendanceInfo.create({
        overtimeHours: raw.attendance.overtimeHours,
        overtimeHoursOver60: raw.attendance.overtimeHoursOver60,
        lateNightHours: raw.attendance.lateNightHours,
        holidayWorkDays: raw.attendance.holidayWorkDays,
        paidLeaveDays: raw.attendance.paidLeaveDays,
        absenceDays: raw.attendance.absenceDays,
        workingDays: raw.attendance.workingDays,
        scheduledWorkDays: raw.attendance.scheduledWorkDays,
        lateCount: raw.attendance.lateCount,
        earlyLeaveCount: raw.attendance.earlyLeaveCount
      }),
      earnings: EarningsDetail.create({
        baseSalary: raw.earnings.baseSalary.toString(),
        overtimePay: raw.earnings.overtimePay.toString(),
        overtimePayOver60: raw.earnings.overtimePayOver60.toString(),
        lateNightPay: raw.earnings.lateNightPay.toString(),
        holidayWorkPay: raw.earnings.holidayWorkPay.toString(),
        fixedOvertimeAllowance: raw.earnings.fixedOvertimeAllowance.toString(),
        transportationAllowance: raw.earnings.transportationAllowance.toString(),
        housingAllowance: raw.earnings.housingAllowance.toString(),
        familyAllowance: raw.earnings.familyAllowance.toString(),
        qualificationAllowance: raw.earnings.qualificationAllowance.toString(),
        expenseReimbursement: raw.earnings.expenseReimbursement.toString(),
        stockPurchaseIncentive: raw.earnings.stockPurchaseIncentive.toString(),
        bonus: raw.earnings.bonus.toString(),
        otherEarnings: raw.earnings.otherEarnings.toString()
      }),
      deductions: DeductionsDetail.create({
        healthInsurance: raw.deductions.healthInsurance.toString(),
        welfareInsurance: raw.deductions.welfareInsurance.toString(),
        employmentInsurance: raw.deductions.employmentInsurance.toString(),
        incomeTax: raw.deductions.incomeTax.toString(),
        residentTax: raw.deductions.residentTax.toString(),
        stockPurchase: raw.deductions.stockPurchase.toString(),
        loan: raw.deductions.loan.toString(),
        unionFee: raw.deductions.unionFee.toString(),
        otherDeductions: raw.deductions.otherDeductions.toString()
      }),
      currency: raw.currency,
      status: raw.status,
      sourceType: raw.sourceType,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    });
  }

  protected toPersistence(salarySlip: SalarySlip): any {
    return {
      id: salarySlip.id.value,
      userId: salarySlip.userId.value,
      companyName: salarySlip.companyName,
      employeeName: salarySlip.employeeName,
      employeeId: salarySlip.employeeId,
      paymentDate: salarySlip.paymentDate,
      targetPeriodStart: salarySlip.targetPeriod.start,
      targetPeriodEnd: salarySlip.targetPeriod.end,
      baseSalary: new Prisma.Decimal(salarySlip.earnings.baseSalary.value),
      totalEarnings: new Prisma.Decimal(salarySlip.totalEarnings.value),
      totalDeductions: new Prisma.Decimal(salarySlip.totalDeductions.value),
      netPay: new Prisma.Decimal(salarySlip.netPay.value),
      currency: salarySlip.currency,
      status: salarySlip.status,
      sourceType: salarySlip.sourceType,
      createdAt: salarySlip.createdAt,
      updatedAt: salarySlip.updatedAt,
      attendance: {
        upsert: {
          create: {
            overtimeHours: salarySlip.attendance.overtimeHours,
            overtimeHoursOver60: salarySlip.attendance.overtimeHoursOver60,
            lateNightHours: salarySlip.attendance.lateNightHours,
            holidayWorkDays: salarySlip.attendance.holidayWorkDays,
            paidLeaveDays: salarySlip.attendance.paidLeaveDays,
            absenceDays: salarySlip.attendance.absenceDays,
            workingDays: salarySlip.attendance.workingDays,
            scheduledWorkDays: salarySlip.attendance.scheduledWorkDays,
            lateCount: salarySlip.attendance.lateCount,
            earlyLeaveCount: salarySlip.attendance.earlyLeaveCount
          },
          update: {
            overtimeHours: salarySlip.attendance.overtimeHours,
            overtimeHoursOver60: salarySlip.attendance.overtimeHoursOver60,
            lateNightHours: salarySlip.attendance.lateNightHours,
            holidayWorkDays: salarySlip.attendance.holidayWorkDays,
            paidLeaveDays: salarySlip.attendance.paidLeaveDays,
            absenceDays: salarySlip.attendance.absenceDays,
            workingDays: salarySlip.attendance.workingDays,
            scheduledWorkDays: salarySlip.attendance.scheduledWorkDays,
            lateCount: salarySlip.attendance.lateCount,
            earlyLeaveCount: salarySlip.attendance.earlyLeaveCount
          }
        }
      },
      earnings: {
        upsert: {
          create: this.earningsToPersistence(salarySlip.earnings),
          update: this.earningsToPersistence(salarySlip.earnings)
        }
      },
      deductions: {
        upsert: {
          create: this.deductionsToPersistence(salarySlip.deductions),
          update: this.deductionsToPersistence(salarySlip.deductions)
        }
      }
    };
  }

  private buildWhereClause(
    userId: EntityId,
    specification: SalarySlipSpecification
  ): any {
    const where: any = {
      userId: userId.value
    };

    if (specification.status) {
      where.status = specification.status;
    }

    if (specification.companyName) {
      where.companyName = {
        contains: specification.companyName,
        mode: 'insensitive'
      };
    }

    if (specification.dateRange) {
      where.paymentDate = {
        gte: specification.dateRange.start,
        lte: specification.dateRange.end
      };
    }

    if (specification.amountRange) {
      where.netPay = {
        gte: new Prisma.Decimal(specification.amountRange.min.value),
        lte: new Prisma.Decimal(specification.amountRange.max.value)
      };
    }

    if (specification.searchQuery) {
      where.OR = [
        { companyName: { contains: specification.searchQuery, mode: 'insensitive' } },
        { employeeName: { contains: specification.searchQuery, mode: 'insensitive' } },
        { employeeId: { contains: specification.searchQuery, mode: 'insensitive' } }
      ];
    }

    return where;
  }

  private earningsToPersistence(earnings: EarningsDetail): any {
    return {
      baseSalary: new Prisma.Decimal(earnings.baseSalary.value),
      overtimePay: new Prisma.Decimal(earnings.overtimePay.value),
      overtimePayOver60: new Prisma.Decimal(earnings.overtimePayOver60.value),
      lateNightPay: new Prisma.Decimal(earnings.lateNightPay.value),
      holidayWorkPay: new Prisma.Decimal(earnings.holidayWorkPay.value),
      fixedOvertimeAllowance: new Prisma.Decimal(earnings.fixedOvertimeAllowance.value),
      transportationAllowance: new Prisma.Decimal(earnings.transportationAllowance.value),
      housingAllowance: new Prisma.Decimal(earnings.housingAllowance.value),
      familyAllowance: new Prisma.Decimal(earnings.familyAllowance.value),
      qualificationAllowance: new Prisma.Decimal(earnings.qualificationAllowance.value),
      expenseReimbursement: new Prisma.Decimal(earnings.expenseReimbursement.value),
      stockPurchaseIncentive: new Prisma.Decimal(earnings.stockPurchaseIncentive.value),
      bonus: new Prisma.Decimal(earnings.bonus.value),
      otherEarnings: new Prisma.Decimal(earnings.otherEarnings.value)
    };
  }

  private deductionsToPersistence(deductions: DeductionsDetail): any {
    return {
      healthInsurance: new Prisma.Decimal(deductions.healthInsurance.value),
      welfareInsurance: new Prisma.Decimal(deductions.welfareInsurance.value),
      employmentInsurance: new Prisma.Decimal(deductions.employmentInsurance.value),
      incomeTax: new Prisma.Decimal(deductions.incomeTax.value),
      residentTax: new Prisma.Decimal(deductions.residentTax.value),
      stockPurchase: new Prisma.Decimal(deductions.stockPurchase.value),
      loan: new Prisma.Decimal(deductions.loan.value),
      unionFee: new Prisma.Decimal(deductions.unionFee.value),
      otherDeductions: new Prisma.Decimal(deductions.otherDeductions.value)
    };
  }
}
```

---

## 5. 共有値オブジェクト

### 5.1 基本値オブジェクト

```typescript
// src/shared/domain/value-objects/entity-id.ts

/**
 * エンティティID値オブジェクト
 */
export class EntityId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new EntityIdError('Entity ID cannot be empty');
    }
    if (value.length !== 25) { // CUID length
      throw new EntityIdError('Entity ID must be 25 characters long');
    }
    this._value = value;
  }

  public static from(value: string): EntityId {
    return new EntityId(value);
  }

  public static generate(): EntityId {
    return new EntityId(cuid());
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: EntityId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
```

```typescript
// src/shared/domain/value-objects/money-amount.ts

/**
 * 金額値オブジェクト
 */
export class MoneyAmount {
  private readonly _value: Decimal;

  private constructor(value: Decimal) {
    if (value.isNaN()) {
      throw new MoneyAmountError('Money amount cannot be NaN');
    }
    if (!value.isFinite()) {
      throw new MoneyAmountError('Money amount must be finite');
    }
    this._value = value.toDP(2); // 小数点以下2桁で固定
  }

  public static from(value: string | number): MoneyAmount {
    try {
      return new MoneyAmount(new Decimal(value));
    } catch (error) {
      throw new MoneyAmountError(`Invalid money amount: ${value}`);
    }
  }

  public static zero(): MoneyAmount {
    return new MoneyAmount(new Decimal(0));
  }

  public static sum(amounts: MoneyAmount[]): MoneyAmount {
    const total = amounts.reduce(
      (acc, amount) => acc.add(amount._value),
      new Decimal(0)
    );
    return new MoneyAmount(total);
  }

  public static add(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
    return new MoneyAmount(a._value.add(b._value));
  }

  public static subtract(a: MoneyAmount, b: MoneyAmount): MoneyAmount {
    return new MoneyAmount(a._value.sub(b._value));
  }

  public static multiply(amount: MoneyAmount, multiplier: number): MoneyAmount {
    return new MoneyAmount(amount._value.mul(multiplier));
  }

  public static divide(amount: MoneyAmount, divisor: number): MoneyAmount {
    if (divisor === 0) {
      throw new MoneyAmountError('Cannot divide by zero');
    }
    return new MoneyAmount(amount._value.div(divisor));
  }

  public add(other: MoneyAmount): MoneyAmount {
    return MoneyAmount.add(this, other);
  }

  public subtract(other: MoneyAmount): MoneyAmount {
    return MoneyAmount.subtract(this, other);
  }

  public multiply(multiplier: number): MoneyAmount {
    return MoneyAmount.multiply(this, multiplier);
  }

  public divide(divisor: number): MoneyAmount {
    return MoneyAmount.divide(this, divisor);
  }

  public isZero(): boolean {
    return this._value.isZero();
  }

  public isPositive(): boolean {
    return this._value.gt(0);
  }

  public isNegative(): boolean {
    return this._value.lt(0);
  }

  public equals(other: MoneyAmount): boolean {
    return this._value.equals(other._value);
  }

  public get value(): string {
    return this._value.toString();
  }

  public toNumber(): number {
    return this._value.toNumber();
  }

  public toString(): string {
    return this._value.toString();
  }
}
```

```typescript
// src/shared/domain/value-objects/email.ts

/**
 * メールアドレス値オブジェクト
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    if (!this.isValid(value)) {
      throw new EmailError(`Invalid email format: ${value}`);
    }
    this._value = value.toLowerCase();
  }

  public static from(value: string): Email {
    return new Email(value);
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  public get value(): string {
    return this._value;
  }

  public get domain(): string {
    return this._value.split('@')[1];
  }

  public get localPart(): string {
    return this._value.split('@')[0];
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
```

---

## 6. エラークラス階層

### 6.1 基底エラークラス

```typescript
// src/shared/domain/errors/base-error.ts

/**
 * ドメインエラー基底クラス
 */
export abstract class DomainError extends Error {
  protected constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  abstract get statusCode(): number;
  abstract get userMessage(): string;
}

/**
 * バリデーションエラー
 */
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any
  ) {
    super(message, 'VALIDATION_ERROR', { field, value });
  }

  get statusCode(): number {
    return 400;
  }

  get userMessage(): string {
    return this.message;
  }
}

/**
 * ビジネスルールエラー
 */
export class BusinessRuleError extends DomainError {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, details);
  }

  get statusCode(): number {
    return 422;
  }

  get userMessage(): string {
    return this.message;
  }
}

/**
 * リソース未発見エラー
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super(
      `${resource} not found: ${identifier}`,
      'NOT_FOUND',
      { resource, identifier }
    );
  }

  get statusCode(): number {
    return 404;
  }

  get userMessage(): string {
    return '指定されたデータが見つかりません';
  }
}
```

### 6.2 ドメイン固有エラー

```typescript
// src/entities/salary-slip/model/salary-slip.error.ts

/**
 * 給料明細ドメインエラー
 */
export class SalarySlipError extends BusinessRuleError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SALARY_SLIP_ERROR', details);
  }
}

export class SalarySlipNotFoundError extends NotFoundError {
  constructor(id: EntityId) {
    super('SalarySlip', id.value);
  }
}

export class DuplicateSalarySlipError extends BusinessRuleError {
  constructor(userId: EntityId, paymentDate: Date) {
    super(
      '同じ支払日の給料明細が既に存在します',
      'DUPLICATE_SALARY_SLIP',
      { userId: userId.value, paymentDate: paymentDate.toISOString() }
    );
  }
}
```

---

## 7. クラス関係図

### 7.1 ドメイン層クラス図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Domain Layer                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │   User       │    │   SalarySlip    │    │   StockPortfolio        │ │
│  │   Entity     │    │   Entity        │    │   Entity                │ │
│  │              │    │                 │    │                         │ │
│  │ + id         │    │ + id            │    │ + id                    │ │
│  │ + email      │    │ + userId        │    │ + userId                │ │
│  │ + name       │────│ + companyName   │    │ + stockId               │ │
│  │ + preferences│    │ + earnings      │    │ + quantity              │ │
│  │              │    │ + deductions    │    │ + averagePurchasePrice  │ │
│  │ + updateProfile() │ + calculateNetPay() │ + processBuyTransaction() │ │
│  │ + verifyEmail()│  │ + confirm()     │    │ + processSellTransaction│ │
│  └──────────────┘    └─────────────────┘    └─────────────────────────┘ │
│         │                       │                         │             │
│         │                       │                         │             │
│  ┌──────▼──────┐    ┌───────────▼────────┐   ┌────────────▼──────────┐  │
│  │UserPreferences│  │   EarningsDetail   │   │  StockTransaction     │  │
│  │Value Object  │   │   Value Object     │   │  Entity               │  │
│  │              │   │                    │   │                       │  │
│  │+ defaultCurrency│ │ + baseSalary      │   │ + transactionType     │  │
│  │+ fiscalYearStart│ │ + overtimePay     │   │ + quantity            │  │
│  │+ salaryDayOfMonth││ + allowances      │   │ + pricePerShare       │  │
│  └─────────────────┘ │ + calculateTotal()│   │ + totalAmount         │  │
│                      └────────────────────┘   └───────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    Shared Value Objects                             │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │  EntityId    │  │  MoneyAmount    │  │       Email             │ │ │
│  │  │              │  │                 │  │                         │ │ │
│  │  │ + value      │  │ + value         │  │ + value                 │ │ │
│  │  │ + generate() │  │ + add()         │  │ + domain                │ │ │
│  │  │ + equals()   │  │ + subtract()    │  │ + equals()              │ │ │
│  │  └──────────────┘  │ + multiply()    │  └─────────────────────────┘ │ │
│  │                    │ + divide()      │                              │ │
│  │                    └─────────────────┘                              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 アプリケーション層クラス図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Application Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │   BaseService   │                                                    │
│  │   Abstract      │                                                    │
│  │                 │                                                    │
│  │ + logger        │                                                    │
│  │ + eventBus      │                                                    │
│  │ + unitOfWork    │                                                    │
│  │                 │                                                    │
│  │ + executeInTransaction()                                             │ │
│  │ + publishEvent()│                                                    │
│  └─────────────────┘                                                    │
│          ▲                                                              │
│          │                                                              │
│    ┌─────┴─────┬─────────────────────────────┬─────────────────────────┐│
│    │           │                             │                         ││
│ ┌──▼─────────┐ │ ┌─────────────────────────┐ │  ┌─────────────────────┐││
│ │SalarySlip  │ │ │    PortfolioService     │ │  │    UserService      │││
│ │Service     │ │ │                         │ │  │                     │││
│ │            │ │ │ + processTransaction()  │ │  │ + createUser()      │││
│ │+ createFromPdf() │ + getPortfolioSummary()│ │  │ + updateProfile()   │││
│ │+ findByUserId()│ │ + updateStockPrices() │ │  │ + verifyEmail()     │││
│ │+ getStatistics()│ └─────────────────────────┘ │  │ + recordLogin()     │││
│ │+ confirm()  │                               │  └─────────────────────┘││
│ └────────────┘                               │                         ││
│       │                                      │                         ││
│       │                                      │                         ││
│ ┌─────▼─────────────┐                      ┌─▼──────────────────────┐  ││
│ │SalarySlipRepository│                     │  UserRepository        │  ││
│ │Interface          │                      │  Interface             │  ││
│ │                   │                      │                        │  ││
│ │+ save()           │                      │ + save()               │  ││
│ │+ findById()       │                      │ + findById()           │  ││
│ │+ findByUserId()   │                      │ + findByEmail()        │  ││
│ │+ findBySpecification()                   │ + findByGoogleId()     │  ││
│ └───────────────────┘                      └────────────────────────┘  ││
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 インフラストラクチャ層クラス図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                   BaseRepository                                    │ │
│  │                   Abstract Class                                    │ │
│  │                                                                     │ │
│  │ + prisma: PrismaClient                                             │ │
│  │ + logger: Logger                                                   │ │
│  │                                                                     │ │
│  │ + executeQuery<T>(operation, query): Promise<T>                     │ │
│  │ # toDomain(raw): TEntity                                           │ │
│  │ # toPersistence(entity): any                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    ▲                                    │
│                                    │                                    │
│    ┌───────────────────────────────┼───────────────────────────────────┐ │
│    │                               │                                   │ │
│ ┌──▼────────────────────────┐   ┌──▼──────────────────────────────┐    │ │
│ │PrismaSalarySlipRepository │   │  PrismaStockPortfolioRepository │    │ │
│ │                          │   │                                  │    │ │
│ │+ save()                  │   │ + save()                         │    │ │
│ │+ findById()              │   │ + findById()                     │    │ │
│ │+ findByUserId()          │   │ + findByUserIdAndStockId()       │    │ │
│ │+ findBySpecification()   │   │ + findByUserId()                 │    │ │
│ │+ findByPaymentDate()     │   │                                  │    │ │
│ │                          │   │ # toDomain()                     │    │ │
│ │# toDomain()              │   │ # toPersistence()                │    │ │
│ │# toPersistence()         │   └──────────────────────────────────┘    │ │
│ │# buildWhereClause()      │                                           │ │
│ └──────────────────────────┘                                           │ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    External Services                                │ │
│  │                                                                     │ │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │ │
│  │  │ PdfParserService│  │ StockPriceService│  │ NotificationService │ │ │
│  │  │                 │  │                  │  │                     │ │ │
│  │  │ + extract()     │  │ + getCurrentPrice│  │ + sendEmail()       │ │ │
│  │  │ + validate()    │  │ + getHistoricalPrices │ + sendPush()      │ │ │
│  │  └─────────────────┘  │ + getStockInfo() │  └─────────────────────┘ │ │
│  │                       └──────────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. 依存関係とライフサイクル管理

### 8.1 依存性注入設定

```typescript
// src/shared/infrastructure/di/container.ts

/**
 * DI コンテナ設定
 */
import { Container } from 'inversify';
import type { 
  SalarySlipRepository, 
  StockPortfolioRepository,
  UserRepository
} from '../interfaces';

const container = new Container();

// Repositories
container.bind<SalarySlipRepository>('SalarySlipRepository')
  .to(PrismaSalarySlipRepository)
  .inSingletonScope();

container.bind<StockPortfolioRepository>('StockPortfolioRepository')
  .to(PrismaStockPortfolioRepository)
  .inSingletonScope();

container.bind<UserRepository>('UserRepository')
  .to(PrismaUserRepository)
  .inSingletonScope();

// Services
container.bind<SalarySlipService>('SalarySlipService')
  .to(SalarySlipService)
  .inTransientScope();

container.bind<PortfolioService>('PortfolioService')
  .to(PortfolioService)
  .inTransientScope();

// Infrastructure Services
container.bind<PdfParserService>('PdfParserService')
  .to(TesseractPdfParserService)
  .inSingletonScope();

container.bind<StockPriceService>('StockPriceService')
  .to(AlphaVantageStockPriceService)
  .inSingletonScope();

container.bind<Logger>('Logger')
  .to(WinstonLogger)
  .inSingletonScope();

container.bind<EventBus>('EventBus')
  .to(InMemoryEventBus)
  .inSingletonScope();

container.bind<UnitOfWork>('UnitOfWork')
  .to(PrismaUnitOfWork)
  .inTransientScope();

export { container };
```

### 8.2 ライフサイクル管理

```typescript
// src/shared/infrastructure/lifecycle/application-lifecycle.ts

/**
 * アプリケーションライフサイクル管理
 */
export class ApplicationLifecycleManager {
  private readonly logger: Logger;
  private readonly prisma: PrismaClient;
  private readonly eventBus: EventBus;

  constructor(
    logger: Logger,
    prisma: PrismaClient,
    eventBus: EventBus
  ) {
    this.logger = logger;
    this.prisma = prisma;
    this.eventBus = eventBus;
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing application...');

    try {
      // データベース接続確認
      await this.prisma.$connect();
      this.logger.info('Database connection established');

      // イベントバス初期化
      await this.eventBus.initialize();
      this.logger.info('Event bus initialized');

      // 外部サービス健全性チェック
      await this.checkExternalServices();
      
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');

    try {
      // イベント処理完了待ち
      await this.eventBus.flush();
      this.logger.info('Event bus flushed');

      // データベース接続クローズ
      await this.prisma.$disconnect();
      this.logger.info('Database connection closed');

      this.logger.info('Application shutdown completed');
    } catch (error) {
      this.logger.error('Error during application shutdown', { error });
      throw error;
    }
  }

  private async checkExternalServices(): Promise<void> {
    // 外部サービスの健全性チェック実装
    // 株価API、PDF解析サービスなどの接続確認
  }
}
```

---

## 9. 次のステップ

1. ✅ クラス構造設計（本書）
2. → ビジネスロジック設計（Service層・Repository層）
3. → デザインパターン適用設計
4. → 実装ガイドライン作成
5. → ユニットテスト戦略定義
6. → パフォーマンスチューニング指針

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| クラス設計アーキテクト | クラス設計アーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | クラス設計アーキテクト |
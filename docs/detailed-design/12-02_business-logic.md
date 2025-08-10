# ビジネスロジック設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: ビジネスロジックアーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ

---

## 1. 設計概要

### 1.1 ビジネスロジック設計原則

本システムのビジネスロジックは、ドメイン駆動設計（DDD）とクリーンアーキテクチャの原則に基づいて設計されています：

| 原則 | 適用内容 | 実装アプローチ |
|------|----------|----------------|
| **ドメイン中心設計** | ビジネスルールをドメインエンティティに集約 | 豊富なドメインモデル |
| **レイヤー分離** | 関心事の分離によるクリーンな構造 | Application/Domain/Infrastructure |
| **依存関係逆転** | 抽象に依存、具象に依存しない | インターフェースを通じた依存 |
| **単一責任** | 各サービスは単一の責務を持つ | 機能別サービス分割 |
| **テスタビリティ** | 単体テストが容易な設計 | 依存性注入とモック対応 |

### 1.2 アーキテクチャ構造

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │ ← UI Components / API Routes
├─────────────────────────────────────────────┤
│            Application Layer                │ ← Use Cases / Application Services
│  ┌─────────────────────────────────────────┐ │
│  │        Domain Services                  │ │ ← Complex Business Logic
│  └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│              Domain Layer                   │ ← Entities / Value Objects / Domain Events
├─────────────────────────────────────────────┤
│          Infrastructure Layer               │ ← Repositories / External APIs / Database
└─────────────────────────────────────────────┘
```

---

## 2. ドメインサービス設計

### 2.1 給料明細統計サービス

```typescript
// src/entities/salary-slip/domain/salary-statistics.domain-service.ts

/**
 * 給料統計ドメインサービス
 * 
 * @description 複数の給料明細にわたる複雑な統計計算を担当
 * 単一のエンティティでは表現できないビジネスロジックを実装
 */
export class SalaryStatisticsDomainService {
  constructor(
    private readonly taxCalculationService: TaxCalculationService,
    private readonly industryBenchmarkService: IndustryBenchmarkService
  ) {}

  /**
   * 年間統計の算出
   */
  public calculateAnnualStatistics(
    salarySlips: SalarySlip[],
    targetYear: number
  ): AnnualSalaryStatistics {
    const yearSlips = this.filterByYear(salarySlips, targetYear);
    
    if (yearSlips.length === 0) {
      return AnnualSalaryStatistics.empty();
    }

    // 基本統計計算
    const totalAnnualIncome = this.calculateTotalIncome(yearSlips);
    const averageMonthlyIncome = MoneyAmount.divide(totalAnnualIncome, yearSlips.length);
    const averageOvertimeHours = this.calculateAverageOvertimeHours(yearSlips);

    // 税率計算（複雑な税制ロジック）
    const effectiveTaxRate = this.taxCalculationService.calculateEffectiveTaxRate(
      totalAnnualIncome,
      yearSlips
    );

    // 貯蓄率計算
    const totalDeductions = this.calculateTotalDeductions(yearSlips);
    const savingsRate = this.calculateSavingsRate(totalAnnualIncome, totalDeductions);

    // 成長率計算（前年比較）
    const previousYearSlips = this.filterByYear(salarySlips, targetYear - 1);
    const incomeGrowthRate = this.calculateIncomeGrowthRate(
      yearSlips,
      previousYearSlips
    );

    // 業界比較
    const industryComparison = this.industryBenchmarkService.compare(
      averageMonthlyIncome,
      targetYear
    );

    return AnnualSalaryStatistics.create({
      year: targetYear,
      totalAnnualIncome,
      averageMonthlyIncome,
      averageOvertimeHours,
      effectiveTaxRate,
      savingsRate,
      incomeGrowthRate,
      industryComparison,
      monthlyBreakdown: this.createMonthlyBreakdown(yearSlips),
      categoryBreakdown: this.createCategoryBreakdown(yearSlips)
    });
  }

  /**
   * 月別トレンド分析
   */
  public calculateMonthlyTrends(
    salarySlips: SalarySlip[],
    periodMonths: number = 12
  ): MonthlyTrendAnalysis {
    const recentSlips = this.getRecentSlips(salarySlips, periodMonths);
    const trends = new Map<string, TrendData>();

    // 収入トレンド
    const incomeData = recentSlips.map(slip => ({
      month: this.formatMonth(slip.paymentDate),
      value: slip.totalEarnings.toNumber()
    }));
    trends.set('income', this.analyzeTrend(incomeData));

    // 残業時間トレンド
    const overtimeData = recentSlips.map(slip => ({
      month: this.formatMonth(slip.paymentDate),
      value: slip.attendance.overtimeHours + slip.attendance.overtimeHoursOver60
    }));
    trends.set('overtime', this.analyzeTrend(overtimeData));

    // 控除額トレンド
    const deductionData = recentSlips.map(slip => ({
      month: this.formatMonth(slip.paymentDate),
      value: slip.totalDeductions.toNumber()
    }));
    trends.set('deductions', this.analyzeTrend(deductionData));

    return MonthlyTrendAnalysis.create({
      period: periodMonths,
      trends,
      insights: this.generateInsights(trends),
      projections: this.calculateProjections(trends)
    });
  }

  /**
   * 異常検知
   */
  public detectAnomalies(salarySlips: SalarySlip[]): SalaryAnomalyReport {
    const anomalies: SalaryAnomaly[] = [];
    const statistics = this.calculateBaselineStatistics(salarySlips);

    for (const slip of salarySlips) {
      // 収入の異常検知
      const incomeAnomaly = this.detectIncomeAnomaly(slip, statistics);
      if (incomeAnomaly) {
        anomalies.push(incomeAnomaly);
      }

      // 残業時間の異常検知
      const overtimeAnomaly = this.detectOvertimeAnomaly(slip, statistics);
      if (overtimeAnomaly) {
        anomalies.push(overtimeAnomaly);
      }

      // 控除額の異常検知
      const deductionAnomaly = this.detectDeductionAnomaly(slip, statistics);
      if (deductionAnomaly) {
        anomalies.push(deductionAnomaly);
      }
    }

    return SalaryAnomalyReport.create({
      detectionPeriod: this.getDetectionPeriod(salarySlips),
      totalAnomalies: anomalies.length,
      anomalies: anomalies.sort((a, b) => b.severity - a.severity),
      recommendations: this.generateRecommendations(anomalies)
    });
  }

  // プライベートメソッド
  private filterByYear(slips: SalarySlip[], year: number): SalarySlip[] {
    return slips.filter(slip => slip.paymentDate.getFullYear() === year);
  }

  private calculateTotalIncome(slips: SalarySlip[]): MoneyAmount {
    return MoneyAmount.sum(slips.map(slip => slip.totalEarnings));
  }

  private calculateAverageOvertimeHours(slips: SalarySlip[]): number {
    const totalOvertime = slips.reduce((sum, slip) => 
      sum + slip.attendance.overtimeHours + slip.attendance.overtimeHoursOver60, 0
    );
    return totalOvertime / slips.length;
  }

  private calculateTotalDeductions(slips: SalarySlip[]): MoneyAmount {
    return MoneyAmount.sum(slips.map(slip => slip.totalDeductions));
  }

  private calculateSavingsRate(income: MoneyAmount, deductions: MoneyAmount): Percentage {
    if (income.isZero()) return 0;
    const netIncome = MoneyAmount.subtract(income, deductions);
    // 仮定：手取りの20%を貯蓄とする（実際の貯蓄データが必要）
    const assumedSavings = MoneyAmount.multiply(netIncome, 0.2);
    return (assumedSavings.toNumber() / income.toNumber()) * 100;
  }

  private calculateIncomeGrowthRate(
    currentYearSlips: SalarySlip[],
    previousYearSlips: SalarySlip[]
  ): Percentage {
    if (previousYearSlips.length === 0) return 0;

    const currentIncome = this.calculateTotalIncome(currentYearSlips);
    const previousIncome = this.calculateTotalIncome(previousYearSlips);

    if (previousIncome.isZero()) return 0;

    const growthAmount = MoneyAmount.subtract(currentIncome, previousIncome);
    return (growthAmount.toNumber() / previousIncome.toNumber()) * 100;
  }

  private analyzeTrend(data: Array<{ month: string; value: number }>): TrendData {
    if (data.length < 2) {
      return TrendData.create({
        direction: 'stable',
        strength: 0,
        volatility: 0,
        correlation: 0
      });
    }

    // 線形回帰による傾向分析
    const regression = this.calculateLinearRegression(data);
    const direction = this.determineTrendDirection(regression.slope);
    const strength = Math.abs(regression.correlation);
    const volatility = this.calculateVolatility(data);

    return TrendData.create({
      direction,
      strength,
      volatility,
      correlation: regression.correlation,
      slope: regression.slope,
      rSquared: regression.rSquared
    });
  }

  private calculateLinearRegression(data: Array<{ month: string; value: number }>): {
    slope: number;
    intercept: number;
    correlation: number;
    rSquared: number;
  } {
    const n = data.length;
    const xValues = data.map((_, index) => index);
    const yValues = data.map(d => d.value);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    const rSquared = correlation * correlation;

    return { slope, intercept, correlation, rSquared };
  }

  private determineTrendDirection(slope: number): 'up' | 'down' | 'stable' {
    const threshold = 0.01; // 傾きの閾値
    if (slope > threshold) return 'up';
    if (slope < -threshold) return 'down';
    return 'stable';
  }

  private calculateVolatility(data: Array<{ month: string; value: number }>): number {
    if (data.length < 2) return 0;

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return standardDeviation / mean; // 変動係数
  }
}
```

### 2.2 株式ポートフォリオ評価サービス

```typescript
// src/entities/stock/domain/portfolio-valuation.domain-service.ts

/**
 * ポートフォリオ評価ドメインサービス
 * 
 * @description 複数の株式ポートフォリオの評価と分析を担当
 * リスク分析、パフォーマンス評価、リバランス推奨などの複雑なロジックを実装
 */
export class PortfolioValuationDomainService {
  constructor(
    private readonly riskCalculationService: RiskCalculationService,
    private readonly benchmarkService: BenchmarkService,
    private readonly currencyConversionService: CurrencyConversionService
  ) {}

  /**
   * ポートフォリオ総合評価
   */
  public evaluatePortfolio(
    portfolios: StockPortfolio[],
    currentPrices: Map<EntityId, StockCurrentPrice>,
    benchmarkData: BenchmarkData
  ): PortfolioEvaluation {
    const valuations = this.calculatePortfolioValuations(portfolios, currentPrices);
    const totalValuation = this.aggregateValuations(valuations);
    
    // リスク分析
    const riskMetrics = this.riskCalculationService.calculatePortfolioRisk(
      valuations,
      benchmarkData
    );

    // パフォーマンス分析
    const performanceMetrics = this.calculatePerformanceMetrics(
      valuations,
      benchmarkData
    );

    // 多様化分析
    const diversificationAnalysis = this.analyzeDiversification(valuations);

    // リバランス推奨
    const rebalanceRecommendations = this.generateRebalanceRecommendations(
      valuations,
      riskMetrics
    );

    return PortfolioEvaluation.create({
      totalValuation,
      riskMetrics,
      performanceMetrics,
      diversificationAnalysis,
      rebalanceRecommendations,
      lastUpdated: new Date(),
      marketCondition: this.assessMarketCondition(benchmarkData)
    });
  }

  /**
   * リスク調整後リターン計算
   */
  public calculateRiskAdjustedReturns(
    portfolios: StockPortfolio[],
    historicalPrices: Map<EntityId, StockPriceHistory[]>,
    riskFreeRate: number
  ): RiskAdjustedReturnsAnalysis {
    const returns = new Map<EntityId, number[]>();
    const volatilities = new Map<EntityId, number>();
    const sharpeRatios = new Map<EntityId, number>();

    for (const portfolio of portfolios) {
      const priceHistory = historicalPrices.get(portfolio.stockId);
      if (!priceHistory || priceHistory.length < 2) continue;

      // 日次リターン計算
      const dailyReturns = this.calculateDailyReturns(priceHistory);
      returns.set(portfolio.stockId, dailyReturns);

      // 年率リターン計算
      const annualizedReturn = this.calculateAnnualizedReturn(dailyReturns);
      
      // ボラティリティ計算
      const volatility = this.calculateVolatility(dailyReturns);
      volatilities.set(portfolio.stockId, volatility);

      // シャープレシオ計算
      const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;
      sharpeRatios.set(portfolio.stockId, sharpeRatio);
    }

    // ポートフォリオ全体のメトリクス
    const portfolioReturn = this.calculatePortfolioReturn(portfolios, returns);
    const portfolioVolatility = this.calculatePortfolioVolatility(portfolios, returns, volatilities);
    const portfolioSharpe = (portfolioReturn - riskFreeRate) / portfolioVolatility;

    return RiskAdjustedReturnsAnalysis.create({
      individualReturns: returns,
      individualVolatilities: volatilities,
      individualSharpeRatios: sharpeRatios,
      portfolioReturn,
      portfolioVolatility,
      portfolioSharpe,
      riskFreeRate,
      analysisDate: new Date()
    });
  }

  /**
   * ESG評価統合
   */
  public integrateESGScores(
    portfolios: StockPortfolio[],
    esgData: Map<EntityId, ESGScore>
  ): ESGPortfolioAnalysis {
    let totalESGScore = 0;
    let totalWeight = 0;
    const esgBreakdown = new Map<ESGCategory, number>();
    const lowESGHoldings: PortfolioESGIssue[] = [];

    for (const portfolio of portfolios) {
      const esgScore = esgData.get(portfolio.stockId);
      if (!esgScore) continue;

      const weight = this.calculatePortfolioWeight(portfolio, portfolios);
      totalESGScore += esgScore.composite * weight;
      totalWeight += weight;

      // カテゴリ別スコア集計
      esgBreakdown.set('environmental', 
        (esgBreakdown.get('environmental') || 0) + esgScore.environmental * weight
      );
      esgBreakdown.set('social', 
        (esgBreakdown.get('social') || 0) + esgScore.social * weight
      );
      esgBreakdown.set('governance', 
        (esgBreakdown.get('governance') || 0) + esgScore.governance * weight
      );

      // 低ESGスコア銘柄の特定
      if (esgScore.composite < 30) { // ESGスコア30未満を低評価とする
        lowESGHoldings.push(
          PortfolioESGIssue.create({
            stockId: portfolio.stockId,
            currentWeight: weight,
            esgScore: esgScore.composite,
            mainIssues: esgScore.issues,
            recommendedAction: this.getESGRecommendation(esgScore)
          })
        );
      }
    }

    const weightedESGScore = totalWeight > 0 ? totalESGScore / totalWeight : 0;

    return ESGPortfolioAnalysis.create({
      overallESGScore: weightedESGScore,
      categoryBreakdown: esgBreakdown,
      esgRating: this.determineESGRating(weightedESGScore),
      lowESGHoldings,
      improvementSuggestions: this.generateESGImprovements(lowESGHoldings),
      benchmarkComparison: this.compareESGToBenchmark(weightedESGScore)
    });
  }

  // プライベートメソッド
  private calculatePortfolioValuations(
    portfolios: StockPortfolio[],
    currentPrices: Map<EntityId, StockCurrentPrice>
  ): PortfolioValuation[] {
    return portfolios.map(portfolio => {
      const currentPrice = currentPrices.get(portfolio.stockId);
      if (!currentPrice) {
        throw new PortfolioError(`Current price not found for stock: ${portfolio.stockId.value}`);
      }

      const currentValue = MoneyAmount.multiply(
        currentPrice.currentPrice,
        portfolio.quantity.value
      );

      const unrealizedGainLoss = portfolio.calculateUnrealizedGainLoss(currentPrice.currentPrice);

      return PortfolioValuation.create({
        portfolioId: portfolio.id,
        stockId: portfolio.stockId,
        quantity: portfolio.quantity,
        averagePurchasePrice: portfolio.averagePurchasePrice,
        currentPrice: currentPrice.currentPrice,
        currentValue,
        totalInvestment: portfolio.totalInvestment,
        unrealizedGainLoss,
        dayChange: currentPrice.dayChange,
        dayChangePercent: currentPrice.dayChangePercent
      });
    });
  }

  private calculateDailyReturns(priceHistory: StockPriceHistory[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < priceHistory.length; i++) {
      const currentPrice = priceHistory[i].close.toNumber();
      const previousPrice = priceHistory[i - 1].close.toNumber();
      const dailyReturn = (currentPrice - previousPrice) / previousPrice;
      returns.push(dailyReturn);
    }

    return returns;
  }

  private calculateAnnualizedReturn(dailyReturns: number[]): number {
    if (dailyReturns.length === 0) return 0;

    const cumulativeReturn = dailyReturns.reduce((cum, ret) => cum * (1 + ret), 1) - 1;
    const tradingDaysPerYear = 252;
    const annualizedReturn = Math.pow(1 + cumulativeReturn, tradingDaysPerYear / dailyReturns.length) - 1;

    return annualizedReturn;
  }

  private calculateVolatility(dailyReturns: number[]): number {
    if (dailyReturns.length < 2) return 0;

    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (dailyReturns.length - 1);
    const dailyVolatility = Math.sqrt(variance);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252); // 年率化

    return annualizedVolatility;
  }

  private analyzeDiversification(valuations: PortfolioValuation[]): DiversificationAnalysis {
    const totalValue = MoneyAmount.sum(valuations.map(v => v.currentValue));
    
    // 銘柄別集中度
    const concentrationRisk = this.calculateConcentrationRisk(valuations, totalValue);
    
    // ハーフィンダール指数計算
    const herfindahlIndex = this.calculateHerfindahlIndex(valuations, totalValue);
    
    // 有効銘柄数
    const effectiveStocks = herfindahlIndex > 0 ? 1 / herfindahlIndex : valuations.length;

    return DiversificationAnalysis.create({
      totalHoldings: valuations.length,
      effectiveStocks: Math.round(effectiveStocks),
      herfindahlIndex,
      concentrationRisk,
      diversificationScore: this.calculateDiversificationScore(herfindahlIndex, valuations.length),
      recommendations: this.generateDiversificationRecommendations(concentrationRisk, herfindahlIndex)
    });
  }

  private calculateConcentrationRisk(
    valuations: PortfolioValuation[],
    totalValue: MoneyAmount
  ): ConcentrationRisk {
    const weights = valuations.map(v => 
      v.currentValue.toNumber() / totalValue.toNumber()
    );

    const sortedWeights = weights.sort((a, b) => b - a);
    const top5Concentration = sortedWeights.slice(0, 5).reduce((sum, w) => sum + w, 0);
    const top10Concentration = sortedWeights.slice(0, 10).reduce((sum, w) => sum + w, 0);

    return ConcentrationRisk.create({
      largestPosition: sortedWeights[0] || 0,
      top5Concentration,
      top10Concentration,
      riskLevel: this.determineConcentrationRiskLevel(sortedWeights[0] || 0)
    });
  }

  private calculateHerfindahlIndex(
    valuations: PortfolioValuation[],
    totalValue: MoneyAmount
  ): number {
    return valuations.reduce((sum, valuation) => {
      const weight = valuation.currentValue.toNumber() / totalValue.toNumber();
      return sum + (weight * weight);
    }, 0);
  }

  private determineConcentrationRiskLevel(largestPosition: number): 'low' | 'medium' | 'high' | 'extreme' {
    if (largestPosition > 0.5) return 'extreme';
    if (largestPosition > 0.3) return 'high';
    if (largestPosition > 0.15) return 'medium';
    return 'low';
  }
}
```

---

## 3. アプリケーションサービス設計

### 3.1 ユースケース設計

```typescript
// src/features/salary-slip/application/use-cases/create-salary-slip-from-pdf.use-case.ts

/**
 * PDF から給料明細を作成するユースケース
 * 
 * @description アプリケーション層でのユースケース実装
 * UI層からの要求を受け、ドメイン層のビジネスロジックを組み合わせて処理
 */
export class CreateSalarySlipFromPdfUseCase {
  constructor(
    private readonly salarySlipRepository: SalarySlipRepository,
    private readonly pdfParserService: PdfParserService,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly auditLogService: AuditLogService,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  async execute(
    command: CreateSalarySlipFromPdfCommand
  ): Promise<CreateSalarySlipFromPdfResult> {
    this.logger.info('Executing CreateSalarySlipFromPdfUseCase', {
      userId: command.userId.value,
      fileCount: command.files.length
    });

    const results: SalarySlipCreationResult[] = [];
    const warnings: ValidationWarning[] = [];

    // ファイル事前検証
    const validationResult = this.validateFiles(command.files);
    if (!validationResult.isValid) {
      throw new ValidationError('Invalid files provided', validationResult.errors);
    }

    // 各ファイルを処理
    for (const file of command.files) {
      try {
        const result = await this.processSingleFile(command.userId, file, command.options);
        results.push(result);

        // 低信頼度の場合は警告を追加
        if (result.confidence < 0.8) {
          warnings.push(
            ValidationWarning.create({
              type: 'LOW_CONFIDENCE',
              message: 'PDFの解析精度が低い可能性があります',
              fileName: file.name,
              confidence: result.confidence
            })
          );
        }
      } catch (error) {
        this.logger.error('Failed to process PDF file', {
          fileName: file.name,
          error: error.message
        });

        results.push(
          SalarySlipCreationResult.failed({
            fileName: file.name,
            error: error instanceof DomainError ? error : new ProcessingError(error.message)
          })
        );
      }
    }

    // 結果の集計
    const summary = this.createSummary(results, warnings);

    // 監査ログ記録
    await this.auditLogService.logBulkOperation(
      command.userId,
      'CREATE_SALARY_SLIPS_FROM_PDF',
      {
        fileCount: command.files.length,
        successCount: summary.successCount,
        failureCount: summary.failureCount,
        duplicateCount: summary.duplicateCount
      }
    );

    // 成功したものがある場合はイベント発行
    if (summary.successCount > 0) {
      this.eventBus.publish(
        new BulkSalarySlipsCreatedEvent(
          command.userId,
          results.filter(r => r.isSuccess()),
          summary
        )
      );
    }

    return CreateSalarySlipFromPdfResult.create({
      userId: command.userId,
      results,
      summary,
      warnings,
      processedAt: new Date()
    });
  }

  private async processSingleFile(
    userId: EntityId,
    file: PdfFile,
    options: ProcessingOptions
  ): Promise<SalarySlipCreationResult> {
    // PDF解析
    const extractedData = await this.pdfParserService.extractSalarySlipData(file);
    
    // データの信頼性チェック
    this.validateExtractedData(extractedData);

    // 重複チェック
    const duplicateCheck = await this.duplicateDetectionService.checkForDuplicates(
      userId,
      extractedData
    );

    if (duplicateCheck.hasDuplicates && !options.allowOverwrite) {
      return SalarySlipCreationResult.duplicate({
        fileName: file.name,
        duplicateInfo: duplicateCheck,
        extractedData
      });
    }

    // ドメインエンティティ作成
    const salarySlip = SalarySlip.create({
      userId,
      companyName: extractedData.companyName,
      employeeName: extractedData.employeeName,
      employeeId: extractedData.employeeId,
      paymentDate: extractedData.paymentDate,
      targetPeriodStart: extractedData.targetPeriodStart,
      targetPeriodEnd: extractedData.targetPeriodEnd,
      attendance: AttendanceInfo.create(extractedData.attendance),
      earnings: EarningsDetail.create(extractedData.earnings),
      deductions: DeductionsDetail.create(extractedData.deductions),
      currency: extractedData.currency,
      sourceType: SalarySlipSourceType.PDF
    });

    // 重複がある場合は既存データを更新
    if (duplicateCheck.hasDuplicates && options.allowOverwrite) {
      const existingSalarySlip = await this.salarySlipRepository.findById(
        duplicateCheck.existingIds[0]
      );
      
      if (existingSalarySlip) {
        // 既存データを更新
        existingSalarySlip.updateEarnings(salarySlip.earnings);
        existingSalarySlip.updateDeductions(salarySlip.deductions);
        await this.salarySlipRepository.save(existingSalarySlip);
        
        return SalarySlipCreationResult.updated({
          fileName: file.name,
          salarySlipId: existingSalarySlip.id,
          confidence: extractedData.confidence,
          previousData: duplicateCheck.existingData
        });
      }
    }

    // 新規保存
    await this.salarySlipRepository.save(salarySlip);

    // 添付ファイルの保存（必要に応じて）
    if (options.saveOriginalFile) {
      await this.saveAttachmentFile(salarySlip.id, file);
    }

    return SalarySlipCreationResult.success({
      fileName: file.name,
      salarySlipId: salarySlip.id,
      confidence: extractedData.confidence,
      extractedData
    });
  }

  private validateFiles(files: PdfFile[]): FileValidationResult {
    const errors: ValidationError[] = [];

    if (files.length === 0) {
      errors.push(new ValidationError('No files provided'));
    }

    if (files.length > 10) {
      errors.push(new ValidationError('Too many files. Maximum 10 files allowed.'));
    }

    for (const file of files) {
      // ファイルサイズチェック
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push(new ValidationError(`File too large: ${file.name}`));
      }

      // ファイル形式チェック
      if (file.type !== 'application/pdf') {
        errors.push(new ValidationError(`Invalid file type: ${file.name}`));
      }

      // ファイル名チェック
      if (!this.isValidFileName(file.name)) {
        errors.push(new ValidationError(`Invalid file name: ${file.name}`));
      }
    }

    return FileValidationResult.create({
      isValid: errors.length === 0,
      errors,
      validFiles: files.filter(f => !errors.some(e => e.message.includes(f.name)))
    });
  }

  private validateExtractedData(data: ExtractedSalarySlipData): void {
    if (!data.companyName || data.companyName.trim().length === 0) {
      throw new DataExtractionError('会社名の抽出に失敗しました');
    }

    if (!data.employeeName || data.employeeName.trim().length === 0) {
      throw new DataExtractionError('従業員名の抽出に失敗しました');
    }

    if (!data.paymentDate || isNaN(data.paymentDate.getTime())) {
      throw new DataExtractionError('支払日の抽出に失敗しました');
    }

    if (!data.earnings.baseSalary || MoneyAmount.from(data.earnings.baseSalary).isZero()) {
      throw new DataExtractionError('基本給の抽出に失敗しました');
    }

    // 論理的整合性チェック
    const totalEarnings = EarningsDetail.create(data.earnings).calculateTotal();
    const totalDeductions = DeductionsDetail.create(data.deductions).calculateTotal();
    const netPay = MoneyAmount.subtract(totalEarnings, totalDeductions);

    if (netPay.isNegative()) {
      throw new DataExtractionError('計算結果が不正です（手取りがマイナス）');
    }
  }

  private isValidFileName(fileName: string): boolean {
    const validPattern = /^[a-zA-Z0-9\s\-_.()（）]+\.pdf$/i;
    return validPattern.test(fileName);
  }

  private createSummary(
    results: SalarySlipCreationResult[],
    warnings: ValidationWarning[]
  ): ProcessingSummary {
    const successCount = results.filter(r => r.isSuccess()).length;
    const failureCount = results.filter(r => r.isFailure()).length;
    const duplicateCount = results.filter(r => r.isDuplicate()).length;
    const updateCount = results.filter(r => r.isUpdate()).length;

    return ProcessingSummary.create({
      totalProcessed: results.length,
      successCount,
      failureCount,
      duplicateCount,
      updateCount,
      warningCount: warnings.length,
      averageConfidence: this.calculateAverageConfidence(results),
      processingTimeMs: Date.now() // 実際には開始時刻からの経過時間
    });
  }

  private calculateAverageConfidence(results: SalarySlipCreationResult[]): number {
    const successfulResults = results.filter(r => r.isSuccess() || r.isUpdate());
    if (successfulResults.length === 0) return 0;

    const totalConfidence = successfulResults.reduce((sum, result) => sum + result.confidence, 0);
    return totalConfidence / successfulResults.length;
  }
}
```

### 3.2 クエリサービス設計

```typescript
// src/features/salary-slip/application/queries/salary-slip.query-service.ts

/**
 * 給料明細クエリサービス
 * 
 * @description 読み取り専用の複雑なクエリを担当
 * CQRS パターンに基づく読み取り最適化
 */
export class SalarySlipQueryService {
  constructor(
    private readonly salarySlipRepository: SalarySlipRepository,
    private readonly statisticsService: SalaryStatisticsDomainService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {}

  /**
   * 詳細検索クエリ
   */
  async searchSalarySlips(
    query: SalarySlipSearchQuery
  ): Promise<PaginatedResult<SalarySlipListView>> {
    const cacheKey = this.buildCacheKey('search', query);
    
    // キャッシュから取得を試行
    const cached = await this.cacheService.get<PaginatedResult<SalarySlipListView>>(cacheKey);
    if (cached) {
      this.logger.debug('Salary slip search cache hit', { cacheKey });
      return cached;
    }

    // 検索仕様作成
    const specification = this.buildSearchSpecification(query);
    
    // リポジトリから検索
    const result = await this.salarySlipRepository.findBySpecification(
      query.userId,
      specification
    );

    // ビューモデルに変換
    const viewResult = this.convertToListViews(result);

    // キャッシュに保存（30分）
    await this.cacheService.set(cacheKey, viewResult, 1800);

    return viewResult;
  }

  /**
   * 統計データ取得
   */
  async getSalaryStatistics(
    query: SalaryStatisticsQuery
  ): Promise<SalaryStatisticsView> {
    const cacheKey = this.buildCacheKey('statistics', query);
    
    const cached = await this.cacheService.get<SalaryStatisticsView>(cacheKey);
    if (cached) {
      return cached;
    }

    // 期間内の給料明細を取得
    const salarySlips = await this.salarySlipRepository.findByDateRange(
      query.userId,
      query.dateRange
    );

    if (salarySlips.length === 0) {
      return SalaryStatisticsView.empty();
    }

    // 統計計算（ドメインサービス使用）
    let statistics: AnnualSalaryStatistics;
    
    if (query.type === 'annual') {
      statistics = this.statisticsService.calculateAnnualStatistics(
        salarySlips,
        query.year
      );
    } else {
      // 月次統計の場合
      const monthlyTrends = this.statisticsService.calculateMonthlyTrends(
        salarySlips,
        query.periodMonths
      );
      statistics = this.convertMonthlyTrendsToAnnual(monthlyTrends);
    }

    // ビューモデルに変換
    const view = this.convertStatisticsToView(statistics, query);

    // キャッシュに保存（2時間）
    await this.cacheService.set(cacheKey, view, 7200);

    return view;
  }

  /**
   * ダッシュボード用サマリー取得
   */
  async getDashboardSummary(
    query: DashboardSummaryQuery
  ): Promise<DashboardSummaryView> {
    const cacheKey = this.buildCacheKey('dashboard', query);
    
    const cached = await this.cacheService.get<DashboardSummaryView>(cacheKey);
    if (cached) {
      return cached;
    }

    // 並列で複数のデータを取得
    const [
      recentSalarySlips,
      currentYearStatistics,
      previousYearStatistics,
      monthlyTrends
    ] = await Promise.all([
      this.getRecentSalarySlips(query.userId, 3),
      this.getYearlyStatistics(query.userId, query.currentYear),
      this.getYearlyStatistics(query.userId, query.currentYear - 1),
      this.getMonthlyTrends(query.userId, 12)
    ]);

    // 成長率計算
    const growthRate = this.calculateYearOverYearGrowth(
      currentYearStatistics,
      previousYearStatistics
    );

    // アラート生成
    const alerts = this.generateDashboardAlerts(
      recentSalarySlips,
      monthlyTrends
    );

    const view = DashboardSummaryView.create({
      recentSalarySlips: recentSalarySlips.map(this.convertToSummaryView),
      currentYearSummary: {
        totalIncome: currentYearStatistics.totalAnnualIncome,
        averageMonthlyIncome: currentYearStatistics.averageMonthlyIncome,
        totalTax: this.calculateTotalTax(currentYearStatistics),
        averageOvertimeHours: currentYearStatistics.averageOvertimeHours
      },
      growthMetrics: {
        incomeGrowthRate: growthRate.income,
        overtimeGrowthRate: growthRate.overtime,
        taxGrowthRate: growthRate.tax
      },
      monthlyTrends: monthlyTrends.trends,
      alerts,
      lastUpdated: new Date()
    });

    // キャッシュに保存（10分）
    await this.cacheService.set(cacheKey, view, 600);

    return view;
  }

  /**
   * エクスポート用データ取得
   */
  async getExportData(
    query: ExportDataQuery
  ): Promise<SalarySlipExportData> {
    // エクスポートはキャッシュしない（データの一意性保証のため）
    
    const specification = this.buildExportSpecification(query);
    const salarySlips = await this.salarySlipRepository.findBySpecification(
      query.userId,
      specification
    );

    // フォーマット別にデータを整形
    switch (query.format) {
      case 'csv':
        return this.formatForCSV(salarySlips);
      case 'excel':
        return this.formatForExcel(salarySlips);
      case 'pdf':
        return this.formatForPDF(salarySlips);
      default:
        return this.formatForJSON(salarySlips);
    }
  }

  // プライベートメソッド
  private buildSearchSpecification(query: SalarySlipSearchQuery): SalarySlipSpecification {
    const builder = new SalarySlipSpecificationBuilder();

    if (query.status) {
      builder.withStatus(query.status);
    }

    if (query.companyName) {
      builder.withCompanyName(query.companyName);
    }

    if (query.dateRange) {
      builder.withDateRange(query.dateRange.start, query.dateRange.end);
    }

    if (query.amountRange) {
      builder.withAmountRange(query.amountRange.min, query.amountRange.max);
    }

    if (query.searchText) {
      builder.withFullTextSearch(query.searchText);
    }

    builder.withPagination(query.pagination.page, query.pagination.limit);
    builder.withSorting(query.sortBy, query.sortOrder);

    return builder.build();
  }

  private convertToListViews(
    result: PaginatedResult<SalarySlip>
  ): PaginatedResult<SalarySlipListView> {
    const listViews = result.data.map(salarySlip => 
      SalarySlipListView.create({
        id: salarySlip.id.value,
        companyName: salarySlip.companyName,
        employeeName: salarySlip.employeeName,
        paymentDate: salarySlip.paymentDate.toISOString(),
        totalEarnings: salarySlip.totalEarnings.value,
        totalDeductions: salarySlip.totalDeductions.value,
        netPay: salarySlip.netPay.value,
        status: salarySlip.status,
        sourceType: salarySlip.sourceType,
        createdAt: salarySlip.createdAt.toISOString(),
        // 表示用の追加情報
        displayMonth: this.formatDisplayMonth(salarySlip.paymentDate),
        overtimeHours: salarySlip.attendance.overtimeHours + salarySlip.attendance.overtimeHoursOver60,
        hasAttachment: false // TODO: 添付ファイルの有無を判定
      })
    );

    return new PaginatedResult(
      listViews,
      result.total,
      result.pagination
    );
  }

  private buildCacheKey(type: string, query: any): string {
    const queryHash = this.hashObject(query);
    return `salary_slip:${type}:${queryHash}`;
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  }

  private formatDisplayMonth(date: Date): string {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  }
}
```

---

## 4. Repository パターン設計

### 4.1 Repository インターフェース設計

```typescript
// src/features/salary-slip/domain/repositories/salary-slip.repository.ts

/**
 * 給料明細リポジトリインターフェース
 * 
 * @description ドメイン層での永続化抽象化
 * インフラストラクチャ層の実装から独立
 */
export interface SalarySlipRepository {
  /**
   * エンティティの保存
   */
  save(salarySlip: SalarySlip): Promise<void>;

  /**
   * エンティティの削除
   */
  delete(id: EntityId): Promise<void>;

  /**
   * IDによる単一取得
   */
  findById(id: EntityId): Promise<SalarySlip | null>;

  /**
   * IDとユーザーIDによる取得
   */
  findByIdAndUserId(id: EntityId, userId: EntityId): Promise<SalarySlip | null>;

  /**
   * ユーザーIDによる一覧取得（ページネーション付き）
   */
  findByUserId(
    userId: EntityId,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<SalarySlip>>;

  /**
   * 仕様パターンによる検索
   */
  findBySpecification(
    userId: EntityId,
    specification: SalarySlipSpecification
  ): Promise<PaginatedResult<SalarySlip>>;

  /**
   * 支払日による検索（重複チェック用）
   */
  findByPaymentDate(
    userId: EntityId,
    paymentDate: Date
  ): Promise<SalarySlip | null>;

  /**
   * 日付範囲による検索
   */
  findByDateRange(
    userId: EntityId,
    dateRange: DateRange
  ): Promise<SalarySlip[]>;

  /**
   * 統計計算用の集約クエリ
   */
  calculateStatistics(
    userId: EntityId,
    period: StatisticsPeriod
  ): Promise<SalarySlipStatistics>;

  /**
   * バルク操作サポート
   */
  saveMany(salarySlips: SalarySlip[]): Promise<void>;

  /**
   * 存在確認
   */
  exists(id: EntityId): Promise<boolean>;

  /**
   * カウント取得
   */
  countByUserId(userId: EntityId): Promise<number>;
}
```

### 4.2 仕様パターン実装

```typescript
// src/features/salary-slip/domain/specifications/salary-slip.specification.ts

/**
 * 給料明細検索仕様
 * 
 * @description 仕様パターンによる複雑な検索条件の抽象化
 */
export class SalarySlipSpecification {
  private constructor(
    public readonly status?: SalarySlipStatus,
    public readonly companyName?: string,
    public readonly dateRange?: DateRange,
    public readonly amountRange?: MoneyAmountRange,
    public readonly searchQuery?: string,
    public readonly pagination: PaginationOptions = { page: 1, limit: 20 },
    public readonly sortBy: string = 'paymentDate',
    public readonly sortOrder: 'asc' | 'desc' = 'desc'
  ) {}

  public static create(criteria: SalarySlipSearchCriteria): SalarySlipSpecification {
    return new SalarySlipSpecification(
      criteria.status,
      criteria.companyName,
      criteria.dateRange,
      criteria.amountRange,
      criteria.searchQuery,
      criteria.pagination,
      criteria.sortBy,
      criteria.sortOrder
    );
  }

  /**
   * 仕様の合成
   */
  public and(other: SalarySlipSpecification): CompositeSpecification {
    return new CompositeSpecification([this, other], 'AND');
  }

  public or(other: SalarySlipSpecification): CompositeSpecification {
    return new CompositeSpecification([this, other], 'OR');
  }

  /**
   * 仕様を満たすかどうかの判定
   */
  public isSatisfiedBy(salarySlip: SalarySlip): boolean {
    if (this.status && salarySlip.status !== this.status) {
      return false;
    }

    if (this.companyName && !salarySlip.companyName.toLowerCase().includes(this.companyName.toLowerCase())) {
      return false;
    }

    if (this.dateRange && !this.dateRange.contains(salarySlip.paymentDate)) {
      return false;
    }

    if (this.amountRange && !this.amountRange.contains(salarySlip.netPay)) {
      return false;
    }

    if (this.searchQuery && !this.matchesSearchQuery(salarySlip, this.searchQuery)) {
      return false;
    }

    return true;
  }

  private matchesSearchQuery(salarySlip: SalarySlip, query: string): boolean {
    const searchText = query.toLowerCase();
    
    return salarySlip.companyName.toLowerCase().includes(searchText) ||
           salarySlip.employeeName.toLowerCase().includes(searchText) ||
           salarySlip.employeeId.toLowerCase().includes(searchText);
  }
}

/**
 * 仕様ビルダー
 */
export class SalarySlipSpecificationBuilder {
  private status?: SalarySlipStatus;
  private companyName?: string;
  private dateRange?: DateRange;
  private amountRange?: MoneyAmountRange;
  private searchQuery?: string;
  private pagination: PaginationOptions = { page: 1, limit: 20 };
  private sortBy: string = 'paymentDate';
  private sortOrder: 'asc' | 'desc' = 'desc';

  public withStatus(status: SalarySlipStatus): this {
    this.status = status;
    return this;
  }

  public withCompanyName(companyName: string): this {
    this.companyName = companyName;
    return this;
  }

  public withDateRange(start: Date, end: Date): this {
    this.dateRange = new DateRange(start, end);
    return this;
  }

  public withAmountRange(min: MoneyAmount, max: MoneyAmount): this {
    this.amountRange = new MoneyAmountRange(min, max);
    return this;
  }

  public withFullTextSearch(query: string): this {
    this.searchQuery = query;
    return this;
  }

  public withPagination(page: number, limit: number): this {
    this.pagination = { page, limit };
    return this;
  }

  public withSorting(sortBy: string, sortOrder: 'asc' | 'desc'): this {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    return this;
  }

  public build(): SalarySlipSpecification {
    return new SalarySlipSpecification(
      this.status,
      this.companyName,
      this.dateRange,
      this.amountRange,
      this.searchQuery,
      this.pagination,
      this.sortBy,
      this.sortOrder
    );
  }
}
```

---

## 5. イベント駆動設計

### 5.1 ドメインイベント設計

```typescript
// src/shared/domain/events/domain-event.ts

/**
 * ドメインイベント基底クラス
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly version: number;

  protected constructor(
    public readonly aggregateId: EntityId,
    version: number = 1
  ) {
    this.eventId = cuid();
    this.occurredOn = new Date();
    this.version = version;
  }

  abstract get eventType(): string;
}

// src/entities/salary-slip/domain/events/salary-slip-created.event.ts

/**
 * 給料明細作成イベント
 */
export class SalarySlipCreatedEvent extends DomainEvent {
  constructor(
    public readonly salarySlip: SalarySlip
  ) {
    super(salarySlip.id);
  }

  get eventType(): string {
    return 'SalarySlipCreated';
  }

  public toJSON(): any {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId.value,
      occurredOn: this.occurredOn.toISOString(),
      version: this.version,
      data: {
        salarySlipId: this.salarySlip.id.value,
        userId: this.salarySlip.userId.value,
        companyName: this.salarySlip.companyName,
        paymentDate: this.salarySlip.paymentDate.toISOString(),
        totalEarnings: this.salarySlip.totalEarnings.value,
        netPay: this.salarySlip.netPay.value,
        sourceType: this.salarySlip.sourceType
      }
    };
  }
}
```

### 5.2 イベントハンドラー設計

```typescript
// src/features/salary-slip/application/event-handlers/salary-slip-created.event-handler.ts

/**
 * 給料明細作成イベントハンドラー
 */
@EventHandler(SalarySlipCreatedEvent)
export class SalarySlipCreatedEventHandler {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly analyticsService: AnalyticsService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {}

  async handle(event: SalarySlipCreatedEvent): Promise<void> {
    this.logger.info('Handling SalarySlipCreatedEvent', {
      eventId: event.eventId,
      salarySlipId: event.salarySlip.id.value
    });

    try {
      // 並列処理で複数の副作用を実行
      await Promise.allSettled([
        this.sendNotification(event),
        this.trackAnalytics(event),
        this.invalidateCache(event),
        this.updateStatistics(event)
      ]);

      this.logger.info('SalarySlipCreatedEvent handled successfully', {
        eventId: event.eventId
      });
    } catch (error) {
      this.logger.error('Failed to handle SalarySlipCreatedEvent', {
        eventId: event.eventId,
        error: error.message
      });
      
      // エラーの場合は補償トランザクションを実行
      await this.executeCompensation(event);
      throw error;
    }
  }

  private async sendNotification(event: SalarySlipCreatedEvent): Promise<void> {
    // ユーザーの通知設定を確認
    const shouldNotify = await this.notificationService.shouldNotifyForSalarySlipCreation(
      event.salarySlip.userId
    );

    if (!shouldNotify) return;

    // 通知を送信
    await this.notificationService.send(
      NotificationRequest.create({
        userId: event.salarySlip.userId,
        type: 'SALARY_SLIP_CREATED',
        title: '新しい給料明細が追加されました',
        message: `${event.salarySlip.companyName}の${this.formatPaymentMonth(event.salarySlip.paymentDate)}分の給料明細が追加されました。`,
        data: {
          salarySlipId: event.salarySlip.id.value,
          netPay: event.salarySlip.netPay.value
        }
      })
    );
  }

  private async trackAnalytics(event: SalarySlipCreatedEvent): Promise<void> {
    await this.analyticsService.track('salary_slip_created', {
      userId: event.salarySlip.userId.value,
      companyName: event.salarySlip.companyName,
      sourceType: event.salarySlip.sourceType,
      netPayAmount: event.salarySlip.netPay.toNumber(),
      processingDate: new Date().toISOString()
    });
  }

  private async invalidateCache(event: SalarySlipCreatedEvent): Promise<void> {
    const userId = event.salarySlip.userId.value;
    
    // 関連するキャッシュキーを削除
    await Promise.all([
      this.cacheService.deleteByPattern(`salary_slip:search:*${userId}*`),
      this.cacheService.deleteByPattern(`salary_slip:statistics:*${userId}*`),
      this.cacheService.deleteByPattern(`salary_slip:dashboard:*${userId}*`)
    ]);
  }

  private async updateStatistics(event: SalarySlipCreatedEvent): Promise<void> {
    // 統計データの即座更新（バックグラウンドで実行）
    await this.analyticsService.updateUserStatistics(event.salarySlip.userId);
  }

  private async executeCompensation(event: SalarySlipCreatedEvent): Promise<void> {
    // エラー時の補償処理（必要に応じて）
    this.logger.info('Executing compensation for SalarySlipCreatedEvent', {
      eventId: event.eventId
    });
  }

  private formatPaymentMonth(date: Date): string {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  }
}
```

---

## 6. トランザクション管理

### 6.1 Unit of Work パターン

```typescript
// src/shared/infrastructure/unit-of-work/unit-of-work.ts

/**
 * Unit of Work インターフェース
 */
export interface UnitOfWork {
  /**
   * トランザクション開始
   */
  begin(): Promise<void>;

  /**
   * コミット
   */
  commit(): Promise<void>;

  /**
   * ロールバック
   */
  rollback(): Promise<void>;

  /**
   * トランザクション内での操作実行
   */
  withTransaction<T>(operation: (uow: UnitOfWork) => Promise<T>): Promise<T>;

  /**
   * エンティティをトランザクションに登録
   */
  registerNew<T>(entity: T, repository: Repository<T>): void;
  registerDirty<T>(entity: T, repository: Repository<T>): void;
  registerDeleted<T>(entity: T, repository: Repository<T>): void;

  /**
   * 変更のコミット
   */
  commitChanges(): Promise<void>;
}

/**
 * Prisma Unit of Work 実装
 */
export class PrismaUnitOfWork implements UnitOfWork {
  private prismaTransaction?: Prisma.TransactionClient;
  private isTransactionActive = false;
  private newEntities = new Map<Repository<any>, any[]>();
  private dirtyEntities = new Map<Repository<any>, any[]>();
  private deletedEntities = new Map<Repository<any>, any[]>();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: Logger
  ) {}

  async begin(): Promise<void> {
    if (this.isTransactionActive) {
      throw new TransactionError('Transaction is already active');
    }

    this.logger.debug('Beginning transaction');
    this.isTransactionActive = true;
  }

  async commit(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new TransactionError('No active transaction to commit');
    }

    try {
      await this.commitChanges();
      this.logger.debug('Transaction committed successfully');
    } catch (error) {
      this.logger.error('Failed to commit transaction', { error });
      throw error;
    } finally {
      this.cleanup();
    }
  }

  async rollback(): Promise<void> {
    if (!this.isTransactionActive) {
      this.logger.warn('No active transaction to rollback');
      return;
    }

    try {
      this.logger.debug('Rolling back transaction');
      this.cleanup();
    } catch (error) {
      this.logger.error('Error during rollback', { error });
      throw error;
    }
  }

  async withTransaction<T>(operation: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (prismaTransaction) => {
      this.prismaTransaction = prismaTransaction;
      this.isTransactionActive = true;

      try {
        const result = await operation(this);
        await this.commitChanges();
        return result;
      } catch (error) {
        this.logger.error('Transaction operation failed', { error });
        throw error;
      } finally {
        this.cleanup();
      }
    });
  }

  registerNew<T>(entity: T, repository: Repository<T>): void {
    this.addToCollection(this.newEntities, repository, entity);
  }

  registerDirty<T>(entity: T, repository: Repository<T>): void {
    this.addToCollection(this.dirtyEntities, repository, entity);
  }

  registerDeleted<T>(entity: T, repository: Repository<T>): void {
    this.addToCollection(this.deletedEntities, repository, entity);
  }

  async commitChanges(): Promise<void> {
    const prismaClient = this.prismaTransaction || this.prisma;

    try {
      // 削除処理
      for (const [repository, entities] of this.deletedEntities) {
        for (const entity of entities) {
          await repository.delete(entity.id, prismaClient);
        }
      }

      // 新規作成処理
      for (const [repository, entities] of this.newEntities) {
        for (const entity of entities) {
          await repository.create(entity, prismaClient);
        }
      }

      // 更新処理
      for (const [repository, entities] of this.dirtyEntities) {
        for (const entity of entities) {
          await repository.update(entity, prismaClient);
        }
      }

      this.logger.debug('All changes committed successfully', {
        newCount: Array.from(this.newEntities.values()).flat().length,
        dirtyCount: Array.from(this.dirtyEntities.values()).flat().length,
        deletedCount: Array.from(this.deletedEntities.values()).flat().length
      });
    } catch (error) {
      this.logger.error('Failed to commit changes', { error });
      throw error;
    }
  }

  private addToCollection<T>(
    collection: Map<Repository<T>, T[]>,
    repository: Repository<T>,
    entity: T
  ): void {
    if (!collection.has(repository)) {
      collection.set(repository, []);
    }
    collection.get(repository)!.push(entity);
  }

  private cleanup(): void {
    this.isTransactionActive = false;
    this.prismaTransaction = undefined;
    this.newEntities.clear();
    this.dirtyEntities.clear();
    this.deletedEntities.clear();
  }
}
```

---

## 7. キャッシング戦略

### 7.1 多層キャッシュ設計

```typescript
// src/shared/infrastructure/cache/cache.service.ts

/**
 * キャッシュサービス
 */
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

/**
 * 多層キャッシュ実装
 */
export class MultiLayerCacheService implements CacheService {
  constructor(
    private readonly memoryCache: MemoryCache,
    private readonly redisCache: RedisCache,
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      // L1: メモリキャッシュから取得試行
      let value = await this.memoryCache.get<T>(key);
      if (value !== null) {
        this.logger.debug('Cache hit (L1)', { key });
        return value;
      }

      // L2: Redisキャッシュから取得試行
      value = await this.redisCache.get<T>(key);
      if (value !== null) {
        this.logger.debug('Cache hit (L2)', { key });
        // L1にも保存（短いTTL）
        await this.memoryCache.set(key, value, 300); // 5分
        return value;
      }

      this.logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      this.logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      // 両方のキャッシュに保存
      await Promise.all([
        this.memoryCache.set(key, value, Math.min(ttlSeconds, 300)), // L1は最大5分
        this.redisCache.set(key, value, ttlSeconds)
      ]);
      
      this.logger.debug('Cache set', { key, ttl: ttlSeconds });
    } catch (error) {
      this.logger.error('Cache set error', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await Promise.all([
        this.memoryCache.delete(key),
        this.redisCache.delete(key)
      ]);
      
      this.logger.debug('Cache delete', { key });
    } catch (error) {
      this.logger.error('Cache delete error', { key, error });
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      await Promise.all([
        this.memoryCache.deleteByPattern(pattern),
        this.redisCache.deleteByPattern(pattern)
      ]);
      
      this.logger.debug('Cache pattern delete', { pattern });
    } catch (error) {
      this.logger.error('Cache pattern delete error', { pattern, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      // どちらかにあればtrue
      const [memoryExists, redisExists] = await Promise.all([
        this.memoryCache.exists(key),
        this.redisCache.exists(key)
      ]);

      return memoryExists || redisExists;
    } catch (error) {
      this.logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await Promise.all([
        this.memoryCache.clear(),
        this.redisCache.clear()
      ]);
      
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Cache clear error', { error });
    }
  }
}
```

---

## 8. 次のステップ

1. ✅ ビジネスロジック設計（本書）
2. → デザインパターン適用設計
3. → 実装ガイドライン作成
4. → ユニットテスト戦略定義
5. → パフォーマンスチューニング指針
6. → 実装フェーズ開始

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| ビジネスロジックアーキテクト | ビジネスロジックアーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | ビジネスロジックアーキテクト |
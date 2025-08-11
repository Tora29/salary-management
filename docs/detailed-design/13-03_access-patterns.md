# データアクセスパターン最適化詳細設計書

## 文書情報

- **作成日**: 2025-08-10
- **作成者**: エキスパートデータベース詳細設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **データベース**: PostgreSQL 15+
- **ORM**: Prisma 5.x

---

## 1. アクセスパターン最適化概要

### 1.1 最適化戦略

本データアクセス最適化は、給料・資産管理システムの特性を考慮した包括的戦略です：

| 戦略                     | 目的                   | 実装手段                                 |
| ------------------------ | ---------------------- | ---------------------------------------- |
| **N+1問題完全排除**      | クエリ数の削減         | バッチローディング・事前結合の最適化     |
| **キャッシング戦略**     | データベース負荷軽減   | Redis + アプリケーションレベルキャッシュ |
| **バルクオペレーション** | 大量データ処理の高速化 | 一括INSERT・UPDATE・DELETEの最適化       |
| **非同期処理**           | ユーザー体験の向上     | バックグラウンドジョブとイベント駆動処理 |
| **データ同期最適化**     | リアルタイム性の確保   | WebSocket + 差分更新の実装               |

### 1.2 主要アクセスパターン分析

#### パフォーマンス重要度マトリクス

| 機能                   | 使用頻度 | データ量 | 重要度 | 最適化優先度 |
| ---------------------- | -------- | -------- | ------ | ------------ |
| ダッシュボード表示     | 極高     | 中       | 最高   | P0           |
| ポートフォリオサマリー | 極高     | 中       | 最高   | P0           |
| 給料明細一覧           | 高       | 大       | 高     | P1           |
| 株価リアルタイム更新   | 中       | 小       | 高     | P1           |
| レポート生成           | 中       | 大       | 中     | P2           |
| 全文検索               | 低       | 大       | 中     | P2           |

---

## 2. N+1問題完全排除戦略

### 2.1 問題パターンの特定と解決

#### パターン1: ダッシュボード表示のN+1問題

```typescript
// ❌ BAD: N+1問題発生パターン
async function getDashboardDataWithN1Problem(userId: string) {
	// 1. メインクエリ
	const salarySlips = await prisma.salarySlip.findMany({
		where: { userId },
		orderBy: { paymentDate: 'desc' },
		take: 12
	});

	// 2. N回のクエリが発生（N+1問題）
	const portfolios = await prisma.stockPortfolio.findMany({
		where: { userId, quantity: { gt: 0 } }
	});

	// 3. さらにN回のクエリ（株式マスタ情報）
	const enrichedPortfolios = await Promise.all(
		portfolios.map(async (portfolio) => ({
			...portfolio,
			stock: await prisma.stockMaster.findUnique({
				where: { id: portfolio.stockId }
			})
		}))
	);
}

// ✅ GOOD: N+1問題解決パターン
async function getDashboardDataOptimized(userId: string) {
	// 単一トランザクション内で並列実行
	const [salarySlips, portfoliosWithStock, totalAssets] = await prisma.$transaction([
		// 1. 給料明細（カバリングインデックス利用）
		prisma.salarySlip.findMany({
			where: { userId },
			select: {
				id: true,
				paymentDate: true,
				netPay: true,
				totalEarnings: true,
				totalDeductions: true,
				companyName: true,
				status: true
			},
			orderBy: { paymentDate: 'desc' },
			take: 12
		}),

		// 2. ポートフォリオ + 株式マスタ（JOINで一括取得）
		prisma.stockPortfolio.findMany({
			where: {
				userId,
				quantity: { gt: 0 }
			},
			select: {
				id: true,
				quantity: true,
				currentValue: true,
				unrealizedGainLoss: true,
				unrealizedGainLossRate: true,
				stock: {
					select: {
						symbol: true,
						name: true,
						exchange: true,
						sector: true,
						currency: true
					}
				}
			}
		}),

		// 3. 資産サマリー（集計クエリ）
		prisma.asset.aggregate({
			where: { userId },
			_sum: { amount: true }
		})
	]);

	return {
		salarySlips,
		portfolios: portfoliosWithStock,
		totalAssets: totalAssets._sum.amount || 0
	};
}
```

#### パターン2: リスト表示のバッチローディング

```typescript
// ✅ DataLoaderパターンの実装
import DataLoader from 'dataloader';

class DatabaseService {
	private stockMasterLoader: DataLoader<string, StockMaster>;
	private stockCurrentPriceLoader: DataLoader<string, StockCurrentPrice>;

	constructor() {
		this.stockMasterLoader = new DataLoader(
			async (stockIds: readonly string[]) => {
				const stocks = await prisma.stockMaster.findMany({
					where: { id: { in: [...stockIds] } },
					select: {
						id: true,
						symbol: true,
						name: true,
						exchange: true,
						sector: true,
						currency: true
					}
				});

				const stockMap = new Map(stocks.map((stock) => [stock.id, stock]));
				return stockIds.map((id) => stockMap.get(id) || null);
			},
			{
				cache: true,
				maxBatchSize: 100,
				cacheKeyFn: (key) => key
			}
		);

		this.stockCurrentPriceLoader = new DataLoader(
			async (stockIds: readonly string[]) => {
				const prices = await prisma.stockCurrentPrice.findMany({
					where: { stockId: { in: [...stockIds] } },
					select: {
						stockId: true,
						currentPrice: true,
						previousClose: true,
						dayChange: true,
						dayChangePercent: true,
						lastUpdated: true
					}
				});

				const priceMap = new Map(prices.map((price) => [price.stockId, price]));
				return stockIds.map((id) => priceMap.get(id) || null);
			},
			{
				cache: true,
				maxBatchSize: 100
			}
		);
	}

	// 効率的なポートフォリオデータ取得
	async getPortfolioWithDetails(userId: string) {
		const portfolios = await prisma.stockPortfolio.findMany({
			where: { userId, quantity: { gt: 0 } },
			select: {
				id: true,
				stockId: true,
				quantity: true,
				currentValue: true,
				unrealizedGainLoss: true,
				unrealizedGainLossRate: true
			}
		});

		// バッチローディングで関連データを取得
		const enrichedPortfolios = await Promise.all(
			portfolios.map(async (portfolio) => ({
				...portfolio,
				stock: await this.stockMasterLoader.load(portfolio.stockId),
				currentPrice: await this.stockCurrentPriceLoader.load(portfolio.stockId)
			}))
		);

		return enrichedPortfolios;
	}

	// キャッシュクリア
	clearCache() {
		this.stockMasterLoader.clearAll();
		this.stockCurrentPriceLoader.clearAll();
	}
}
```

### 2.2 Prismaクエリ最適化パターン

```typescript
// ✅ 効率的なinclude/selectパターン
class SalarySlipService {
	// 詳細表示用（必要最小限のデータのみ取得）
	async findById(id: string, userId: string) {
		return await prisma.salarySlip.findFirst({
			where: { id, userId },
			select: {
				id: true,
				companyName: true,
				employeeName: true,
				paymentDate: true,
				targetPeriodStart: true,
				targetPeriodEnd: true,
				baseSalary: true,
				totalEarnings: true,
				totalDeductions: true,
				netPay: true,
				currency: true,
				status: true,
				sourceType: true,
				// JSONBフィールドから特定キーのみ取得
				attendance: true,
				earnings: true,
				deductions: true,
				attachments: {
					select: {
						id: true,
						fileName: true,
						fileSize: true,
						uploadedAt: true
					}
				},
				createdAt: true,
				updatedAt: true
			}
		});
	}

	// リスト表示用（さらに軽量）
	async findMany(userId: string, params: PaginationParams) {
		const { page = 1, limit = 20, sortBy = 'paymentDate', sortOrder = 'desc' } = params;

		return await prisma.salarySlip.findMany({
			where: { userId },
			select: {
				id: true,
				companyName: true,
				paymentDate: true,
				netPay: true,
				currency: true,
				status: true,
				sourceType: true
			},
			orderBy: { [sortBy]: sortOrder },
			skip: (page - 1) * limit,
			take: limit
		});
	}

	// 集計処理用（COUNT効率化）
	async getStatistics(userId: string, year?: number) {
		const whereClause = year
			? {
					userId,
					paymentDate: {
						gte: new Date(`${year}-01-01`),
						lt: new Date(`${year + 1}-01-01`)
					},
					status: 'confirmed'
				}
			: {
					userId,
					status: 'confirmed'
				};

		// 単一クエリで複数の集計を同時実行
		const [totalCount, aggregates, monthlyData] = await prisma.$transaction([
			prisma.salarySlip.count({ where: whereClause }),

			prisma.salarySlip.aggregate({
				where: whereClause,
				_sum: {
					totalEarnings: true,
					totalDeductions: true,
					netPay: true
				},
				_avg: {
					totalEarnings: true,
					netPay: true
				},
				_max: {
					netPay: true,
					paymentDate: true
				},
				_min: {
					netPay: true,
					paymentDate: true
				}
			}),

			prisma.$queryRaw<
				Array<{
					month: string;
					total_net_pay: number;
					avg_net_pay: number;
					count: number;
				}>
			>`
        SELECT 
          TO_CHAR(payment_date, 'YYYY-MM') as month,
          SUM(net_pay)::numeric as total_net_pay,
          AVG(net_pay)::numeric as avg_net_pay,
          COUNT(*)::integer as count
        FROM salary_slips 
        WHERE user_id = ${userId}
          ${year ? Prisma.sql`AND EXTRACT(YEAR FROM payment_date) = ${year}` : Prisma.empty}
          AND status = 'confirmed'
        GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
        ORDER BY month DESC
      `
		]);

		return {
			totalCount,
			...aggregates,
			monthlyBreakdown: monthlyData
		};
	}
}
```

---

## 3. 高性能キャッシング戦略

### 3.1 Redis多層キャッシュ設計

```typescript
import { Redis } from 'ioredis';
import { LRUCache } from 'lru-cache';

interface CacheConfig {
	redis: Redis;
	l1Cache: LRUCache<string, any>;
	defaultTTL: number;
	keyPrefix: string;
}

class CacheService {
	private redis: Redis;
	private l1Cache: LRUCache<string, any>;
	private defaultTTL: number;
	private keyPrefix: string;

	constructor(config: CacheConfig) {
		this.redis = config.redis;
		this.l1Cache = config.l1Cache;
		this.defaultTTL = config.defaultTTL;
		this.keyPrefix = config.keyPrefix;
	}

	// 多層キャッシュ取得
	async get<T>(key: string): Promise<T | null> {
		const fullKey = `${this.keyPrefix}:${key}`;

		// L1キャッシュ（メモリ）から取得
		const l1Result = this.l1Cache.get(fullKey);
		if (l1Result !== undefined) {
			return l1Result;
		}

		// L2キャッシュ（Redis）から取得
		const l2Result = await this.redis.get(fullKey);
		if (l2Result) {
			const parsed = JSON.parse(l2Result);
			this.l1Cache.set(fullKey, parsed); // L1キャッシュに保存
			return parsed;
		}

		return null;
	}

	// 多層キャッシュ保存
	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		const fullKey = `${this.keyPrefix}:${key}`;
		const serialized = JSON.stringify(value);
		const cacheTTL = ttl || this.defaultTTL;

		// L1とL2の両方に保存
		this.l1Cache.set(fullKey, value);
		await this.redis.setex(fullKey, cacheTTL, serialized);
	}

	// キャッシュ削除
	async delete(key: string): Promise<void> {
		const fullKey = `${this.keyPrefix}:${key}`;
		this.l1Cache.delete(fullKey);
		await this.redis.del(fullKey);
	}

	// パターン削除（無効化）
	async deletePattern(pattern: string): Promise<void> {
		const fullPattern = `${this.keyPrefix}:${pattern}`;
		const keys = await this.redis.keys(fullPattern);

		if (keys.length > 0) {
			// L1キャッシュからも削除
			keys.forEach((key) => this.l1Cache.delete(key));
			// L2キャッシュから削除
			await this.redis.del(...keys);
		}
	}
}

// キャッシュ戦略の実装
class CachedDatabaseService {
	private cache: CacheService;

	constructor() {
		this.cache = new CacheService({
			redis: new Redis(process.env.REDIS_URL!),
			l1Cache: new LRUCache({
				max: 1000,
				ttl: 5 * 60 * 1000 // 5分
			}),
			defaultTTL: 300, // 5分
			keyPrefix: 'salary_mgmt'
		});
	}

	// ダッシュボードデータのキャッシュ
	async getDashboardData(userId: string) {
		const cacheKey = `dashboard:${userId}`;

		// キャッシュから取得試行
		let data = await this.cache.get(cacheKey);
		if (data) {
			return data;
		}

		// データベースから取得
		data = await this.fetchDashboardDataFromDB(userId);

		// キャッシュに保存（短いTTL）
		await this.cache.set(cacheKey, data, 60); // 1分キャッシュ

		return data;
	}

	// ポートフォリオサマリーのキャッシュ
	async getPortfolioSummary(userId: string) {
		const cacheKey = `portfolio:summary:${userId}`;

		let summary = await this.cache.get(cacheKey);
		if (summary) {
			return summary;
		}

		summary = await this.calculatePortfolioSummary(userId);
		await this.cache.set(cacheKey, summary, 300); // 5分キャッシュ

		return summary;
	}

	// 株価データのキャッシュ（高頻度更新）
	async getStockPrice(symbol: string) {
		const cacheKey = `stock:price:${symbol}`;

		let price = await this.cache.get(cacheKey);
		if (price) {
			return price;
		}

		price = await this.fetchStockPriceFromDB(symbol);
		await this.cache.set(cacheKey, price, 30); // 30秒キャッシュ

		return price;
	}

	// キャッシュ無効化（データ更新時）
	async invalidateUserCache(userId: string) {
		await Promise.all([
			this.cache.deletePattern(`dashboard:${userId}*`),
			this.cache.deletePattern(`portfolio:*:${userId}*`),
			this.cache.deletePattern(`salary:*:${userId}*`)
		]);
	}

	private async fetchDashboardDataFromDB(userId: string) {
		// 前述の最適化されたダッシュボードクエリ
		return await getDashboardDataOptimized(userId);
	}

	private async calculatePortfolioSummary(userId: string) {
		const portfolios = await prisma.stockPortfolio.findMany({
			where: { userId, quantity: { gt: 0 } },
			include: {
				stock: {
					select: { symbol: true, name: true, currency: true }
				}
			}
		});

		const summary = {
			totalValue: portfolios.reduce((sum, p) => sum + Number(p.currentValue), 0),
			totalGainLoss: portfolios.reduce((sum, p) => sum + Number(p.unrealizedGainLoss), 0),
			holdingsCount: portfolios.length,
			topHoldings: portfolios
				.sort((a, b) => Number(b.currentValue) - Number(a.currentValue))
				.slice(0, 5)
		};

		return summary;
	}

	private async fetchStockPriceFromDB(symbol: string) {
		return await prisma.stockCurrentPrice.findFirst({
			where: { stock: { symbol } },
			include: {
				stock: {
					select: { symbol: true, name: true, exchange: true }
				}
			}
		});
	}
}
```

### 3.2 キャッシュ無効化戦略

```typescript
// イベント駆動キャッシュ無効化
class CacheInvalidationService {
	private cache: CacheService;
	private eventEmitter: EventEmitter;

	constructor(cache: CacheService) {
		this.cache = cache;
		this.eventEmitter = new EventEmitter();
		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		// 給料明細更新時の無効化
		this.eventEmitter.on('salary_slip.created', async (data: { userId: string; id: string }) => {
			await Promise.all([
				this.cache.deletePattern(`dashboard:${data.userId}*`),
				this.cache.deletePattern(`salary:list:${data.userId}*`),
				this.cache.deletePattern(`salary:stats:${data.userId}*`)
			]);
		});

		this.eventEmitter.on('salary_slip.updated', async (data: { userId: string; id: string }) => {
			await Promise.all([
				this.cache.delete(`salary:detail:${data.id}`),
				this.cache.deletePattern(`dashboard:${data.userId}*`),
				this.cache.deletePattern(`salary:list:${data.userId}*`),
				this.cache.deletePattern(`salary:stats:${data.userId}*`)
			]);
		});

		// 株式取引更新時の無効化
		this.eventEmitter.on(
			'stock_transaction.created',
			async (data: { userId: string; stockId: string }) => {
				await Promise.all([
					this.cache.deletePattern(`portfolio:*:${data.userId}*`),
					this.cache.deletePattern(`dashboard:${data.userId}*`)
				]);
			}
		);

		// 株価更新時の無効化
		this.eventEmitter.on(
			'stock_price.updated',
			async (data: { symbol: string; stockId: string }) => {
				await Promise.all([
					this.cache.delete(`stock:price:${data.symbol}`),
					this.cache.deletePattern(`portfolio:*`), // 全ユーザーのポートフォリオに影響
					this.cache.deletePattern(`dashboard:*`) // 全ユーザーのダッシュボードに影響
				]);
			}
		);
	}

	// イベント発行
	emit(event: string, data: any) {
		this.eventEmitter.emit(event, data);
	}
}

// Prismaミドルウェアでの自動イベント発行
prisma.$use(async (params, next) => {
	const result = await next(params);

	// 作成・更新・削除時にイベント発行
	if (params.action === 'create' || params.action === 'update' || params.action === 'delete') {
		const eventName = `${params.model?.toLowerCase()}.${params.action}d`;
		cacheInvalidationService.emit(eventName, {
			userId: result?.userId || params.args?.where?.userId,
			id: result?.id || params.args?.where?.id,
			...result
		});
	}

	return result;
});
```

---

## 4. バルクオペレーション最適化

### 4.1 大量データ挿入の最適化

```typescript
class BulkOperationService {
	// 給料明細の一括作成（PDFアップロード時）
	async createSalarySlipsBulk(salarySlipsData: CreateSalarySlipInput[]) {
		// バッチサイズでの分割処理
		const batchSize = 100;
		const results: string[] = [];

		for (let i = 0; i < salarySlipsData.length; i += batchSize) {
			const batch = salarySlipsData.slice(i, i + batchSize);

			// トランザクション内でバッチ処理
			const batchResults = await prisma.$transaction(async (tx) => {
				// 重複チェック用のクエリ
				const existingSlips = await tx.salarySlip.findMany({
					where: {
						OR: batch.map((slip) => ({
							userId: slip.userId,
							paymentDate: slip.paymentDate,
							companyName: slip.companyName
						}))
					},
					select: {
						userId: true,
						paymentDate: true,
						companyName: true
					}
				});

				const existingKeys = new Set(
					existingSlips.map(
						(slip) => `${slip.userId}-${slip.paymentDate.toISOString()}-${slip.companyName}`
					)
				);

				// 重複を除外した新規データのみ処理
				const newSlips = batch.filter((slip) => {
					const key = `${slip.userId}-${slip.paymentDate}-${slip.companyName}`;
					return !existingKeys.has(key);
				});

				if (newSlips.length === 0) return [];

				// createManyで一括挿入
				await tx.salarySlip.createMany({
					data: newSlips.map((slip) => ({
						...slip,
						// 集計値の計算
						baseSalary: this.calculateBaseSalary(slip.earnings),
						totalEarnings: this.calculateTotalEarnings(slip.earnings),
						totalDeductions: this.calculateTotalDeductions(slip.deductions),
						netPay: this.calculateNetPay(slip.earnings, slip.deductions)
					})),
					skipDuplicates: true
				});

				// 作成されたIDを取得（PostgreSQLのRETURNING使用）
				const createdSlips = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM salary_slips 
          WHERE (user_id, payment_date, company_name) IN (
            ${Prisma.join(
							newSlips.map(
								(slip) => Prisma.sql`(${slip.userId}, ${slip.paymentDate}, ${slip.companyName})`
							)
						)}
          )
          AND created_at >= NOW() - INTERVAL '1 minute'
        `;

				return createdSlips.map((slip) => slip.id);
			});

			results.push(...batchResults);
		}

		return results;
	}

	// 株価データの一括更新
	async updateStockPricesBulk(priceUpdates: StockPriceUpdate[]) {
		const batchSize = 50;

		for (let i = 0; i < priceUpdates.length; i += batchSize) {
			const batch = priceUpdates.slice(i, i + batchSize);

			await prisma.$transaction(async (tx) => {
				// 一括UPSERT処理（PostgreSQLのON CONFLICT使用）
				for (const update of batch) {
					await tx.$executeRaw`
            INSERT INTO stock_current_prices (
              stock_id, current_price, previous_close, day_change, 
              day_change_percent, day_high, day_low, volume, 
              market_time, last_updated
            )
            VALUES (
              ${update.stockId}, ${update.currentPrice}, ${update.previousClose},
              ${update.dayChange}, ${update.dayChangePercent}, ${update.dayHigh},
              ${update.dayLow}, ${update.volume}, ${update.marketTime}, NOW()
            )
            ON CONFLICT (stock_id) DO UPDATE SET
              current_price = EXCLUDED.current_price,
              previous_close = EXCLUDED.previous_close,
              day_change = EXCLUDED.day_change,
              day_change_percent = EXCLUDED.day_change_percent,
              day_high = EXCLUDED.day_high,
              day_low = EXCLUDED.day_low,
              volume = EXCLUDED.volume,
              market_time = EXCLUDED.market_time,
              last_updated = NOW()
          `;
				}

				// ポートフォリオ価値の一括再計算
				await tx.$executeRaw`
          UPDATE stock_portfolios 
          SET 
            current_value = quantity * scp.current_price,
            unrealized_gain_loss = (quantity * scp.current_price) - total_investment,
            unrealized_gain_loss_rate = CASE 
              WHEN total_investment > 0 THEN
                ((quantity * scp.current_price - total_investment) / total_investment) * 100
              ELSE 0 
            END,
            updated_at = NOW()
          FROM stock_current_prices scp
          WHERE stock_portfolios.stock_id = scp.stock_id
            AND stock_portfolios.stock_id IN (${Prisma.join(batch.map((b) => Prisma.sql`${b.stockId}`))})
            AND stock_portfolios.quantity > 0
        `;
			});
		}
	}

	// 古いデータの一括削除
	async cleanupOldData(retentionDays: number = 365 * 2) {
		// 2年
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

		const deleteResults = await prisma.$transaction(async (tx) => {
			// 監査ログの削除
			const auditDeleted = await tx.$executeRaw`
        DELETE FROM audit.audit_logs 
        WHERE created_at < ${cutoffDate}
      `;

			// 期限切れセッションの削除
			const sessionDeleted = await tx.$executeRaw`
        DELETE FROM user_sessions 
        WHERE expires_at < NOW()
      `;

			// アーカイブ済み給料明細の古いデータ削除
			const salaryDeleted = await tx.$executeRaw`
        DELETE FROM salary_slips 
        WHERE status = 'archived' 
          AND updated_at < ${cutoffDate}
      `;

			// 古い株価履歴の削除（10年以上前）
			const oldCutoff = new Date();
			oldCutoff.setFullYear(oldCutoff.getFullYear() - 10);

			const priceHistoryDeleted = await tx.$executeRaw`
        DELETE FROM stock_price_histories 
        WHERE date < ${oldCutoff}
      `;

			return {
				auditDeleted,
				sessionDeleted,
				salaryDeleted,
				priceHistoryDeleted
			};
		});

		return deleteResults;
	}

	private calculateBaseSalary(earnings: Record<string, string>): number {
		return parseFloat(earnings.baseSalary || '0');
	}

	private calculateTotalEarnings(earnings: Record<string, string>): number {
		return Object.values(earnings).reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);
	}

	private calculateTotalDeductions(deductions: Record<string, string>): number {
		return Object.values(deductions).reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);
	}

	private calculateNetPay(
		earnings: Record<string, string>,
		deductions: Record<string, string>
	): number {
		return this.calculateTotalEarnings(earnings) - this.calculateTotalDeductions(deductions);
	}
}
```

### 4.2 ストリーミング処理による大量データ処理

```typescript
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

class StreamingDataProcessor {
	// 大量の給料明細データをストリーミング処理
	async processLargeSalaryDataset(dataSource: AsyncIterable<SalarySlipData>) {
		const batchProcessor = new Transform({
			objectMode: true,
			highWaterMark: 100,
			transform(chunk: SalarySlipData[], encoding, callback) {
				// バッチ単位での処理
				this.processBatch(chunk)
					.then((result) => callback(null, result))
					.catch((error) => callback(error));
			}
		});

		const resultCollector = new Transform({
			objectMode: true,
			transform(chunk, encoding, callback) {
				// 処理結果の集約
				callback(null, chunk);
			}
		});

		const results: any[] = [];

		await pipeline(
			Readable.from(dataSource),
			this.createBatcher(100), // 100件ずつバッチ化
			batchProcessor,
			resultCollector,
			async function* (source) {
				for await (const chunk of source) {
					results.push(chunk);
					yield chunk;
				}
			}
		);

		return results;
	}

	private createBatcher(batchSize: number) {
		let batch: any[] = [];

		return new Transform({
			objectMode: true,
			transform(chunk, encoding, callback) {
				batch.push(chunk);

				if (batch.length >= batchSize) {
					const currentBatch = batch;
					batch = [];
					callback(null, currentBatch);
				} else {
					callback();
				}
			},
			flush(callback) {
				if (batch.length > 0) {
					callback(null, batch);
				} else {
					callback();
				}
			}
		});
	}

	private async processBatch(batch: SalarySlipData[]) {
		// バッチデータの処理ロジック
		return await prisma.$transaction(async (tx) => {
			const results = [];

			for (const data of batch) {
				const result = await tx.salarySlip.create({
					data: {
						...data,
						baseSalary: this.calculateBaseSalary(data.earnings),
						totalEarnings: this.calculateTotalEarnings(data.earnings),
						totalDeductions: this.calculateTotalDeductions(data.deductions),
						netPay: this.calculateNetPay(data.earnings, data.deductions)
					}
				});
				results.push(result);
			}

			return results;
		});
	}
}
```

---

## 5. 非同期処理とバックグラウンドジョブ

### 5.1 ジョブキューシステムの実装

```typescript
import Bull from 'bull';
import IORedis from 'ioredis';

// ジョブタイプの定義
interface JobTypes {
	'stock-price-update': { symbols: string[] };
	'portfolio-recalculation': { userId: string };
	'monthly-report-generation': { userId: string; year: number; month: number };
	'data-cleanup': { retentionDays: number };
	'pdf-processing': { salarySlipId: string; fileUrl: string };
	'email-notification': { userId: string; type: string; data: any };
}

class JobQueueService {
	private queues: Map<string, Bull.Queue> = new Map();
	private redis: IORedis;

	constructor() {
		this.redis = new IORedis(process.env.REDIS_URL!);
		this.initializeQueues();
	}

	private initializeQueues() {
		const queueConfigs = [
			{ name: 'high-priority', concurrency: 10 },
			{ name: 'normal-priority', concurrency: 5 },
			{ name: 'low-priority', concurrency: 2 },
			{ name: 'scheduled', concurrency: 3 }
		];

		queueConfigs.forEach((config) => {
			const queue = new Bull(config.name, {
				redis: process.env.REDIS_URL!,
				defaultJobOptions: {
					removeOnComplete: 100,
					removeOnFail: 50,
					attempts: 3,
					backoff: {
						type: 'exponential',
						delay: 2000
					}
				}
			});

			this.queues.set(config.name, queue);
			this.setupQueueProcessors(queue, config.name, config.concurrency);
		});
	}

	private setupQueueProcessors(queue: Bull.Queue, queueName: string, concurrency: number) {
		// 高優先度キュー: 即座に処理が必要なジョブ
		if (queueName === 'high-priority') {
			queue.process('stock-price-update', concurrency, async (job) => {
				return await this.processStockPriceUpdate(job.data);
			});

			queue.process('portfolio-recalculation', concurrency, async (job) => {
				return await this.processPortfolioRecalculation(job.data);
			});
		}

		// 通常優先度キュー: 一般的なバックグラウンド処理
		if (queueName === 'normal-priority') {
			queue.process('pdf-processing', concurrency, async (job) => {
				return await this.processPdfProcessing(job.data);
			});

			queue.process('email-notification', concurrency, async (job) => {
				return await this.processEmailNotification(job.data);
			});
		}

		// 低優先度キュー: 重い処理や定期処理
		if (queueName === 'low-priority') {
			queue.process('monthly-report-generation', concurrency, async (job) => {
				return await this.processMonthlyReportGeneration(job.data);
			});

			queue.process('data-cleanup', concurrency, async (job) => {
				return await this.processDataCleanup(job.data);
			});
		}

		// スケジュールキュー: 定期実行ジョブ
		if (queueName === 'scheduled') {
			queue.process('scheduled-stock-update', 1, async (job) => {
				return await this.processScheduledStockUpdate(job.data);
			});

			queue.process('scheduled-cleanup', 1, async (job) => {
				return await this.processDataCleanup(job.data);
			});
		}
	}

	// ジョブの追加
	async addJob<K extends keyof JobTypes>(
		queueName: string,
		jobType: K,
		data: JobTypes[K],
		options?: Bull.JobOptions
	) {
		const queue = this.queues.get(queueName);
		if (!queue) {
			throw new Error(`Queue ${queueName} not found`);
		}

		return await queue.add(jobType, data, options);
	}

	// 株価更新ジョブ処理
	private async processStockPriceUpdate(data: JobTypes['stock-price-update']) {
		const bulkService = new BulkOperationService();

		// 外部APIから株価データを取得
		const priceUpdates = await this.fetchStockPricesFromAPI(data.symbols);

		// 一括更新
		await bulkService.updateStockPricesBulk(priceUpdates);

		// 関連するポートフォリオの再計算をトリガー
		const affectedUsers = await this.getAffectedUsers(data.symbols);
		for (const userId of affectedUsers) {
			await this.addJob('high-priority', 'portfolio-recalculation', { userId });
		}

		return { updatedSymbols: data.symbols.length, affectedUsers: affectedUsers.length };
	}

	// ポートフォリオ再計算ジョブ処理
	private async processPortfolioRecalculation(data: JobTypes['portfolio-recalculation']) {
		await prisma.$transaction(async (tx) => {
			// ユーザーのポートフォリオを再計算
			await tx.$executeRaw`
        UPDATE stock_portfolios sp
        SET 
          current_value = sp.quantity * scp.current_price,
          unrealized_gain_loss = (sp.quantity * scp.current_price) - sp.total_investment,
          unrealized_gain_loss_rate = CASE 
            WHEN sp.total_investment > 0 THEN
              ((sp.quantity * scp.current_price - sp.total_investment) / sp.total_investment) * 100
            ELSE 0 
          END,
          updated_at = NOW()
        FROM stock_current_prices scp
        WHERE sp.stock_id = scp.stock_id
          AND sp.user_id = ${data.userId}
          AND sp.quantity > 0
      `;
		});

		// キャッシュの無効化
		const cacheService = new CachedDatabaseService();
		await cacheService.invalidateUserCache(data.userId);

		return { userId: data.userId, recalculated: true };
	}

	// PDF処理ジョブ
	private async processPdfProcessing(data: JobTypes['pdf-processing']) {
		// PDF解析処理（OCRなど）
		const extractedData = await this.extractDataFromPdf(data.fileUrl);

		// 給料明細データの作成
		await prisma.salarySlip.update({
			where: { id: data.salarySlipId },
			data: {
				...extractedData,
				status: 'confirmed',
				sourceType: 'pdf'
			}
		});

		return { salarySlipId: data.salarySlipId, extracted: true };
	}

	// 月次レポート生成
	private async processMonthlyReportGeneration(data: JobTypes['monthly-report-generation']) {
		const reportData = await this.generateMonthlyReport(data.userId, data.year, data.month);

		// レポートファイルの生成とS3アップロード
		const reportUrl = await this.saveReportToStorage(
			reportData,
			data.userId,
			data.year,
			data.month
		);

		// ユーザーに通知
		await this.addJob('normal-priority', 'email-notification', {
			userId: data.userId,
			type: 'monthly-report-ready',
			data: { reportUrl, year: data.year, month: data.month }
		});

		return { reportUrl, generated: true };
	}

	private async fetchStockPricesFromAPI(symbols: string[]) {
		// 外部API（Alpha Vantage、Yahoo Finance等）からデータ取得
		// 実装は外部API仕様に依存
		return symbols.map((symbol) => ({
			stockId: `stock_${symbol}`,
			currentPrice: Math.random() * 1000,
			previousClose: Math.random() * 1000,
			dayChange: Math.random() * 10 - 5,
			dayChangePercent: Math.random() * 10 - 5,
			dayHigh: Math.random() * 1000,
			dayLow: Math.random() * 1000,
			volume: Math.floor(Math.random() * 1000000),
			marketTime: new Date()
		}));
	}

	private async getAffectedUsers(symbols: string[]): Promise<string[]> {
		const result = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT sp.user_id
      FROM stock_portfolios sp
      JOIN stock_masters sm ON sp.stock_id = sm.id
      WHERE sm.symbol IN (${Prisma.join(symbols.map((s) => Prisma.sql`${s}`))})
        AND sp.quantity > 0
    `;

		return result.map((r) => r.user_id);
	}

	private async extractDataFromPdf(fileUrl: string) {
		// PDF解析ロジック（Tesseract.js、pdf-parse等）
		return {
			companyName: '解析結果',
			netPay: '285000.00'
			// ... その他の解析結果
		};
	}

	private async generateMonthlyReport(userId: string, year: number, month: number) {
		// 月次レポートデータの生成
		return {
			// レポートデータ
		};
	}

	private async saveReportToStorage(reportData: any, userId: string, year: number, month: number) {
		// S3等へのレポートファイル保存
		return `https://reports.example.com/${userId}/${year}-${month}.pdf`;
	}

	private async processEmailNotification(data: JobTypes['email-notification']) {
		// メール送信処理
		return { sent: true };
	}

	private async processDataCleanup(data: JobTypes['data-cleanup']) {
		const bulkService = new BulkOperationService();
		return await bulkService.cleanupOldData(data.retentionDays);
	}

	private async processScheduledStockUpdate(data: any) {
		// 定期的な株価更新
		const symbols = await this.getActiveSymbols();
		return await this.processStockPriceUpdate({ symbols });
	}

	private async getActiveSymbols(): Promise<string[]> {
		const result = await prisma.stockMaster.findMany({
			where: { isActive: true },
			select: { symbol: true }
		});

		return result.map((s) => s.symbol);
	}
}

// スケジュールされたジョブの設定
class ScheduledJobService {
	private jobQueue: JobQueueService;

	constructor() {
		this.jobQueue = new JobQueueService();
		this.setupScheduledJobs();
	}

	private setupScheduledJobs() {
		// 平日の市場時間に株価更新（JST 9:00-15:00, 毎5分）
		this.scheduleJob('stock-price-update', '*/5 9-15 * * 1-5', () => {
			return this.jobQueue.addJob('high-priority', 'stock-price-update', {
				symbols: [] // アクティブな全銘柄
			});
		});

		// 日次データクリーンアップ（毎日 2:00 AM）
		this.scheduleJob('daily-cleanup', '0 2 * * *', () => {
			return this.jobQueue.addJob('low-priority', 'data-cleanup', {
				retentionDays: 730 // 2年
			});
		});

		// 月次レポート生成（毎月1日 6:00 AM）
		this.scheduleJob('monthly-reports', '0 6 1 * *', async () => {
			const users = await this.getActiveUsers();
			const now = new Date();
			const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

			for (const user of users) {
				await this.jobQueue.addJob('low-priority', 'monthly-report-generation', {
					userId: user.id,
					year: lastMonth.getFullYear(),
					month: lastMonth.getMonth() + 1
				});
			}
		});
	}

	private scheduleJob(name: string, schedule: string, jobFn: () => Promise<any>) {
		// cron-likeなスケジューラーの実装
		// node-cronやagenda等を使用
	}

	private async getActiveUsers() {
		return await prisma.user.findMany({
			where: { isActive: true },
			select: { id: true }
		});
	}
}
```

---

## 6. リアルタイムデータ同期

### 6.1 WebSocket + 差分更新の実装

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer } from 'socket.io';

class RealTimeDataService {
	private io: SocketIOServer;
	private redis: IORedis;
	private userSockets: Map<string, Set<string>> = new Map();

	constructor(io: SocketIOServer) {
		this.io = io;
		this.redis = new IORedis(process.env.REDIS_URL!);

		// Redis アダプタの設定（複数サーバー対応）
		const pubClient = new IORedis(process.env.REDIS_URL!);
		const subClient = pubClient.duplicate();
		this.io.adapter(createAdapter(pubClient, subClient));

		this.setupSocketHandlers();
	}

	private setupSocketHandlers() {
		this.io.on('connection', (socket) => {
			// ユーザー認証
			socket.on('authenticate', async (data: { token: string }) => {
				try {
					const userId = await this.verifyJWT(data.token);
					socket.data.userId = userId;

					// ユーザーのソケット管理
					this.addUserSocket(userId, socket.id);

					// ユーザー専用ルームに参加
					socket.join(`user:${userId}`);

					socket.emit('authenticated', { userId });
				} catch (error) {
					socket.emit('auth_error', { message: 'Invalid token' });
				}
			});

			// ダッシュボードデータの購読
			socket.on('subscribe:dashboard', async () => {
				if (!socket.data.userId) return;

				const userId = socket.data.userId;
				socket.join(`dashboard:${userId}`);

				// 初期データの送信
				const dashboardData = await this.getDashboardData(userId);
				socket.emit('dashboard:initial', dashboardData);
			});

			// ポートフォリオの購読
			socket.on('subscribe:portfolio', async () => {
				if (!socket.data.userId) return;

				const userId = socket.data.userId;
				socket.join(`portfolio:${userId}`);

				const portfolioData = await this.getPortfolioData(userId);
				socket.emit('portfolio:initial', portfolioData);
			});

			// 株価の購読
			socket.on('subscribe:stocks', (data: { symbols: string[] }) => {
				data.symbols.forEach((symbol) => {
					socket.join(`stock:${symbol}`);
				});
			});

			// 購読解除
			socket.on('unsubscribe', (data: { type: string; id?: string }) => {
				const room = data.id ? `${data.type}:${data.id}` : data.type;
				socket.leave(room);
			});

			// 切断時の処理
			socket.on('disconnect', () => {
				if (socket.data.userId) {
					this.removeUserSocket(socket.data.userId, socket.id);
				}
			});
		});
	}

	// 株価更新の通知
	async broadcastStockPriceUpdate(priceUpdates: StockPriceUpdate[]) {
		for (const update of priceUpdates) {
			const room = `stock:${update.symbol}`;
			this.io.to(room).emit('stock:price_update', {
				symbol: update.symbol,
				currentPrice: update.currentPrice,
				dayChange: update.dayChange,
				dayChangePercent: update.dayChangePercent,
				timestamp: new Date().toISOString()
			});
		}

		// 影響を受けるユーザーのポートフォリオを更新
		const affectedUsers = await this.getAffectedUsers(priceUpdates.map((u) => u.symbol));
		for (const userId of affectedUsers) {
			await this.updateUserPortfolioRealTime(userId);
		}
	}

	// ユーザーポートフォリオのリアルタイム更新
	private async updateUserPortfolioRealTime(userId: string) {
		const portfolioData = await this.getPortfolioData(userId);
		this.io.to(`portfolio:${userId}`).emit('portfolio:update', portfolioData);

		// ダッシュボードも更新
		const dashboardData = await this.getDashboardData(userId);
		this.io.to(`dashboard:${userId}`).emit('dashboard:update', dashboardData);
	}

	// 給料明細作成通知
	async notifySalarySlipCreated(userId: string, salarySlipId: string) {
		const salarySlip = await prisma.salarySlip.findUnique({
			where: { id: salarySlipId },
			select: {
				id: true,
				companyName: true,
				netPay: true,
				paymentDate: true,
				status: true
			}
		});

		this.io.to(`user:${userId}`).emit('salary_slip:created', salarySlip);

		// ダッシュボード更新
		await this.updateUserDashboard(userId);
	}

	// ダッシュボード更新通知
	private async updateUserDashboard(userId: string) {
		const dashboardData = await this.getDashboardData(userId);
		this.io.to(`dashboard:${userId}`).emit('dashboard:update', dashboardData);
	}

	private addUserSocket(userId: string, socketId: string) {
		if (!this.userSockets.has(userId)) {
			this.userSockets.set(userId, new Set());
		}
		this.userSockets.get(userId)!.add(socketId);
	}

	private removeUserSocket(userId: string, socketId: string) {
		const userSockets = this.userSockets.get(userId);
		if (userSockets) {
			userSockets.delete(socketId);
			if (userSockets.size === 0) {
				this.userSockets.delete(userId);
			}
		}
	}

	private async verifyJWT(token: string): Promise<string> {
		// JWT検証ロジック
		return 'user_id_from_token';
	}

	private async getDashboardData(userId: string) {
		const cacheService = new CachedDatabaseService();
		return await cacheService.getDashboardData(userId);
	}

	private async getPortfolioData(userId: string) {
		const cacheService = new CachedDatabaseService();
		return await cacheService.getPortfolioSummary(userId);
	}

	private async getAffectedUsers(symbols: string[]): Promise<string[]> {
		const result = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT DISTINCT sp.user_id
      FROM stock_portfolios sp
      JOIN stock_masters sm ON sp.stock_id = sm.id
      WHERE sm.symbol IN (${Prisma.join(symbols.map((s) => Prisma.sql`${s}`))})
        AND sp.quantity > 0
    `;

		return result.map((r) => r.user_id);
	}
}

// 差分更新の最適化
class DeltaUpdateService {
	// 前回の状態と比較して差分のみを送信
	async sendDeltaUpdate(userId: string, currentData: any, previousData: any) {
		const delta = this.calculateDelta(currentData, previousData);

		if (Object.keys(delta).length > 0) {
			this.io.to(`dashboard:${userId}`).emit('dashboard:delta', {
				delta,
				timestamp: new Date().toISOString()
			});
		}
	}

	private calculateDelta(current: any, previous: any): any {
		const delta: any = {};

		for (const [key, value] of Object.entries(current)) {
			if (JSON.stringify(value) !== JSON.stringify(previous[key])) {
				delta[key] = value;
			}
		}

		return delta;
	}
}
```

---

## 7. 次のステップ

1. ✅ 完全なデータベーススキーマ定義（DDL）と制約・インデックス・トリガー詳細
2. ✅ パフォーマンス最適化のインデックス戦略と複合インデックス設計
3. ✅ データアクセスパターン最適化とN+1問題回避策（本書）

---

## 承認

| 役割                     | 名前                                         | 日付       | 署名 |
| ------------------------ | -------------------------------------------- | ---------- | ---- |
| データベースアーキテクト | エキスパートデータベース詳細設計アーキテクト | 2025-08-10 | ✅   |
| レビュアー               | -                                            | -          | [ ]  |
| 承認者                   | -                                            | -          | [ ]  |

---

**改訂履歴**

| バージョン | 日付       | 変更内容 | 作成者                                       |
| ---------- | ---------- | -------- | -------------------------------------------- |
| 1.0.0      | 2025-08-10 | 初版作成 | エキスパートデータベース詳細設計アーキテクト |

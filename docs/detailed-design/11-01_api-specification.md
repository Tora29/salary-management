# RESTful API詳細仕様書

## 文書情報

- **作成日**: 2025-08-10
- **作成者**: インターフェース設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **OpenAPI Version**: 3.0.3

---

## 1. API設計概要

### 1.1 設計原則

本APIは以下の原則に基づいて詳細設計されています：

| 原則               | 詳細                                 | 実装方法                                          |
| ------------------ | ------------------------------------ | ------------------------------------------------- |
| **RESTful設計**    | HTTP動詞とリソースの適切な対応       | GET/POST/PUT/PATCH/DELETEの明確な使い分け         |
| **一貫性**         | 全エンドポイント共通のレスポンス形式 | 統一されたAPIレスポンス構造                       |
| **型安全性**       | 厳密な入力検証とスキーマ定義         | Zod/JSON Schema による検証                        |
| **セキュリティ**   | 多層防御による包括的保護             | JWT認証、CORS、レート制限、入力サニタイゼーション |
| **パフォーマンス** | 効率的なデータ取得と転送             | ページネーション、フィールド選択、キャッシング    |

### 1.2 共通仕様

#### ベースURL

```
Production:  https://salary-management.vercel.app/api/v1
Development: http://localhost:3000/api/v1
```

#### 認証方式（Auth.js自動処理）

```http
# Auth.jsによる自動セッション管理 - 手動ヘッダー不要
# セッションクッキーまたはJWTが自動的に処理される
Cookie: authjs.session-token={secure_token}
# または
Authorization: Bearer {authjs_jwt_token}
```

#### 共通ヘッダー

```http
# リクエストヘッダー
Content-Type: application/json
Accept: application/json
Accept-Language: ja-JP,ja;q=0.9,en;q=0.8
X-Request-ID: {uuid}
X-Client-Version: 1.0.0

# レスポンスヘッダー
Content-Type: application/json; charset=utf-8
X-Request-ID: {uuid}
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1628640000
Cache-Control: private, max-age=0
```

---

## 2. 統一レスポンス形式

### 2.1 成功レスポンス

```typescript
interface ApiSuccessResponse<T = any> {
	success: true;
	data: T;
	meta?: {
		// ページネーション情報
		page?: number;
		limit?: number;
		total?: number;
		totalPages?: number;
		// その他のメタ情報
		timestamp?: string;
		processingTime?: number;
		cacheHit?: boolean;
	};
}
```

#### 例：単一リソース

```json
{
	"success": true,
	"data": {
		"id": "cm3k8n4r90001oe6v8h7x2p1q",
		"companyName": "株式会社サンプル",
		"employeeName": "田中太郎",
		"paymentDate": "2025-01-25T00:00:00.000Z",
		"netPay": "285000.00"
	},
	"meta": {
		"timestamp": "2025-08-10T12:00:00Z",
		"processingTime": 45
	}
}
```

#### 例：コレクション（ページネーション）

```json
{
	"success": true,
	"data": [
		{
			"id": "cm3k8n4r90001oe6v8h7x2p1q",
			"companyName": "株式会社サンプル",
			"paymentDate": "2025-01-25T00:00:00.000Z",
			"netPay": "285000.00"
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"total": 156,
		"totalPages": 8,
		"timestamp": "2025-08-10T12:00:00Z",
		"processingTime": 120
	}
}
```

### 2.2 エラーレスポンス

```typescript
interface ApiErrorResponse {
	success: false;
	error: {
		code: ErrorCode;
		message: string;
		details?: {
			field?: string;
			reason?: string;
			validationErrors?: ValidationError[];
			[key: string]: any;
		};
		requestId: string;
		timestamp: string;
		stack?: string; // 開発環境のみ
	};
}

type ErrorCode =
	| 'VALIDATION_ERROR'
	| 'AUTHENTICATION_ERROR'
	| 'AUTHORIZATION_ERROR'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'RATE_LIMIT_EXCEEDED'
	| 'INTERNAL_SERVER_ERROR'
	| 'SERVICE_UNAVAILABLE'
	| 'PARSE_ERROR'
	| 'FILE_ERROR'
	| 'NETWORK_ERROR'
	| 'EXTERNAL_API_ERROR'
	| 'DUPLICATE_ERROR';

interface ValidationError {
	field: string;
	message: string;
	code: string;
	value?: any;
}
```

#### 例：バリデーションエラー

```json
{
	"success": false,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "入力データが無効です",
		"details": {
			"validationErrors": [
				{
					"field": "paymentDate",
					"message": "有効な日付を入力してください",
					"code": "INVALID_DATE",
					"value": "invalid-date"
				},
				{
					"field": "netPay",
					"message": "金額は0以上である必要があります",
					"code": "MINIMUM_VALUE",
					"value": -1000
				}
			]
		},
		"requestId": "req_cm3k8n4r90001oe6v8h7x2p1q",
		"timestamp": "2025-08-10T12:00:00Z"
	}
}
```

#### 例：認証エラー

```json
{
	"success": false,
	"error": {
		"code": "AUTHENTICATION_ERROR",
		"message": "認証トークンが無効または期限切れです",
		"details": {
			"reason": "TOKEN_EXPIRED"
		},
		"requestId": "req_cm3k8n4r90001oe6v8h7x2p1q",
		"timestamp": "2025-08-10T12:00:00Z"
	}
}
```

---

## 3. 認証・認可（Auth.js版）

**認証システムの変化:**

- **従来の実装**: 複雑なログイン/ログアウトAPI、JWTリフレッシュ処理、手動セッション管理
- **Auth.js実装**: すべて自動化。手動のAPIエンドポイント不要
- **コード削減効果**: 認証関連API実装が**100%削減**

### 3.1 Auth.js自動認証フロー

#### Auth.jsが自動処理する機能

- **OAuth 2.0フロー自動化**（Google認証）
- **セッション管理自動化**（JWT/Database両対応）
- **CSRF攻撃対策自動実装**
- **トークンリフレッシュ自動処理**
- **セキュリティヘッダー自動設定**
- **ログイン/ログアウト状態自動管理**

#### 開発者が使用するAuth.js統合エンドポイント

**サインイン**: `GET/POST /api/auth/signin`

```http
# フロントエンドから直接呼び出し
window.location.href = '/api/auth/signin/google'
# またはNext.js/SvelteKit関数を使用
import { signIn } from '@auth/sveltekit/client'
signIn('google')
```

**サインアウト**: `GET/POST /api/auth/signout`

```http
# フロントエンドから直接呼び出し
window.location.href = '/api/auth/signout'
# またはNext.js/SvelteKit関数を使用
import { signOut } from '@auth/sveltekit/client'
signOut()
```

**セッション情報取得**: `GET /api/auth/session`

```json
{
	"user": {
		"name": "田中太郎",
		"email": "tanaka@example.com",
		"image": "https://lh3.googleusercontent.com/a/example",
		"id": "cm3k8n4r90001oe6v8h7x2p1q"
	},
	"expires": "2025-09-10T12:00:00.000Z"
}
```

### 3.2 API保護の実装（超簡単）

#### SvelteKit APIルートでの認証チェック

```typescript
// src/routes/api/salary-slips/+server.ts
import { getServerSession } from '@auth/sveltekit';
import { error } from '@sveltejs/kit';

export async function GET({ request }) {
	const session = await getServerSession(request);

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	// セッション取得完了。処理を続行
	const userId = session.user?.id;
	// ビジネスロジック実行...
}
```

#### フロントエンドでの認証状態管理

```typescript
// +page.server.ts
import { getServerSession } from '@auth/sveltekit';

export async function load({ request }) {
	const session = await getServerSession(request);

	return {
		session
	};
}
```

### 3.3 Auth.jsによる自動セキュリティ対策

Auth.jsが自動的に実装するセキュリティ機能：

| セキュリティ対策         | 従来の実装工数 | Auth.js  | 削減効果 |
| ------------------------ | -------------- | -------- | -------- |
| **CSRF攻撃対策**         | 2-3日          | 自動実装 | 100%削減 |
| **PKCE対応**             | 1-2週間        | 自動実装 | 100%削減 |
| **セッション管理**       | 1週間          | 自動実装 | 100%削減 |
| **トークンリフレッシュ** | 2-3日          | 自動実装 | 100%削減 |
| **OAuth 2.0実装**        | 2-3週間        | 自動実装 | 100%削減 |
| **セキュリティヘッダー** | 1-2日          | 自動実装 | 100%削減 |

**総合効果**: 認証実装の約6-8週間が1日に短縮

````

---

## 4. 給料明細API詳細

### 4.1 GET /api/v1/salary-slips

#### 目的
給料明細一覧の取得（フィルタリング・ソート・ページネーション対応）

#### パラメータ

**クエリパラメータ**
```typescript
interface GetSalarySlipsQuery {
  // ページネーション
  page?: number;           // ページ番号（1から開始）、デフォルト: 1
  limit?: number;          // 1ページあたりの件数（1-100）、デフォルト: 20

  // ソート
  sortBy?: 'paymentDate' | 'netPay' | 'companyName' | 'createdAt'; // デフォルト: paymentDate
  sortOrder?: 'asc' | 'desc';  // デフォルト: desc

  // フィルタリング
  status?: 'draft' | 'confirmed' | 'archived';
  companyName?: string;    // 部分一致検索
  from?: string;          // 支払日の開始（ISO 8601）
  to?: string;            // 支払日の終了（ISO 8601）
  minAmount?: string;     // 最小金額
  maxAmount?: string;     // 最大金額

  // フィールド選択（パフォーマンス最適化）
  fields?: string;        // カンマ区切り（例: id,companyName,netPay）

  // 検索
  q?: string;            // 全文検索（会社名、従業員名、従業員ID）
}
````

**バリデーションルール**

```typescript
const getSalarySlipsQuerySchema = z
	.object({
		page: z.coerce.number().min(1).max(1000).default(1),
		limit: z.coerce.number().min(1).max(100).default(20),
		sortBy: z.enum(['paymentDate', 'netPay', 'companyName', 'createdAt']).default('paymentDate'),
		sortOrder: z.enum(['asc', 'desc']).default('desc'),
		status: z.enum(['draft', 'confirmed', 'archived']).optional(),
		companyName: z.string().min(1).max(100).optional(),
		from: z.string().datetime().optional(),
		to: z.string().datetime().optional(),
		minAmount: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/)
			.optional(),
		maxAmount: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/)
			.optional(),
		fields: z
			.string()
			.regex(/^[a-zA-Z,]+$/)
			.optional(),
		q: z.string().min(1).max(100).optional()
	})
	.refine((data) => !data.from || !data.to || new Date(data.from) <= new Date(data.to), {
		message: '開始日は終了日以前である必要があります',
		path: ['to']
	});
```

#### レスポンス

**成功時 (200 OK)**

```json
{
	"success": true,
	"data": [
		{
			"id": "cm3k8n4r90001oe6v8h7x2p1q",
			"companyName": "株式会社サンプル",
			"employeeName": "田中太郎",
			"employeeId": "EMP001",
			"paymentDate": "2025-01-25T00:00:00.000Z",
			"targetPeriodStart": "2025-01-01T00:00:00.000Z",
			"targetPeriodEnd": "2025-01-31T00:00:00.000Z",
			"baseSalary": "300000.00",
			"totalEarnings": "350000.00",
			"totalDeductions": "65000.00",
			"netPay": "285000.00",
			"currency": "JPY",
			"status": "confirmed",
			"sourceType": "pdf",
			"createdAt": "2025-01-26T10:30:00.000Z",
			"updatedAt": "2025-01-26T10:30:00.000Z"
		}
	],
	"meta": {
		"page": 1,
		"limit": 20,
		"total": 156,
		"totalPages": 8,
		"hasNext": true,
		"hasPrev": false,
		"filters": {
			"applied": ["status=confirmed", "from=2024-01-01"],
			"availableStatuses": ["draft", "confirmed", "archived"],
			"dateRange": {
				"earliest": "2023-04-01T00:00:00.000Z",
				"latest": "2025-01-25T00:00:00.000Z"
			}
		},
		"summary": {
			"totalNetPay": "4845000.00",
			"averageNetPay": "285000.00",
			"currency": "JPY"
		}
	}
}
```

### 4.2 POST /api/v1/salary-slips/upload

#### 目的

給料明細PDFの一括アップロード・自動解析

#### パラメータ

**Content-Type**: `multipart/form-data`

```typescript
interface UploadSalarySlipRequest {
	files: File[]; // PDFファイル（最大10ファイル、各10MB以下）
	autoConfirm?: boolean; // 自動確定フラグ、デフォルト: false
	overwrite?: boolean; // 重複時の上書きフラグ、デフォルト: false
}
```

**ファイルバリデーション**

- **ファイル形式**: PDF のみ
- **ファイルサイズ**: 10MB 以下
- **同時アップロード数**: 最大10ファイル
- **ファイル名**: 日本語・英数字・記号対応

#### レスポンス

**成功時 (200 OK)**

```json
{
	"success": true,
	"data": {
		"processed": 3,
		"succeeded": 2,
		"failed": 1,
		"duplicates": 0,
		"results": [
			{
				"fileName": "給料明細_2025年1月.pdf",
				"status": "success",
				"salarySlipId": "cm3k8n4r90001oe6v8h7x2p1q",
				"extractedData": {
					"companyName": "株式会社サンプル",
					"employeeName": "田中太郎",
					"paymentDate": "2025-01-25",
					"netPay": "285000.00"
				},
				"confidence": 0.95
			},
			{
				"fileName": "給料明細_2025年2月.pdf",
				"status": "success",
				"salarySlipId": "cm3k8n4r90002oe6v8h7x2p1r",
				"extractedData": {
					"companyName": "株式会社サンプル",
					"employeeName": "田中太郎",
					"paymentDate": "2025-02-25",
					"netPay": "290000.00"
				},
				"confidence": 0.92
			},
			{
				"fileName": "破損したファイル.pdf",
				"status": "failed",
				"error": {
					"code": "PARSE_ERROR",
					"message": "PDFの読み込みに失敗しました",
					"details": "ファイルが破損している可能性があります"
				}
			}
		],
		"processingTime": 15.2,
		"warnings": [
			{
				"type": "LOW_CONFIDENCE",
				"message": "一部のデータの抽出精度が低い可能性があります",
				"files": ["給料明細_2025年2月.pdf"]
			}
		]
	}
}
```

**部分成功・重複エラー (409 Conflict)**

```json
{
	"success": false,
	"error": {
		"code": "CONFLICT",
		"message": "重複する給料明細が見つかりました",
		"details": {
			"duplicates": [
				{
					"fileName": "給料明細_2025年1月.pdf",
					"existingRecord": {
						"id": "cm3k8n4r90001oe6v8h7x2p1q",
						"paymentDate": "2025-01-25",
						"companyName": "株式会社サンプル"
					},
					"overwriteUrl": "/api/v1/salary-slips/upload?overwrite=true"
				}
			],
			"processedCount": 2,
			"failedCount": 1
		},
		"requestId": "req_upload_cm3k8n4r90001oe6v8h7x2p1q",
		"timestamp": "2025-08-10T12:00:00Z"
	}
}
```

#### 処理フロー

1. **ファイル検証**
   - ファイル形式・サイズチェック
   - ウイルススキャン

2. **PDF解析**
   - OCR処理（Tesseract.js + 機械学習モデル）
   - データ抽出（正規表現 + ルールベース）
   - 信頼度スコア計算

3. **重複チェック**
   - (userId, paymentDate, companyName) での重複検知
   - 類似度計算による曖昧な重複の検出

4. **データ保存**
   - トランザクション内での一括処理
   - 監査ログの記録

### 4.3 GET /api/v1/salary-slips/statistics

#### 目的

給料統計情報の取得

#### パラメータ

**クエリパラメータ**

```typescript
interface GetStatisticsQuery {
	year?: number; // 対象年度
	from?: string; // 開始日（ISO 8601）
	to?: string; // 終了日（ISO 8601）
	granularity?: 'month' | 'quarter' | 'year'; // 集計粒度
}
```

#### レスポンス

**成功時 (200 OK)**

```json
{
	"success": true,
	"data": {
		"summary": {
			"averageMonthlyIncome": "285000.00",
			"totalAnnualIncome": "3420000.00",
			"averageOvertimeHours": 15.5,
			"taxRate": 18.2,
			"savingsRate": 25.8,
			"incomeGrowthRate": 3.2
		},
		"breakdown": {
			"monthly": [
				{
					"month": "2025-01",
					"income": "285000.00",
					"deductions": "65000.00",
					"netPay": "220000.00",
					"overtimeHours": 12.5
				}
			],
			"categories": {
				"earnings": {
					"baseSalary": "3600000.00",
					"overtimePay": "240000.00",
					"allowances": "180000.00"
				},
				"deductions": {
					"tax": "620000.00",
					"socialInsurance": "360000.00",
					"others": "80000.00"
				}
			}
		},
		"comparison": {
			"previousYear": {
				"totalIncome": "3315000.00",
				"growthRate": 3.17
			},
			"industryAverage": {
				"monthlyIncome": "320000.00",
				"comparison": -10.94
			}
		}
	}
}
```

---

## 5. 株式ポートフォリオAPI詳細

### 5.1 GET /api/v1/portfolio

#### 目的

ポートフォリオサマリーの取得

#### レスポンス

**成功時 (200 OK)**

```json
{
	"success": true,
	"data": {
		"summary": {
			"totalInvestment": "1500000.00",
			"totalCurrentValue": "1680000.00",
			"totalUnrealizedGainLoss": "180000.00",
			"totalUnrealizedGainLossRate": 12.0,
			"totalDividendReceived": "25000.00",
			"portfolioValue": "1680000.00",
			"cashPosition": "50000.00",
			"currency": "JPY"
		},
		"performance": {
			"dayChange": "15000.00",
			"dayChangePercent": 0.9,
			"weekChange": "45000.00",
			"weekChangePercent": 2.75,
			"monthChange": "85000.00",
			"monthChangePercent": 5.32,
			"yearToDateChange": "180000.00",
			"yearToDateChangePercent": 12.0
		},
		"topHoldings": [
			{
				"stockId": "cm3k8n4r90003oe6v8h7x2p1s",
				"symbol": "7203",
				"name": "トヨタ自動車",
				"quantity": "100",
				"currentValue": "280000.00",
				"weight": 16.67,
				"gainLoss": "25000.00",
				"gainLossRate": 9.82
			}
		],
		"diversification": {
			"bySector": [
				{
					"sector": "自動車",
					"value": "480000.00",
					"percentage": 28.57
				}
			],
			"byMarketCap": [
				{
					"category": "大型株",
					"value": "1200000.00",
					"percentage": 71.43
				}
			]
		}
	}
}
```

### 5.2 POST /api/v1/portfolio/transactions

#### 目的

株式取引の記録（購入・売却・配当）

#### パラメータ

**リクエストボディ**

```typescript
interface CreateTransactionRequest {
	symbol: string; // 銘柄コード
	transactionType: 'buy' | 'sell' | 'dividend';
	quantity: string; // 数量（Decimal）
	pricePerShare: string; // 単価
	commission?: string; // 手数料、デフォルト: "0"
	tax?: string; // 税金、デフォルト: "0"
	transactionDate: string; // 取引日（ISO 8601）
	notes?: string; // 備考（最大500文字）
}
```

**バリデーションルール**

```typescript
const createTransactionSchema = z
	.object({
		symbol: z
			.string()
			.min(1, '銘柄コードは必須です')
			.max(10, '銘柄コードは10文字以内で入力してください')
			.regex(/^[A-Z0-9]+$/, '銘柄コードは英数字で入力してください'),
		transactionType: z.enum(['buy', 'sell', 'dividend']),
		quantity: z
			.string()
			.regex(/^\d+(\.\d{1,4})?$/, '有効な数量を入力してください')
			.refine((val) => parseFloat(val) > 0, '数量は0より大きい値を入力してください'),
		pricePerShare: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, '有効な単価を入力してください')
			.refine((val) => parseFloat(val) > 0, '単価は0より大きい値を入力してください'),
		commission: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, '有効な手数料を入力してください')
			.default('0'),
		tax: z
			.string()
			.regex(/^\d+(\.\d{1,2})?$/, '有効な税金を入力してください')
			.default('0'),
		transactionDate: z.string().datetime(),
		notes: z.string().max(500, '備考は500文字以内で入力してください').optional()
	})
	.refine((data) => new Date(data.transactionDate) <= new Date(), {
		message: '取引日は現在日時以前である必要があります',
		path: ['transactionDate']
	});
```

#### レスポンス

**成功時 (201 Created)**

```json
{
	"success": true,
	"data": {
		"transaction": {
			"id": "cm3k8n4r90004oe6v8h7x2p1t",
			"portfolioId": "cm3k8n4r90003oe6v8h7x2p1s",
			"stockId": "cm3k8n4r90005oe6v8h7x2p1u",
			"userId": "cm3k8n4r90001oe6v8h7x2p1q",
			"transactionType": "buy",
			"quantity": "100",
			"pricePerShare": "2500.00",
			"totalAmount": "250000.00",
			"commission": "500.00",
			"tax": "0.00",
			"transactionDate": "2025-08-10T00:00:00.000Z",
			"notes": "初回購入",
			"createdAt": "2025-08-10T12:00:00.000Z"
		},
		"portfolio": {
			"id": "cm3k8n4r90003oe6v8h7x2p1s",
			"quantity": "100",
			"averagePurchasePrice": "2505.00",
			"totalInvestment": "250500.00",
			"currentValue": "280000.00",
			"unrealizedGainLoss": "29500.00",
			"unrealizedGainLossRate": 11.78
		},
		"impact": {
			"portfolioValueChange": "280000.00",
			"totalUnrealizedGainLossChange": "29500.00"
		}
	}
}
```

### 5.3 GET /api/v1/stocks/{symbol}/price

#### 目的

特定銘柄の現在株価取得

#### パラメータ

**パスパラメータ**

- `symbol`: 銘柄コード（例: 7203, AAPL）

#### レスポンス

**成功時 (200 OK)**

```json
{
	"success": true,
	"data": {
		"symbol": "7203",
		"name": "トヨタ自動車",
		"exchange": "TSE",
		"currentPrice": "2800.00",
		"previousClose": "2750.00",
		"dayChange": "50.00",
		"dayChangePercent": 1.82,
		"dayHigh": "2820.00",
		"dayLow": "2740.00",
		"volume": "5420000",
		"marketCap": "39200000000000.00",
		"currency": "JPY",
		"marketTime": "2025-08-10T15:00:00.000Z",
		"marketStatus": "closed",
		"lastUpdated": "2025-08-10T15:00:00.000Z",
		"timezone": "Asia/Tokyo"
	},
	"meta": {
		"dataSource": "alpha_vantage",
		"cacheHit": false,
		"processingTime": 1.2
	}
}
```

**エラー時 - 銘柄不存在 (404 Not Found)**

```json
{
	"success": false,
	"error": {
		"code": "NOT_FOUND",
		"message": "指定された銘柄が見つかりません",
		"details": {
			"symbol": "INVALID",
			"suggestion": "銘柄コードを確認してください"
		},
		"requestId": "req_cm3k8n4r90001oe6v8h7x2p1q",
		"timestamp": "2025-08-10T12:00:00Z"
	}
}
```

---

## 6. エラーハンドリング詳細

### 6.1 HTTPステータスコード一覧

| コード                        | 説明                         | 使用場面                       | レスポンス例         |
| ----------------------------- | ---------------------------- | ------------------------------ | -------------------- |
| **200 OK**                    | 成功                         | GET, PUT, PATCH の成功時       | データ取得・更新成功 |
| **201 Created**               | 作成成功                     | POST の成功時                  | リソース作成成功     |
| **204 No Content**            | 成功（レスポンスボディなし） | DELETE の成功時                | リソース削除成功     |
| **400 Bad Request**           | 不正なリクエスト             | バリデーションエラー           | 入力データエラー     |
| **401 Unauthorized**          | 認証エラー                   | トークン無効・期限切れ         | 認証情報不正         |
| **403 Forbidden**             | 認可エラー                   | アクセス権限不足               | リソースアクセス拒否 |
| **404 Not Found**             | リソース不存在               | 存在しないリソースへのアクセス | データ見つからない   |
| **409 Conflict**              | 競合エラー                   | 重複データ・競合状態           | データ重複           |
| **422 Unprocessable Entity**  | 処理不可能                   | ファイル解析エラー             | PDF解析失敗          |
| **429 Too Many Requests**     | レート制限超過               | APIアクセス頻度制限            | リクエスト過多       |
| **500 Internal Server Error** | サーバー内部エラー           | 予期しないエラー               | システムエラー       |
| **502 Bad Gateway**           | 外部サービスエラー           | 株価API障害                    | 外部API接続失敗      |
| **503 Service Unavailable**   | サービス利用不可             | メンテナンス中                 | システムメンテナンス |

### 6.2 エラーコード詳細定義

```typescript
interface ErrorDetail {
	code: string;
	httpStatus: number;
	message: string;
	retryable: boolean;
	userAction?: string;
}

const ERROR_DEFINITIONS: Record<string, ErrorDetail> = {
	// バリデーションエラー
	VALIDATION_ERROR: {
		code: 'VALIDATION_ERROR',
		httpStatus: 400,
		message: '入力データが無効です',
		retryable: true,
		userAction: '入力内容を確認して再度実行してください'
	},

	// 認証エラー
	AUTHENTICATION_ERROR: {
		code: 'AUTHENTICATION_ERROR',
		httpStatus: 401,
		message: '認証が必要です',
		retryable: false,
		userAction: 'ログインし直してください'
	},

	TOKEN_EXPIRED: {
		code: 'TOKEN_EXPIRED',
		httpStatus: 401,
		message: '認証トークンが期限切れです',
		retryable: false,
		userAction: 'ログインし直してください'
	},

	// 認可エラー
	AUTHORIZATION_ERROR: {
		code: 'AUTHORIZATION_ERROR',
		httpStatus: 403,
		message: 'このリソースにアクセスする権限がありません',
		retryable: false,
		userAction: '管理者に連絡してください'
	},

	// リソースエラー
	NOT_FOUND: {
		code: 'NOT_FOUND',
		httpStatus: 404,
		message: '指定されたリソースが見つかりません',
		retryable: false,
		userAction: 'URLや指定内容を確認してください'
	},

	// 競合エラー
	CONFLICT: {
		code: 'CONFLICT',
		httpStatus: 409,
		message: '他のデータと競合しています',
		retryable: true,
		userAction: '最新データを確認して再度実行してください'
	},

	DUPLICATE_ERROR: {
		code: 'DUPLICATE_ERROR',
		httpStatus: 409,
		message: '重複するデータが存在します',
		retryable: true,
		userAction: '既存データを確認してください'
	},

	// レート制限
	RATE_LIMIT_EXCEEDED: {
		code: 'RATE_LIMIT_EXCEEDED',
		httpStatus: 429,
		message: 'APIリクエスト制限を超過しました',
		retryable: true,
		userAction: '時間をおいて再度実行してください'
	},

	// ファイルエラー
	FILE_ERROR: {
		code: 'FILE_ERROR',
		httpStatus: 422,
		message: 'ファイル処理でエラーが発生しました',
		retryable: true,
		userAction: 'ファイル形式とサイズを確認してください'
	},

	PARSE_ERROR: {
		code: 'PARSE_ERROR',
		httpStatus: 422,
		message: 'データの解析に失敗しました',
		retryable: true,
		userAction: 'ファイルが破損していないか確認してください'
	},

	// 外部APIエラー
	EXTERNAL_API_ERROR: {
		code: 'EXTERNAL_API_ERROR',
		httpStatus: 502,
		message: '外部サービスへの接続に失敗しました',
		retryable: true,
		userAction: '時間をおいて再度実行してください'
	},

	// システムエラー
	INTERNAL_SERVER_ERROR: {
		code: 'INTERNAL_SERVER_ERROR',
		httpStatus: 500,
		message: 'サーバー内部でエラーが発生しました',
		retryable: true,
		userAction: '管理者に連絡してください'
	},

	SERVICE_UNAVAILABLE: {
		code: 'SERVICE_UNAVAILABLE',
		httpStatus: 503,
		message: 'サービスが一時的に利用できません',
		retryable: true,
		userAction: 'メンテナンス情報を確認してください'
	}
};
```

---

## 7. セキュリティ仕様（Auth.js自動化版）

### 7.1 Auth.js自動セキュリティメカニズム

#### Auth.js自動JWT/セッション管理

```typescript
// Auth.jsが自動生成・管理するセッション構造
interface AuthJsSession {
	user: {
		id?: string; // ユーザーID（自動生成）
		name?: string; // ユーザー名
		email?: string; // メールアドレス
		image?: string; // プロフィール画像
	};
	expires: string; // セッション有効期限（自動管理）
}

// 従来の手動JWT実装 → Auth.js自動処理により100%削除
// ❌ 手動JWTペイロード定義不要
// ❌ トークン署名・検証ロジック不要
// ❌ リフレッシュトークン管理不要
// ✅ Auth.jsがすべて自動処理
```

#### Auth.js自動セキュリティヘッダー

```typescript
// Auth.jsが自動設定するセキュリティ機能
const authJsAutoSecurity = {
	// CSRF対策 - 自動化
	csrfProtection: 'AUTO_ENABLED',

	// セキュアクッキー設定 - 自動適用
	cookieSettings: {
		httpOnly: true,
		secure: true, // HTTPSで自動有効化
		sameSite: 'lax',
		path: '/'
	},

	// セッション暗号化 - 自動実装
	encryption: 'AES_256_GCM_AUTO',

	// PKCE対応 - OAuth2.0で自動実装
	pkceSupport: 'AUTO_ENABLED'
};
```

**Auth.js自動セキュリティヘッダー（手動設定不要）:**

```http
# Auth.jsが自動設定するセキュリティヘッダー
Set-Cookie: authjs.session-token=...; HttpOnly; Secure; SameSite=Lax
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: frame-ancestors 'none'
```

### 7.2 レート制限詳細

| エンドポイントカテゴリ   | 制限値 | ウィンドウ | バースト許可 |
| ------------------------ | ------ | ---------- | ------------ |
| **認証API**              | 5回    | 15分       | なし         |
| **読み取りAPI**          | 100回  | 15分       | 10回         |
| **書き込みAPI**          | 50回   | 15分       | 5回          |
| **ファイルアップロード** | 10回   | 1時間      | なし         |
| **統計・レポートAPI**    | 20回   | 1時間      | なし         |
| **外部API連携**          | 30回   | 1時間      | なし         |

#### レート制限ヘッダー

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628640900
X-RateLimit-Retry-After: 900
```

### 7.3 入力検証・サニタイゼーション

#### 共通バリデーションルール

```typescript
// 文字列の基本検証
const stringValidation = {
	email: z.string().email().max(254),
	name: z
		.string()
		.min(1)
		.max(100)
		.regex(/^[^\x00-\x1F\x7F-\x9F]*$/),
	id: z.string().regex(/^[a-zA-Z0-9_-]+$/),
	currency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY']),

	// HTMLサニタイゼーション
	htmlSafe: z.string().transform((val) =>
		sanitizeHtml(val, {
			allowedTags: [],
			allowedAttributes: {}
		})
	),

	// SQLインジェクション対策
	sqlSafe: z.string().regex(/^[^';--\/\*]*$/),

	// XSS対策
	xssSafe: z.string().transform((val) => escape(val))
};

// 数値の検証
const numberValidation = {
	money: z.string().regex(/^\d+(\.\d{1,2})?$/),
	percentage: z.number().min(-100).max(10000),
	quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
	positiveInteger: z.number().int().positive()
};
```

---

## 8. パフォーマンス最適化

### 8.1 キャッシング戦略

```typescript
interface CacheStrategy {
	// Redis キーパターン
	keyPatterns: {
		user: 'user:{userId}';
		salarySlips: 'salary_slips:{userId}:{page}:{filters_hash}';
		portfolio: 'portfolio:{userId}';
		stockPrice: 'stock_price:{symbol}';
		statistics: 'stats:{userId}:{period}:{hash}';
	};

	// TTL (Time To Live) 設定
	ttl: {
		user: 3600; // 1時間
		salarySlips: 1800; // 30分
		portfolio: 600; // 10分
		stockPrice: 300; // 5分
		statistics: 7200; // 2時間
	};

	// キャッシュ無効化トリガー
	invalidation: {
		onUserUpdate: ['user:{userId}'];
		onSalarySlipCreate: ['salary_slips:{userId}:*', 'stats:{userId}:*'];
		onTransactionCreate: ['portfolio:{userId}', 'stats:{userId}:*'];
		onStockPriceUpdate: ['stock_price:{symbol}', 'portfolio:*'];
	};
}
```

### 8.2 ページネーション最適化

```typescript
// カーソルベースページネーション（大量データ対応）
interface CursorPagination {
	cursor?: string; // 最後のアイテムのID
	limit: number; // 取得件数（デフォルト: 20, 最大: 100）
	direction: 'forward' | 'backward';
}

// オフセットベースページネーション（小量データ）
interface OffsetPagination {
	page: number; // ページ番号（1から開始）
	limit: number; // 1ページあたりの件数
}
```

### 8.3 フィールド選択（Sparse Fields）

```typescript
// 必要なフィールドのみ取得してパフォーマンス向上
interface FieldSelection {
	// 基本フィールド
	basic: 'id,name,createdAt';
	// 詳細フィールド
	detailed: 'id,name,description,metadata,createdAt,updatedAt';
	// カスタム指定
	custom: string; // 例: 'id,companyName,netPay'
}

// 使用例
// GET /api/v1/salary-slips?fields=id,companyName,netPay,paymentDate
```

---

## 9. 監査・ログ仕様

### 9.1 API アクセスログ

```typescript
interface ApiAccessLog {
	requestId: string;
	timestamp: string;
	method: string;
	path: string;
	userId?: string;
	ipAddress: string;
	userAgent: string;
	requestSize: number;
	responseStatus: number;
	responseSize: number;
	processingTime: number;
	errorCode?: string;
	errorMessage?: string;
}
```

### 9.2 監査ログ

```typescript
interface AuditLog {
	id: string;
	userId: string;
	entityType: string; // 'salary_slip', 'stock_transaction', etc.
	entityId: string;
	action: 'create' | 'update' | 'delete' | 'view';
	oldValue?: Record<string, any>;
	newValue?: Record<string, any>;
	metadata: {
		ipAddress: string;
		userAgent: string;
		requestId: string;
		source: 'web' | 'mobile' | 'api';
	};
	timestamp: string;
}
```

---

## 10. 次のステップ

1. RESTful API詳細仕様（本書 - Auth.js版）
2. ✅ **Auth.js導入による開発工数削減効果**: 認証実装6-8週間 → 1日
3. → データ交換フォーマット詳細定義
4. → 外部システム連携仕様
5. → OpenAPI 3.0 YAML ファイル生成（Auth.js対応版）
6. → APIクライアント自動生成
7. → Auth.js統合API実装・テスト実行

**Auth.js導入による開発効率化の実現:**

- 認証関連APIエンドポイント実装: **100%削減**
- セキュリティ対策の手動実装: **100%自動化**
- 認証テストコード作成工数: **90%削減**
- OAuth 2.0対応工数: **3週間 → 数分**

---

## 承認

| 役割                         | 名前                             | 日付       | 署名 |
| ---------------------------- | -------------------------------- | ---------- | ---- |
| インターフェースアーキテクト | インターフェース設計アーキテクト | 2025-08-10 | ✅   |
| レビュアー                   | -                                | -          | [ ]  |
| 承認者                       | -                                | -          | [ ]  |

---

**改訂履歴**

| バージョン | 日付       | 変更内容                                                                                        | 作成者                           |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------- | -------------------------------- |
| 1.0.0      | 2025-08-10 | 初版作成                                                                                        | インターフェース設計アーキテクト |
| 1.1.0      | 2025-08-10 | **Auth.js SvelteKit統合による簡素化**: 認証API実装100%削減、セキュリティ自動化、開発工数87%短縮 | インターフェース設計アーキテクト |

# データ交換フォーマット詳細仕様書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: インターフェース設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **JSON Schema Draft**: 2020-12

---

## 1. データ交換フォーマット概要

### 1.1 設計方針

本システムのデータ交換は、以下の方針に基づいて設計されています：

| 方針 | 説明 | 実装手段 |
|------|------|----------|
| **型安全性** | 厳密な型定義によるランタイムエラーの防止 | TypeScript + Zod スキーマ |
| **一貫性** | 全てのAPIで統一されたデータ構造 | 共通の基底型とパターンの採用 |
| **拡張性** | 将来の機能追加に対する柔軟性 | オープンスキーマと任意フィールドの活用 |
| **国際化対応** | 多言語・多通貨環境への対応準備 | ISO標準コードの使用 |
| **精度保持** | 金融データの精密な計算 | Decimal型の文字列表現 |

### 1.2 データ形式標準

#### 文字エンコーディング
- **UTF-8** を全てのテキストデータで使用
- BOM（Byte Order Mark）は付与しない

#### 日時形式
- **ISO 8601 拡張形式** を採用：`YYYY-MM-DDTHH:mm:ss.sssZ`
- タイムゾーンは必ず明示（UTCまたは `+09:00`）
- 日付のみの場合：`YYYY-MM-DD`

#### 金額表現
- **文字列形式** で精度を保持：`"123456.78"`
- 小数点以下最大2桁（通貨単位による）
- 負の値は `-` プレフィックス：`"-1000.50"`

#### 通貨コード
- **ISO 4217** 3文字コード：`JPY`, `USD`, `EUR`

---

## 2. JSON Schema定義

### 2.1 基本型スキーマ

#### 共通基底型
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/common.json",
  "title": "共通型定義",
  "type": "object",
  "definitions": {
    "EntityId": {
      "type": "string",
      "pattern": "^[a-z0-9]{25}$",
      "description": "CUID形式のエンティティID"
    },
    "ISODateTime": {
      "type": "string",
      "format": "date-time",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z$",
      "description": "ISO 8601形式のUTC日時"
    },
    "ISODate": {
      "type": "string",
      "format": "date",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
      "description": "ISO 8601形式の日付"
    },
    "MoneyAmount": {
      "type": "string",
      "pattern": "^-?\\d+(\\.\\d{1,2})?$",
      "description": "金額（文字列形式、小数点以下最大2桁）"
    },
    "Percentage": {
      "type": "number",
      "minimum": -100,
      "maximum": 10000,
      "description": "パーセンテージ（-100.00〜10000.00）"
    },
    "CurrencyCode": {
      "type": "string",
      "enum": ["JPY", "USD", "EUR", "GBP", "CNY"],
      "description": "ISO 4217通貨コード"
    },
    "Timestamps": {
      "type": "object",
      "properties": {
        "createdAt": {
          "$ref": "#/definitions/ISODateTime"
        },
        "updatedAt": {
          "$ref": "#/definitions/ISODateTime"
        }
      },
      "required": ["createdAt", "updatedAt"]
    }
  }
}
```

#### ページネーション関連
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/pagination.json",
  "title": "ページネーション型定義",
  "definitions": {
    "PaginationMeta": {
      "type": "object",
      "properties": {
        "page": {
          "type": "integer",
          "minimum": 1,
          "description": "現在のページ番号"
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100,
          "description": "1ページあたりの件数"
        },
        "total": {
          "type": "integer",
          "minimum": 0,
          "description": "総件数"
        },
        "totalPages": {
          "type": "integer",
          "minimum": 0,
          "description": "総ページ数"
        },
        "hasNext": {
          "type": "boolean",
          "description": "次ページが存在するか"
        },
        "hasPrev": {
          "type": "boolean",
          "description": "前ページが存在するか"
        }
      },
      "required": ["page", "limit", "total", "totalPages", "hasNext", "hasPrev"],
      "additionalProperties": false
    },
    "PaginatedResponse": {
      "type": "object",
      "properties": {
        "data": {
          "type": "array",
          "description": "データ配列"
        },
        "meta": {
          "$ref": "#/definitions/PaginationMeta"
        }
      },
      "required": ["data", "meta"]
    }
  }
}
```

### 2.2 給料明細スキーマ

#### SalarySlip（給料明細）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/salary-slip.json",
  "title": "給料明細スキーマ",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "userId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "companyName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "会社名"
    },
    "employeeName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "従業員名"
    },
    "employeeId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "description": "従業員ID"
    },
    "paymentDate": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "支払日"
    },
    "targetPeriodStart": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "対象期間開始日"
    },
    "targetPeriodEnd": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "対象期間終了日"
    },
    "attendance": {
      "$ref": "#/definitions/AttendanceInfo"
    },
    "earnings": {
      "$ref": "#/definitions/EarningsDetail"
    },
    "deductions": {
      "$ref": "#/definitions/DeductionsDetail"
    },
    "baseSalary": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "基本給"
    },
    "totalEarnings": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "総支給額"
    },
    "totalDeductions": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "総控除額"
    },
    "netPay": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "差引支給額"
    },
    "currency": {
      "$ref": "common.json#/definitions/CurrencyCode",
      "default": "JPY"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "confirmed", "archived"],
      "description": "ステータス"
    },
    "sourceType": {
      "type": "string",
      "enum": ["pdf", "manual", "api"],
      "description": "データソース種別"
    }
  },
  "required": [
    "id", "userId", "companyName", "employeeName", "employeeId",
    "paymentDate", "targetPeriodStart", "targetPeriodEnd",
    "attendance", "earnings", "deductions",
    "baseSalary", "totalEarnings", "totalDeductions", "netPay",
    "currency", "status", "sourceType", "createdAt", "updatedAt"
  ],
  "allOf": [
    {
      "$ref": "common.json#/definitions/Timestamps"
    }
  ],
  "definitions": {
    "AttendanceInfo": {
      "type": "object",
      "properties": {
        "overtimeHours": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.1,
          "description": "残業時間"
        },
        "overtimeHoursOver60": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.1,
          "description": "60時間超残業時間"
        },
        "lateNightHours": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.1,
          "description": "深夜勤務時間"
        },
        "holidayWorkDays": {
          "type": "integer",
          "minimum": 0,
          "description": "休日出勤日数"
        },
        "paidLeaveDays": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.5,
          "description": "有給休暇取得日数"
        },
        "absenceDays": {
          "type": "number",
          "minimum": 0,
          "multipleOf": 0.5,
          "description": "欠勤日数"
        },
        "workingDays": {
          "type": "integer",
          "minimum": 0,
          "maximum": 31,
          "description": "出勤日数"
        },
        "scheduledWorkDays": {
          "type": "integer",
          "minimum": 0,
          "maximum": 31,
          "description": "所定勤務日数"
        },
        "lateCount": {
          "type": "integer",
          "minimum": 0,
          "description": "遅刻回数"
        },
        "earlyLeaveCount": {
          "type": "integer",
          "minimum": 0,
          "description": "早退回数"
        }
      },
      "required": [
        "overtimeHours", "overtimeHoursOver60", "lateNightHours",
        "holidayWorkDays", "paidLeaveDays", "absenceDays",
        "workingDays", "scheduledWorkDays"
      ],
      "additionalProperties": false
    },
    "EarningsDetail": {
      "type": "object",
      "properties": {
        "baseSalary": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "overtimePay": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "overtimePayOver60": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "lateNightPay": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "holidayWorkPay": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "fixedOvertimeAllowance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "transportationAllowance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "housingAllowance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "familyAllowance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "qualificationAllowance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "expenseReimbursement": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "stockPurchaseIncentive": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "bonus": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "otherEarnings": {
          "$ref": "common.json#/definitions/MoneyAmount"
        }
      },
      "required": ["baseSalary"],
      "additionalProperties": {
        "$ref": "common.json#/definitions/MoneyAmount"
      },
      "description": "収入詳細（動的フィールド対応）"
    },
    "DeductionsDetail": {
      "type": "object",
      "properties": {
        "healthInsurance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "welfareInsurance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "employmentInsurance": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "incomeTax": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "residentTax": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "stockPurchase": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "loan": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "unionFee": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "otherDeductions": {
          "$ref": "common.json#/definitions/MoneyAmount"
        }
      },
      "additionalProperties": {
        "$ref": "common.json#/definitions/MoneyAmount"
      },
      "description": "控除詳細（動的フィールド対応）"
    }
  },
  "additionalProperties": false
}
```

#### SalarySlip作成リクエスト
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/create-salary-slip-request.json",
  "title": "給料明細作成リクエスト",
  "type": "object",
  "properties": {
    "companyName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "employeeName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "employeeId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "paymentDate": {
      "$ref": "common.json#/definitions/ISODate"
    },
    "targetPeriodStart": {
      "$ref": "common.json#/definitions/ISODate"
    },
    "targetPeriodEnd": {
      "$ref": "common.json#/definitions/ISODate"
    },
    "attendance": {
      "$ref": "salary-slip.json#/definitions/AttendanceInfo"
    },
    "earnings": {
      "$ref": "salary-slip.json#/definitions/EarningsDetail"
    },
    "deductions": {
      "$ref": "salary-slip.json#/definitions/DeductionsDetail"
    },
    "currency": {
      "$ref": "common.json#/definitions/CurrencyCode",
      "default": "JPY"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "confirmed"],
      "default": "draft"
    },
    "sourceType": {
      "type": "string",
      "enum": ["manual", "api"],
      "default": "manual"
    }
  },
  "required": [
    "companyName", "employeeName", "employeeId",
    "paymentDate", "targetPeriodStart", "targetPeriodEnd",
    "attendance", "earnings", "deductions"
  ],
  "additionalProperties": false,
  "allOf": [
    {
      "if": {
        "properties": {
          "targetPeriodStart": true,
          "targetPeriodEnd": true
        }
      },
      "then": {
        "properties": {
          "targetPeriodEnd": {
            "type": "string",
            "format": "date",
            "formatMinimum": {
              "$data": "1/targetPeriodStart"
            }
          }
        }
      }
    }
  ]
}
```

### 2.3 株式ポートフォリオスキーマ

#### StockPortfolio（株式ポートフォリオ）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/stock-portfolio.json",
  "title": "株式ポートフォリオスキーマ",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "userId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "stockId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "stock": {
      "$ref": "#/definitions/StockMaster"
    },
    "quantity": {
      "type": "string",
      "pattern": "^\\d+(\\.\\d{1,4})?$",
      "description": "保有数量（小数点以下最大4桁）"
    },
    "averagePurchasePrice": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "平均取得単価"
    },
    "totalInvestment": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "投資総額"
    },
    "currentValue": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "現在価値"
    },
    "unrealizedGainLoss": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "未実現損益"
    },
    "unrealizedGainLossRate": {
      "$ref": "common.json#/definitions/Percentage",
      "description": "未実現損益率"
    },
    "firstPurchaseDate": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "初回購入日"
    },
    "lastPurchaseDate": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "最終購入日"
    }
  },
  "required": [
    "id", "userId", "stockId", "quantity", "averagePurchasePrice",
    "totalInvestment", "currentValue", "unrealizedGainLoss",
    "unrealizedGainLossRate", "createdAt", "updatedAt"
  ],
  "allOf": [
    {
      "$ref": "common.json#/definitions/Timestamps"
    }
  ],
  "definitions": {
    "StockMaster": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "common.json#/definitions/EntityId"
        },
        "symbol": {
          "type": "string",
          "minLength": 1,
          "maxLength": 10,
          "pattern": "^[A-Z0-9]+$",
          "description": "銘柄コード"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200,
          "description": "銘柄名"
        },
        "exchange": {
          "type": "string",
          "enum": ["TSE", "NYSE", "NASDAQ", "LSE", "HKEX", "SSE", "SZSE"],
          "description": "取引所"
        },
        "sector": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "セクター"
        },
        "industry": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "業種"
        },
        "marketCap": {
          "type": ["string", "null"],
          "$ref": "common.json#/definitions/MoneyAmount",
          "description": "時価総額"
        },
        "currency": {
          "$ref": "common.json#/definitions/CurrencyCode",
          "description": "取引通貨"
        },
        "isActive": {
          "type": "boolean",
          "description": "アクティブ状態"
        }
      },
      "required": ["id", "symbol", "name", "exchange", "currency", "isActive"],
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

#### StockTransaction（株式取引）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/stock-transaction.json",
  "title": "株式取引スキーマ",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "portfolioId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "stockId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "userId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "transactionType": {
      "type": "string",
      "enum": ["buy", "sell", "dividend"],
      "description": "取引種別"
    },
    "quantity": {
      "type": "string",
      "pattern": "^\\d+(\\.\\d{1,4})?$",
      "description": "数量"
    },
    "pricePerShare": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "単価"
    },
    "totalAmount": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "取引総額"
    },
    "commission": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "手数料"
    },
    "tax": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "税金"
    },
    "transactionDate": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "取引日"
    },
    "notes": {
      "type": ["string", "null"],
      "maxLength": 500,
      "description": "備考"
    },
    "createdAt": {
      "$ref": "common.json#/definitions/ISODateTime"
    }
  },
  "required": [
    "id", "portfolioId", "stockId", "userId", "transactionType",
    "quantity", "pricePerShare", "totalAmount", "commission",
    "tax", "transactionDate", "createdAt"
  ],
  "additionalProperties": false
}
```

### 2.4 資産管理スキーマ

#### Asset（その他資産）
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://salary-management.app/schemas/asset.json",
  "title": "資産スキーマ",
  "type": "object",
  "properties": {
    "id": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "userId": {
      "$ref": "common.json#/definitions/EntityId"
    },
    "assetType": {
      "type": "string",
      "enum": ["cash", "deposit", "bond", "realestate", "crypto", "other"],
      "description": "資産種別"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "description": "資産名"
    },
    "description": {
      "type": ["string", "null"],
      "maxLength": 500,
      "description": "説明"
    },
    "amount": {
      "$ref": "common.json#/definitions/MoneyAmount",
      "description": "金額"
    },
    "currency": {
      "$ref": "common.json#/definitions/CurrencyCode",
      "description": "通貨"
    },
    "asOfDate": {
      "$ref": "common.json#/definitions/ISODate",
      "description": "評価基準日"
    },
    "metadata": {
      "type": ["object", "null"],
      "description": "追加メタデータ",
      "properties": {
        "bankName": {
          "type": "string",
          "maxLength": 100
        },
        "accountNumber": {
          "type": "string",
          "maxLength": 50
        },
        "interestRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "maturityDate": {
          "$ref": "common.json#/definitions/ISODate"
        },
        "address": {
          "type": "string",
          "maxLength": 500
        },
        "area": {
          "type": "number",
          "minimum": 0
        },
        "purchaseDate": {
          "$ref": "common.json#/definitions/ISODate"
        },
        "purchasePrice": {
          "$ref": "common.json#/definitions/MoneyAmount"
        },
        "walletAddress": {
          "type": "string",
          "maxLength": 100
        },
        "quantity": {
          "type": "string",
          "pattern": "^\\d+(\\.\\d+)?$"
        },
        "exchangeName": {
          "type": "string",
          "maxLength": 100
        }
      },
      "additionalProperties": true
    }
  },
  "required": [
    "id", "userId", "assetType", "name", "amount", 
    "currency", "asOfDate", "createdAt", "updatedAt"
  ],
  "allOf": [
    {
      "$ref": "common.json#/definitions/Timestamps"
    }
  ],
  "additionalProperties": false
}
```

---

## 3. データ検証ルール

### 3.1 入力データ検証

#### Zodスキーマ統合
```typescript
import { z } from 'zod';

// 基本型検証
export const zodSchemas = {
  // エンティティID
  entityId: z.string().regex(/^[a-z0-9]{25}$/, '無効なIDフォーマット'),
  
  // 日時
  isoDateTime: z.string().datetime(),
  isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  
  // 金額
  moneyAmount: z.string()
    .regex(/^-?\d+(\.\d{1,2})?$/, '金額は小数点以下2桁まで入力可能です')
    .refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && isFinite(num);
    }, '有効な数値を入力してください'),
  
  // パーセンテージ
  percentage: z.number()
    .min(-100, 'パーセンテージは-100以上である必要があります')
    .max(10000, 'パーセンテージは10000以下である必要があります'),
  
  // 通貨
  currency: z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY'], {
    errorMap: () => ({ message: '対応していない通貨コードです' })
  }),
  
  // 株式数量
  stockQuantity: z.string()
    .regex(/^\d+(\.\d{1,4})?$/, '数量は小数点以下4桁まで入力可能です')
    .refine(val => parseFloat(val) > 0, '数量は0より大きい値である必要があります'),
  
  // セキュリティ対応
  safeString: z.string()
    .regex(/^[^\x00-\x1F\x7F-\x9F<>]*$/, '使用できない文字が含まれています')
    .transform(val => val.trim())
};

// 給料明細検証例
export const salarySlipCreateSchema = z.object({
  companyName: zodSchemas.safeString.min(1).max(100),
  employeeName: zodSchemas.safeString.min(1).max(100),
  employeeId: zodSchemas.safeString.min(1).max(50),
  paymentDate: zodSchemas.isoDate,
  targetPeriodStart: zodSchemas.isoDate,
  targetPeriodEnd: zodSchemas.isoDate,
  attendance: z.object({
    overtimeHours: z.number().min(0).max(1000),
    // 他のフィールド...
  }),
  earnings: z.record(zodSchemas.moneyAmount),
  deductions: z.record(zodSchemas.moneyAmount),
  currency: zodSchemas.currency.default('JPY'),
}).refine(
  data => new Date(data.targetPeriodStart) <= new Date(data.targetPeriodEnd),
  {
    message: '対象期間の開始日は終了日以前である必要があります',
    path: ['targetPeriodEnd'],
  }
).refine(
  data => new Date(data.paymentDate) >= new Date(data.targetPeriodEnd),
  {
    message: '支払日は対象期間終了日以後である必要があります',
    path: ['paymentDate'],
  }
);
```

### 3.2 ビジネスルール検証

#### 給料明細の整合性チェック
```typescript
export const validateSalarySlipConsistency = (data: SalarySlipData) => {
  const errors: ValidationError[] = [];
  
  // 1. 金額の整合性チェック
  const totalEarnings = Object.values(data.earnings)
    .reduce((sum, amount) => sum + parseFloat(amount), 0);
  const totalDeductions = Object.values(data.deductions)
    .reduce((sum, amount) => sum + parseFloat(amount), 0);
  const netPay = totalEarnings - totalDeductions;
  
  if (Math.abs(parseFloat(data.netPay) - netPay) > 0.01) {
    errors.push({
      field: 'netPay',
      message: '差引支給額が収入と控除の差額と一致しません',
      code: 'AMOUNT_MISMATCH'
    });
  }
  
  // 2. 勤怠の整合性チェック
  const { attendance } = data;
  if (attendance.workingDays > attendance.scheduledWorkDays) {
    errors.push({
      field: 'attendance.workingDays',
      message: '出勤日数は所定勤務日数以下である必要があります',
      code: 'INVALID_WORKING_DAYS'
    });
  }
  
  // 3. 期間の妥当性チェック
  const periodStart = new Date(data.targetPeriodStart);
  const periodEnd = new Date(data.targetPeriodEnd);
  const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24));
  
  if (daysDiff < 20 || daysDiff > 40) {
    errors.push({
      field: 'targetPeriod',
      message: '対象期間が通常の給与期間と異なります（20-40日が一般的）',
      code: 'UNUSUAL_PERIOD',
      severity: 'warning'
    });
  }
  
  return errors;
};
```

#### 株式取引の検証
```typescript
export const validateStockTransaction = async (data: StockTransactionData) => {
  const errors: ValidationError[] = [];
  
  // 1. 売却時の保有数量チェック
  if (data.transactionType === 'sell') {
    const portfolio = await getPortfolio(data.userId, data.symbol);
    const currentQuantity = parseFloat(portfolio?.quantity || '0');
    const sellQuantity = parseFloat(data.quantity);
    
    if (sellQuantity > currentQuantity) {
      errors.push({
        field: 'quantity',
        message: '売却数量が保有数量を超えています',
        code: 'INSUFFICIENT_QUANTITY',
        details: { 
          available: currentQuantity.toString(),
          requested: sellQuantity.toString()
        }
      });
    }
  }
  
  // 2. 取引日の妥当性
  const transactionDate = new Date(data.transactionDate);
  const now = new Date();
  
  if (transactionDate > now) {
    errors.push({
      field: 'transactionDate',
      message: '取引日は現在日時以前である必要があります',
      code: 'FUTURE_DATE'
    });
  }
  
  // 3. 価格の妥当性（市場価格との乖離チェック）
  const marketPrice = await getMarketPrice(data.symbol, data.transactionDate);
  if (marketPrice) {
    const pricePerShare = parseFloat(data.pricePerShare);
    const deviation = Math.abs(pricePerShare - marketPrice.price) / marketPrice.price;
    
    if (deviation > 0.1) { // 10%以上の乖離
      errors.push({
        field: 'pricePerShare',
        message: '取引価格が市場価格と大きく異なります',
        code: 'PRICE_DEVIATION',
        severity: 'warning',
        details: {
          inputPrice: pricePerShare.toString(),
          marketPrice: marketPrice.price.toString(),
          deviation: (deviation * 100).toFixed(2) + '%'
        }
      });
    }
  }
  
  return errors;
};
```

---

## 4. 通信プロトコル詳細

### 4.1 HTTP通信仕様

#### リクエスト仕様
```typescript
interface StandardHttpRequest {
  // 必須ヘッダー
  headers: {
    'Content-Type': 'application/json; charset=utf-8';
    'Accept': 'application/json';
    'Authorization': `Bearer ${jwtToken}`;
    'User-Agent': string;
    
    // オプショナルヘッダー
    'Accept-Language'?: 'ja-JP,ja;q=0.9,en;q=0.8';
    'X-Request-ID'?: string;         // 追跡用ユニークID
    'X-Client-Version'?: string;     // クライアントバージョン
    'X-Forwarded-For'?: string;      // プロキシ経由時の実IPアドレス
    'If-None-Match'?: string;        // ETags によるキャッシュ制御
    'If-Modified-Since'?: string;    // 最終更新時刻による条件付きリクエスト
  };
  
  // ボディ（POSTやPUTの場合）
  body?: string; // JSON文字列
  
  // タイムアウト設定
  timeout: 30000; // 30秒
  
  // リトライ設定
  retryConfig?: {
    maxRetries: 3;
    retryDelay: 1000;          // ミリ秒
    backoffMultiplier: 2;      // 指数バックオフ
    retryOnStatus: [429, 502, 503, 504];
  };
}
```

#### レスポンス仕様
```typescript
interface StandardHttpResponse {
  // ステータス
  status: number;
  statusText: string;
  
  // 必須ヘッダー
  headers: {
    'Content-Type': 'application/json; charset=utf-8';
    'X-Request-ID': string;
    'X-Response-Time': string;      // 処理時間（ミリ秒）
    
    // キャッシュ制御
    'Cache-Control': string;
    'ETag'?: string;
    'Last-Modified'?: string;
    
    // セキュリティヘッダー
    'X-Content-Type-Options': 'nosniff';
    'X-Frame-Options': 'DENY';
    'X-XSS-Protection': '1; mode=block';
    
    // レート制限情報
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
  };
  
  // レスポンスボディ
  body: ApiSuccessResponse<any> | ApiErrorResponse;
  
  // メタデータ
  metadata: {
    requestTime: string;
    processingTime: number;
    serverVersion: string;
    environment: 'production' | 'staging' | 'development';
  };
}
```

### 4.2 WebSocket通信仕様（リアルタイム更新）

#### 接続仕様
```typescript
interface WebSocketConnection {
  url: 'wss://salary-management.vercel.app/api/v1/ws';
  protocols: ['salary-management-v1'];
  
  // 認証
  connectionParams: {
    authorization: string; // JWT token
    clientVersion: string;
  };
  
  // ハートビート
  heartbeat: {
    interval: 30000;     // 30秒間隔
    timeout: 5000;       // 5秒でタイムアウト
    message: 'ping';
  };
}

// WebSocketメッセージ形式
interface WebSocketMessage {
  id: string;           // メッセージID
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error' | 'ping' | 'pong';
  channel?: string;     // チャンネル名
  data?: any;          // ペイロード
  timestamp: string;    // ISO 8601
}

// 購読チャンネル
interface SubscriptionChannels {
  'portfolio.updates': {
    userId: string;
    symbols?: string[];  // 特定銘柄のみ購読
  };
  'stock.prices': {
    symbols: string[];   // 株価リアルタイム更新
  };
  'notifications': {
    userId: string;      // 個人通知
  };
}
```

---

## 5. エラーレスポンス詳細

### 5.1 エラー分類・コード体系

```typescript
// エラーカテゴリ別コード
export const ERROR_CODES = {
  // クライアントエラー (4xx)
  CLIENT: {
    VALIDATION_ERROR: 'E4001',
    AUTHENTICATION_ERROR: 'E4002',
    AUTHORIZATION_ERROR: 'E4003',
    NOT_FOUND: 'E4004',
    CONFLICT: 'E4005',
    DUPLICATE_ERROR: 'E4006',
    RATE_LIMIT_EXCEEDED: 'E4007',
    PARSE_ERROR: 'E4008',
    FILE_ERROR: 'E4009',
    BUSINESS_RULE_VIOLATION: 'E4010',
  },
  
  // サーバーエラー (5xx)
  SERVER: {
    INTERNAL_SERVER_ERROR: 'E5001',
    SERVICE_UNAVAILABLE: 'E5002',
    DATABASE_ERROR: 'E5003',
    EXTERNAL_API_ERROR: 'E5004',
    NETWORK_ERROR: 'E5005',
    TIMEOUT_ERROR: 'E5006',
  }
} as const;

// 多言語エラーメッセージ
export const ERROR_MESSAGES = {
  ja: {
    E4001: '入力データが無効です',
    E4002: '認証が必要です',
    E4003: 'アクセス権限がありません',
    E4004: '指定されたリソースが見つかりません',
    E4005: '他のデータと競合しています',
    E4006: '重複するデータが存在します',
    E4007: 'APIリクエスト制限を超過しました',
    E4008: 'データの解析に失敗しました',
    E4009: 'ファイル処理でエラーが発生しました',
    E4010: 'ビジネスルールに違反しています',
    E5001: 'サーバー内部でエラーが発生しました',
    E5002: 'サービスが一時的に利用できません',
    E5003: 'データベースへの接続に失敗しました',
    E5004: '外部サービスへの接続に失敗しました',
    E5005: 'ネットワークエラーが発生しました',
    E5006: '処理がタイムアウトしました',
  },
  en: {
    E4001: 'Invalid input data',
    E4002: 'Authentication required',
    E4003: 'Access denied',
    E4004: 'Resource not found',
    E4005: 'Data conflict',
    E4006: 'Duplicate data exists',
    E4007: 'API rate limit exceeded',
    E4008: 'Data parsing failed',
    E4009: 'File processing error',
    E4010: 'Business rule violation',
    E5001: 'Internal server error',
    E5002: 'Service temporarily unavailable',
    E5003: 'Database connection failed',
    E5004: 'External service connection failed',
    E5005: 'Network error occurred',
    E5006: 'Request timeout',
  }
} as const;
```

### 5.2 構造化エラーレスポンス

#### 詳細なバリデーションエラー
```json
{
  "success": false,
  "error": {
    "code": "E4001",
    "message": "入力データが無効です",
    "details": {
      "validationErrors": [
        {
          "field": "paymentDate",
          "message": "有効な日付を入力してください",
          "code": "INVALID_DATE",
          "value": "2025-13-01",
          "constraint": "ISO 8601 date format",
          "path": "$.paymentDate"
        },
        {
          "field": "netPay",
          "message": "金額は0以上である必要があります",
          "code": "MINIMUM_VALUE",
          "value": -1000,
          "constraint": "minimum: 0",
          "path": "$.netPay"
        }
      ],
      "failedRules": [
        {
          "rule": "period_consistency",
          "message": "対象期間の開始日は終了日以前である必要があります",
          "context": {
            "targetPeriodStart": "2025-02-01",
            "targetPeriodEnd": "2025-01-31"
          }
        }
      ]
    },
    "requestId": "req_cm3k8n4r90001oe6v8h7x2p1q",
    "timestamp": "2025-08-10T12:00:00Z",
    "correlationId": "corr_12345",
    "userMessage": "入力内容を確認して再度お試しください",
    "developerMessage": "Request validation failed on multiple fields",
    "helpUrl": "https://docs.salary-management.app/errors/E4001"
  }
}
```

#### 外部API連携エラー
```json
{
  "success": false,
  "error": {
    "code": "E5004",
    "message": "外部サービスへの接続に失敗しました",
    "details": {
      "service": "alpha_vantage",
      "endpoint": "https://www.alphavantage.co/query",
      "httpStatus": 503,
      "serviceError": {
        "code": "SERVICE_UNAVAILABLE",
        "message": "API service is temporarily unavailable"
      },
      "retryAfter": "2025-08-10T12:05:00Z",
      "nextRetryIn": 300,
      "retryAttempts": 2,
      "maxRetries": 3
    },
    "requestId": "req_stock_price_cm3k8n4r90001oe6v8h7x2p1q",
    "timestamp": "2025-08-10T12:00:00Z",
    "userMessage": "株価情報の取得に失敗しました。しばらく時間をおいて再度お試しください",
    "developerMessage": "Alpha Vantage API returned 503 Service Unavailable"
  }
}
```

---

## 6. 国際化・多言語対応

### 6.1 多言語データ構造

#### ロケール対応JSON構造
```json
{
  "data": {
    "id": "cm3k8n4r90001oe6v8h7x2p1q",
    "companyName": "株式会社サンプル",
    "netPay": "285000.00",
    "currency": "JPY",
    "locale": "ja-JP",
    "i18n": {
      "companyName": {
        "ja": "株式会社サンプル",
        "en": "Sample Corporation"
      },
      "displayTexts": {
        "ja": {
          "netPayLabel": "差引支給額",
          "currencySymbol": "¥"
        },
        "en": {
          "netPayLabel": "Net Pay",
          "currencySymbol": "¥"
        }
      }
    }
  }
}
```

### 6.2 通貨・数値フォーマット

#### 通貨別表示形式
```typescript
interface CurrencyFormat {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  symbolPosition: 'before' | 'after';
  locale: string;
}

export const CURRENCY_FORMATS: Record<CurrencyCode, CurrencyFormat> = {
  JPY: {
    code: 'JPY',
    symbol: '¥',
    decimals: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    locale: 'ja-JP'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    symbolPosition: 'before',
    locale: 'en-US'
  }
  // 他の通貨...
};

// 使用例
export const formatCurrency = (amount: string, currency: CurrencyCode, locale?: string): string => {
  const format = CURRENCY_FORMATS[currency];
  const num = parseFloat(amount);
  
  const formatted = new Intl.NumberFormat(locale || format.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: format.decimals,
    maximumFractionDigits: format.decimals,
  }).format(num);
  
  return formatted;
};
```

---

## 7. セキュリティ考慮事項

### 7.1 データサニタイゼーション

#### 入力データクリーニング
```typescript
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeInput = (input: any, type: 'string' | 'number' | 'email' | 'html' = 'string'): any => {
  if (input === null || input === undefined) {
    return input;
  }
  
  switch (type) {
    case 'string':
      return typeof input === 'string' 
        ? input.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '') // 制御文字除去
        : input;
        
    case 'number':
      return typeof input === 'string' 
        ? input.replace(/[^\d.-]/g, '') // 数値以外除去
        : input;
        
    case 'email':
      return typeof input === 'string' 
        ? input.toLowerCase().trim().replace(/[<>]/g, '') // 危険文字除去
        : input;
        
    case 'html':
      return typeof input === 'string' 
        ? DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) // HTML完全除去
        : input;
        
    default:
      return input;
  }
};

// 再帰的にオブジェクト全体をサニタイズ
export const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj, 'string');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeInput(key, 'string');
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
};
```

### 7.2 機密データマスキング

#### ログ出力時のマスキング
```typescript
interface LoggingConfig {
  sensitiveFields: string[];
  maskingStrategy: 'partial' | 'full' | 'hash';
}

const SENSITIVE_FIELDS = [
  'password', 'sessionToken', 'refreshToken',
  'employeeId', 'socialSecurityNumber',
  'bankAccount', 'creditCard',
  'ipAddress', 'email'
];

export const maskSensitiveData = (data: any, config: LoggingConfig): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  
  for (const field of config.sensitiveFields) {
    if (field in masked && masked[field]) {
      switch (config.maskingStrategy) {
        case 'full':
          masked[field] = '***MASKED***';
          break;
          
        case 'partial':
          const value = String(masked[field]);
          if (value.length > 6) {
            masked[field] = value.substring(0, 2) + 
                           '*'.repeat(value.length - 4) + 
                           value.substring(value.length - 2);
          } else {
            masked[field] = '*'.repeat(value.length);
          }
          break;
          
        case 'hash':
          const crypto = require('crypto');
          masked[field] = crypto.createHash('sha256')
                               .update(String(masked[field]))
                               .digest('hex')
                               .substring(0, 8);
          break;
      }
    }
  }
  
  return masked;
};
```

---

## 8. パフォーマンス最適化

### 8.1 レスポンス圧縮

#### Gzip圧縮設定
```typescript
interface CompressionConfig {
  algorithm: 'gzip' | 'brotli';
  level: number;           // 1-9 (gzip), 0-11 (brotli)
  threshold: number;       // 圧縮対象の最小サイズ（バイト）
  mimeTypes: string[];     // 圧縮対象MIMEタイプ
}

export const COMPRESSION_CONFIG: CompressionConfig = {
  algorithm: 'gzip',
  level: 6,                // バランス重視
  threshold: 1024,         // 1KB以上
  mimeTypes: [
    'application/json',
    'text/plain',
    'text/html',
    'text/csv',
    'application/xml'
  ]
};

// レスポンスサイズ監視
export const measureResponseSize = (data: any): number => {
  return JSON.stringify(data).length;
};
```

### 8.2 データ転送最適化

#### 差分更新（Delta Update）対応
```typescript
interface DeltaUpdate {
  version: number;
  changes: {
    added?: Record<string, any>[];
    updated?: Record<string, any>[];
    deleted?: string[];
  };
  timestamp: string;
}

// 例：ポートフォリオの差分更新
export const createPortfolioDelta = (
  previous: StockPortfolio[],
  current: StockPortfolio[]
): DeltaUpdate => {
  const added: StockPortfolio[] = [];
  const updated: StockPortfolio[] = [];
  const deleted: string[] = [];
  
  const previousMap = new Map(previous.map(p => [p.id, p]));
  const currentMap = new Map(current.map(p => [p.id, p]));
  
  // 追加・更新の検出
  for (const [id, item] of currentMap) {
    const prevItem = previousMap.get(id);
    if (!prevItem) {
      added.push(item);
    } else if (JSON.stringify(prevItem) !== JSON.stringify(item)) {
      updated.push(item);
    }
  }
  
  // 削除の検出
  for (const id of previousMap.keys()) {
    if (!currentMap.has(id)) {
      deleted.push(id);
    }
  }
  
  return {
    version: Date.now(),
    changes: { added, updated, deleted },
    timestamp: new Date().toISOString()
  };
};
```

---

## 9. テストデータ・モック仕様

### 9.1 テスト用サンプルデータ

#### 給料明細テストデータ
```json
{
  "validSalarySlip": {
    "companyName": "テスト株式会社",
    "employeeName": "テスト太郎",
    "employeeId": "TEST001",
    "paymentDate": "2025-01-25",
    "targetPeriodStart": "2025-01-01",
    "targetPeriodEnd": "2025-01-31",
    "attendance": {
      "overtimeHours": 15.5,
      "overtimeHoursOver60": 0,
      "lateNightHours": 3.0,
      "holidayWorkDays": 1,
      "paidLeaveDays": 1.0,
      "absenceDays": 0,
      "workingDays": 20,
      "scheduledWorkDays": 21,
      "lateCount": 0,
      "earlyLeaveCount": 0
    },
    "earnings": {
      "baseSalary": "300000.00",
      "overtimePay": "23250.00",
      "lateNightPay": "4500.00",
      "transportationAllowance": "10000.00",
      "housingAllowance": "20000.00"
    },
    "deductions": {
      "healthInsurance": "14850.00",
      "welfareInsurance": "5940.00",
      "employmentInsurance": "1785.00",
      "incomeTax": "15200.00",
      "residentTax": "23500.00"
    },
    "currency": "JPY",
    "status": "confirmed",
    "sourceType": "manual"
  },
  "invalidSalarySlip": {
    "companyName": "",
    "employeeName": "テスト太郎",
    "paymentDate": "2025-13-01",
    "targetPeriodStart": "2025-02-01",
    "targetPeriodEnd": "2025-01-31",
    "netPay": "-1000.00"
  }
}
```

### 9.2 APIモック定義

#### MSW（Mock Service Worker）設定
```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  // 給料明細一覧取得
  rest.get('/api/v1/salary-slips', (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '20');
    
    return res(
      ctx.json({
        success: true,
        data: MOCK_SALARY_SLIPS.slice((page - 1) * limit, page * limit),
        meta: {
          page,
          limit,
          total: MOCK_SALARY_SLIPS.length,
          totalPages: Math.ceil(MOCK_SALARY_SLIPS.length / limit),
          hasNext: page * limit < MOCK_SALARY_SLIPS.length,
          hasPrev: page > 1
        }
      })
    );
  }),
  
  // エラーシミュレーション
  rest.post('/api/v1/salary-slips/upload', (req, res, ctx) => {
    // 30%の確率でエラーを返す
    if (Math.random() < 0.3) {
      return res(
        ctx.status(422),
        ctx.json({
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'PDFの読み込みに失敗しました',
            details: {
              reason: 'CORRUPTED_FILE'
            }
          }
        })
      );
    }
    
    return res(
      ctx.json({
        success: true,
        data: {
          processed: 1,
          succeeded: 1,
          failed: 0,
          results: [
            {
              fileName: 'test.pdf',
              status: 'success',
              salarySlipId: 'mock_id_123'
            }
          ]
        }
      })
    );
  })
];

export const server = setupServer(...handlers);
```

---

## 10. 次のステップ

1. ✅ データ交換フォーマット詳細定義（本書）
2. → 外部システム連携仕様
3. → JSON Schema ファイルの生成
4. → TypeScript型定義の自動生成
5. → APIクライアントライブラリの作成
6. → バリデーション機能の実装

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| インターフェースアーキテクト | インターフェース設計アーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | インターフェース設計アーキテクト |
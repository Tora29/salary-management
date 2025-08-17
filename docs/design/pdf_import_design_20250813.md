# 給料明細PDF取り込み機能 設計書

## 作成日: 2025/01/13

## 1. ライブラリ選定

### 1.1 評価対象ライブラリ

#### 現在の状態分析

**関連する既存依存関係:**

- `pdf-lib` (^1.17.1) - PDF操作・生成ライブラリ（既にインストール済み）
- `@supabase/supabase-js` - ファイルストレージ連携
- `zod` - バリデーション処理

#### ライブラリ推奨（上位3オプション）

**オプション1: pdf.js (pdfjs-dist)**

- **npmパッケージ**: pdfjs-dist
- **バンドルサイズ**: ~2.5MB (minified+gzip)
- **主要機能**:
  - PDFテキスト抽出
  - Canvas/SVGレンダリング
  - フォーム値取得
  - 構造化データ抽出
- **互換性**: SvelteKit SSR要注意（ブラウザ専用API使用）
- **FSD層配置**: `features/salary-import/api/pdfParser.ts`
- **スコア**:
  - 必要性: 9/10
  - 互換性: 7/10
  - パフォーマンス: 6/10
  - 保守性: 10/10
  - アーキテクチャ適合性: 8/10
  - **合計: 40/50**

**オプション2: tesseract.js (OCR)**

- **npmパッケージ**: tesseract.js
- **バンドルサイズ**: ~3MB (minified+gzip) + 言語データ
- **主要機能**:
  - 画像ベースPDFからのOCR抽出
  - 日本語対応
  - 複雑なレイアウト処理
- **互換性**: Web Worker推奨
- **FSD層配置**: `features/salary-import/api/ocrParser.ts`
- **スコア**:
  - 必要性: 7/10
  - 互換性: 8/10
  - パフォーマンス: 5/10
  - 保守性: 9/10
  - アーキテクチャ適合性: 8/10
  - **合計: 37/50**

**オプション3: pdf-parse (サーバーサイド)**

- **npmパッケージ**: pdf-parse
- **バンドルサイズ**: ~50KB (minified+gzip)
- **主要機能**:
  - Node.js環境でのPDF解析
  - 軽量・高速
  - テキスト抽出特化
- **互換性**: SvelteKit API routes完全対応
- **FSD層配置**: `routes/api/salary/import/+server.ts`
- **スコア**:
  - 必要性: 8/10
  - 互換性: 10/10
  - パフォーマンス: 9/10
  - 保守性: 8/10
  - アーキテクチャ適合性: 9/10
  - **合計: 44/50**

### 1.2 最終推奨

**推奨構成: pdf-parse（メイン） + pdfjs-dist（プレビュー用）**

**正当化:**

- サーバーサイドでの安全な処理（pdf-parse）
- クライアントサイドでのプレビュー表示（pdfjs-dist）
- 既存のpdf-libは削除不要（PDF生成用に保持）

**統合アプローチ:**

1. API routeでpdf-parseを使用してテキスト抽出
2. クライアントでpdfjs-distを使用してプレビュー表示
3. 抽出データをSupabaseに保存

**潜在的リスク:**

- バンドルサイズの増加（プレビュー機能使用時）
- 複雑なレイアウトのPDFでの抽出精度

## 2. 基本設計

### 2.1 問題定義

給料明細PDFから手動でデータを入力する作業が非効率で、入力ミスのリスクがある

### 2.2 目標

1. PDFファイルから給料明細データを自動的に抽出し、データベースに保存する
2. 抽出されたデータの精度を検証し、必要に応じて修正可能にする
3. 複数の給料明細フォーマットに対応できる柔軟な抽出システムを構築する

### 2.3 受け入れ基準

| ID     | Given                                                   | When                                         | Then                                                                       |
| ------ | ------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| AC-001 | ユーザーが給料明細PDFをアップロードする画面を開いている | PDFファイルをドラッグ&ドロップまたは選択する | PDFのプレビューが表示され、アップロードボタンが有効になる                  |
| AC-002 | 有効なPDFファイルがアップロードされた                   | データ抽出処理が実行される                   | 給料明細の主要項目（基本給、各種手当、控除、支給額等）が自動的に抽出される |
| AC-003 | PDFからデータが抽出された                               | 抽出結果の確認画面が表示される               | ユーザーは各項目の値を確認・修正できる                                     |
| AC-004 | 抽出データが確認・修正された                            | 保存ボタンをクリックする                     | データがSupabaseデータベースに保存され、成功メッセージが表示される         |
| AC-005 | 無効なファイル（PDF以外）がアップロードされた           | ファイル検証が実行される                     | エラーメッセージが表示され、処理が中断される                               |
| AC-006 | PDFの構造が認識できない                                 | データ抽出に失敗する                         | 手動入力フォームが表示され、ユーザーが直接データを入力できる               |

### 2.4 スコープ外

- 複数PDFの一括処理機能
- OCR機能（画像ベースPDFからのテキスト抽出）
- 外部APIとの連携による給料明細データの自動取得

### 2.5 API設計

#### エンドポイント一覧

**1. PDFアップロード**

```
POST /api/pdf/upload
Request:
{
  "file": File,
  "userId": string
}
Response:
{
  "success": boolean,
  "fileId": string,
  "previewUrl": string
}
```

**2. データ抽出**

```
POST /api/pdf/extract
Request:
{
  "fileId": string,
  "extractionTemplate": string?
}
Response:
{
  "success": boolean,
  "extractedData": {
    "基本給": number,
    "残業手当": number,
    "通勤手当": number,
    "その他手当": number[],
    "健康保険": number,
    "厚生年金": number,
    "雇用保険": number,
    "所得税": number,
    "住民税": number,
    "総支給額": number,
    "控除合計": number,
    "差引支給額": number,
    "支給年月": string
  },
  "confidence": number,
  "errors": string[]?
}
```

**3. データ保存**

```
POST /api/salary/save
Request:
{
  "userId": string,
  "salaryData": ExtractedData,
  "pdfFileId": string?
}
Response:
{
  "success": boolean,
  "salaryId": string,
  "message": string
}
```

### 2.6 データモデル

```prisma
model SalarySlip {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])

  // 支給情報
  paymentDate DateTime
  basicSalary Decimal @db.Decimal(10, 2)
  overtimeAllowance Decimal? @db.Decimal(10, 2)
  commutingAllowance Decimal? @db.Decimal(10, 2)
  otherAllowances Json? // 配列として保存

  // 控除情報
  healthInsurance Decimal @db.Decimal(10, 2)
  pensionInsurance Decimal @db.Decimal(10, 2)
  employmentInsurance Decimal @db.Decimal(10, 2)
  incomeTax Decimal @db.Decimal(10, 2)
  residentTax Decimal @db.Decimal(10, 2)
  otherDeductions Json? // 配列として保存

  // 合計
  totalPayment Decimal @db.Decimal(10, 2)
  totalDeductions Decimal @db.Decimal(10, 2)
  netPayment Decimal @db.Decimal(10, 2)

  // メタデータ
  pdfFileUrl String?
  extractionConfidence Float?
  extractionMethod String? // 'auto', 'manual', 'template'

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2.7 コンポーネント構造

**Features層:**

- `features/salary-import/ui/SalaryImportForm.svelte`
- `features/salary-import/ui/PdfPreview.svelte`
- `features/salary-import/ui/ExtractionResultEditor.svelte`
- `features/salary-import/composable/useSalaryImport.svelte.ts`
- `features/salary-import/api/pdfParser.ts`

**Entities層:**

- `entities/salary/model/types.ts`
- `entities/salary/ui/SalaryDataCard.svelte`
- `entities/salary/api/salaryApi.ts`

**Shared層:**

- `shared/components/ui/FileDropzone.svelte`
- `shared/components/ui/LoadingSpinner.svelte`
- `shared/components/ui/ErrorMessage.svelte`
- `shared/utils/validators/salaryData.ts`

## 3. 詳細設計

### 3.1 実装チェックリスト

#### データモデル層

- [ ] Supabaseテーブル定義（salary_slips）
- [ ] 型定義ファイル作成

#### API層

- [ ] PDF取り込み統合エンドポイント（/api/salary/import）

#### エンティティ層

- [ ] salaryモデル定義（types.ts）
- [ ] salaryAPI実装（salaryApi.ts）

#### フィーチャー層

- [ ] SalaryImportFormコンポーネント
- [ ] PDFプレビューコンポーネント
- [ ] 抽出結果エディターコンポーネント
- [ ] useSalaryImport composable実装
- [ ] pdfParser API実装

#### 共通コンポーネント層

- [ ] FileDropzoneコンポーネント
- [ ] バリデーター実装

### 3.2 ファイル構成

```
src/
├── entities/
│   └── salary/
│       ├── model/
│       │   └── types.ts
│       ├── api/
│       │   └── salaryApi.ts
│       └── ui/
│           └── SalaryDataCard.svelte
├── features/
│   └── salary-import/
│       ├── ui/
│       │   ├── SalaryImportForm.svelte
│       │   ├── PdfPreview.svelte
│       │   └── ExtractionResultEditor.svelte
│       ├── composable/
│       │   └── useSalaryImport.svelte.ts
│       ├── api/
│       │   └── pdfParser.ts
│       └── model/
│           └── types.ts
├── shared/
│   ├── components/
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── ui/
│   │       ├── FileDropzone.svelte
│   │       ├── LoadingSpinner.svelte
│   │       └── ErrorMessage.svelte
│   └── utils/
│       └── validators/
│           └── salaryData.ts
└── routes/
    ├── api/
    │   └── salary/
    │       └── import/
    │           └── +server.ts
    └── salary/
        └── import/
            └── +page.svelte
```

### 3.3 主要実装コード

#### PDFパーサーライブラリ

```typescript
// src/features/salary-import/api/pdfParser.ts
import type { ExtractedSalaryData } from '../model/types';

export class PdfParser {
	private patterns = {
		basicSalary: /基本給[：:]\s*([0-9,]+)/,
		overtimeAllowance: /残業手当[：:]\s*([0-9,]+)/,
		commutingAllowance: /通勤手当[：:]\s*([0-9,]+)/,
		healthInsurance: /健康保険[：:]\s*([0-9,]+)/,
		pensionInsurance: /厚生年金[：:]\s*([0-9,]+)/,
		employmentInsurance: /雇用保険[：:]\s*([0-9,]+)/,
		incomeTax: /所得税[：:]\s*([0-9,]+)/,
		residentTax: /住民税[：:]\s*([0-9,]+)/,
		totalPayment: /総支給額[：:]\s*([0-9,]+)/,
		totalDeductions: /控除合計[：:]\s*([0-9,]+)/,
		netPayment: /差引支給額[：:]\s*([0-9,]+)/,
		paymentDate: /支給年月[：:]\s*(\d{4}年\d{1,2}月)/
	};

	async extractFromBuffer(buffer: ArrayBuffer): Promise<ExtractedSalaryData> {
		// pdf-parseを使用してテキスト抽出
		const text = await this.extractText(buffer);
		return this.parseText(text);
	}

	private async extractText(buffer: ArrayBuffer): Promise<string> {
		// pdf-parseライブラリを使用
		const pdfParse = await import('pdf-parse');
		const data = await pdfParse(Buffer.from(buffer));
		return data.text;
	}

	private parseText(text: string): ExtractedSalaryData {
		const data: Partial<ExtractedSalaryData> = {};

		for (const [key, pattern] of Object.entries(this.patterns)) {
			const match = text.match(pattern);
			if (match) {
				if (key === 'paymentDate') {
					data[key] = match[1];
				} else {
					data[key] = this.parseAmount(match[1]);
				}
			}
		}

		return this.validateAndFill(data as ExtractedSalaryData);
	}

	private parseAmount(str: string): number {
		return parseInt(str.replace(/,/g, ''), 10);
	}

	private validateAndFill(data: ExtractedSalaryData): ExtractedSalaryData {
		// 必須フィールドの検証と計算値の補完
		if (!data.totalDeductions && data.healthInsurance) {
			data.totalDeductions =
				(data.healthInsurance || 0) +
				(data.pensionInsurance || 0) +
				(data.employmentInsurance || 0) +
				(data.incomeTax || 0) +
				(data.residentTax || 0);
		}

		if (!data.netPayment && data.totalPayment && data.totalDeductions) {
			data.netPayment = data.totalPayment - data.totalDeductions;
		}

		return data;
	}
}
```

#### PDFアップロードフォーム

```svelte
<!-- src/features/salary-import/ui/SalaryImportForm.svelte -->
<script lang="ts">
	import FileDropzone from '$shared/components/ui/FileDropzone.svelte';
	import PdfPreview from './PdfPreview.svelte';
	import ExtractionResultEditor from './ExtractionResultEditor.svelte';
	import { useSalaryImport } from '../composable/useSalaryImport.svelte';

	const { uploadFile, extractData, saveData, extractedData, previewUrl, isLoading, error } =
		useSalaryImport();

	let currentStep: 'upload' | 'preview' | 'edit' | 'complete' = 'upload';
	let selectedFile: File | null = null;

	async function handleFileSelect(file: File) {
		selectedFile = file;
		const result = await uploadFile(file);
		if (result.success) {
			currentStep = 'preview';
			await handleExtraction(result.fileId);
		}
	}

	async function handleExtraction(fileId: string) {
		const result = await extractData(fileId);
		if (result.success) {
			currentStep = 'edit';
		}
	}

	async function handleSave(editedData: any) {
		const result = await saveData(editedData);
		if (result.success) {
			currentStep = 'complete';
		}
	}
</script>

<div class="pdf-import-container">
	{#if currentStep === 'upload'}
		<div class="upload-section">
			<h2>給料明細PDFをアップロード</h2>
			<FileDropzone
				accept="application/pdf"
				maxSize={10 * 1024 * 1024}
				onFileSelect={handleFileSelect}
				{isLoading}
			/>
			{#if error}
				<div class="error-message">{error}</div>
			{/if}
		</div>
	{:else if currentStep === 'preview'}
		<div class="preview-section">
			<h2>PDFプレビュー</h2>
			<PdfPreview url={previewUrl} />
			<button on:click={() => (currentStep = 'edit')}> データ抽出を続ける </button>
		</div>
	{:else if currentStep === 'edit'}
		<div class="edit-section">
			<h2>抽出データの確認・編集</h2>
			<ExtractionResultEditor data={extractedData} onSave={handleSave} />
		</div>
	{:else if currentStep === 'complete'}
		<div class="complete-section">
			<h2>✅ 保存完了</h2>
			<p>給料明細データが正常に保存されました。</p>
			<button on:click={() => (currentStep = 'upload')}> 新しいPDFをアップロード </button>
		</div>
	{/if}
</div>

<style>
	.pdf-import-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.upload-section,
	.preview-section,
	.edit-section,
	.complete-section {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	h2 {
		margin-bottom: 1.5rem;
		color: #333;
	}

	.error-message {
		color: #e74c3c;
		margin-top: 1rem;
		padding: 0.5rem;
		background: #fee;
		border-radius: 4px;
	}

	button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: #4a90e2;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	button:hover {
		background: #357abd;
	}
</style>
```

#### API実装

```typescript
// src/routes/api/pdf/extract/+server.ts
import { json } from '@sveltejs/kit';
import { PdfParser } from '$entities/pdf/lib/pdfParser';
import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { fileId, extractionTemplate } = await request.json();
	const session = await locals.getSession();

	if (!session) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Supabaseストレージからファイル取得
		const supabase = createClient(
			process.env.PUBLIC_SUPABASE_URL!,
			process.env.PUBLIC_SUPABASE_ANON_KEY!
		);

		const { data: fileData, error: downloadError } = await supabase.storage
			.from('pdf-uploads')
			.download(fileId);

		if (downloadError || !fileData) {
			throw new Error('Failed to download PDF file');
		}

		// PDF解析実行
		const parser = new PdfParser();
		const extractedData = await parser.extractFromBuffer(await fileData.arrayBuffer());

		// 抽出精度の計算（実装簡略化のため固定値）
		const confidence = calculateConfidence(extractedData);

		return json({
			success: true,
			extractedData,
			confidence
		});
	} catch (error) {
		console.error('PDF extraction error:', error);
		return json(
			{
				success: false,
				error: 'Extraction failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

function calculateConfidence(data: any): number {
	// 必須フィールドの存在確認に基づく簡易的な精度計算
	const requiredFields = ['basicSalary', 'totalPayment', 'netPayment', 'paymentDate'];

	const presentFields = requiredFields.filter((field) => data[field] != null);
	return presentFields.length / requiredFields.length;
}
```

## 4. 実装ガイドライン

### 4.1 開発手順

1. **環境準備**

   ```bash
   # 依存関係インストール
   npm install pdf-parse pdfjs-dist

   # Supabaseテーブル作成
   npx supabase migration new create_salary_slips_table
   ```

2. **データモデル実装**
   - Supabaseでテーブル作成
   - 型定義ファイル作成
   - バリデーションスキーマ定義

3. **API層実装**
   - エンドポイント作成
   - エラーハンドリング実装
   - セキュリティチェック追加

4. **UI実装**
   - FSDアーキテクチャに従ってコンポーネント配置
   - リアクティブな状態管理
   - エラー状態の適切な表示

5. **テスト実装**
   - ユニットテスト作成
   - 統合テスト作成
   - E2Eテスト作成

### 4.2 セキュリティ考慮事項

- ファイルサイズ制限（10MB）
- ファイルタイプ検証（PDF only）
- ユーザー認証必須
- XSS対策（抽出データのサニタイズ）
- CSRF対策（SvelteKitのビルトイン機能使用）

### 4.3 パフォーマンス最適化

- PDFプレビューの遅延読み込み
- 大きなPDFファイルの分割処理
- キャッシュ戦略の実装
- Web Workerでの重い処理の実行

### 4.4 エラーハンドリング

- ネットワークエラー時のリトライ
- 部分的な抽出失敗時の手動入力フォールバック
- ユーザーフレンドリーなエラーメッセージ
- エラーログの適切な記録

## 5. テスト計画

### 5.1 ユニットテスト

**PDFパーサーテスト**

```typescript
// src/entities/pdf/lib/pdfParser.test.ts
import { describe, it, expect } from 'vitest';
import { PdfParser } from './pdfParser';

describe('PdfParser', () => {
	it('should extract basic salary from text', () => {
		const parser = new PdfParser();
		const text = '基本給: 250,000円';
		const result = parser.parseText(text);
		expect(result.basicSalary).toBe(250000);
	});

	it('should calculate net payment if missing', () => {
		const parser = new PdfParser();
		const data = {
			totalPayment: 300000,
			totalDeductions: 50000
		};
		const result = parser.validateAndFill(data);
		expect(result.netPayment).toBe(250000);
	});
});
```

### 5.2 統合テスト

**APIエンドポイントテスト**

```typescript
// src/routes/api/pdf/extract/+server.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { POST } from './+server';

describe('PDF Extract API', () => {
	it('should reject unauthorized requests', async () => {
		const request = new Request('http://localhost', {
			method: 'POST',
			body: JSON.stringify({ fileId: 'test' })
		});

		const response = await POST({ request, locals: { getSession: () => null } });
		expect(response.status).toBe(401);
	});
});
```

### 5.3 E2Eテスト

**PDFアップロードフロー**

```typescript
// tests/pdf-import.spec.ts
import { test, expect } from '@playwright/test';

test('PDF upload and extraction flow', async ({ page }) => {
	// ログイン
	await page.goto('/login');
	await page.fill('[name="email"]', 'test@example.com');
	await page.fill('[name="password"]', 'password');
	await page.click('button[type="submit"]');

	// PDFインポートページへ移動
	await page.goto('/dashboard/pdf-import');

	// PDFファイルアップロード
	const fileInput = page.locator('input[type="file"]');
	await fileInput.setInputFiles('tests/fixtures/sample-salary.pdf');

	// プレビューの確認
	await expect(page.locator('.pdf-preview')).toBeVisible();

	// データ抽出
	await page.click('button:has-text("データ抽出を続ける")');

	// 抽出結果の確認
	await expect(page.locator('.extraction-result')).toBeVisible();
	await expect(page.locator('[name="basicSalary"]')).toHaveValue('250000');

	// データ保存
	await page.click('button:has-text("保存")');

	// 完了メッセージの確認
	await expect(page.locator('text=保存完了')).toBeVisible();
});
```

### 5.4 テストデータ

**サンプルPDFファイル準備**

- 正常な給料明細PDF
- 異なるフォーマットのPDF
- 破損したPDF
- PDF以外のファイル

### 5.5 テストカバレッジ目標

- ユニットテスト: 80%以上
- 統合テスト: 70%以上
- E2Eテスト: 主要フロー100%

## 6. デプロイメント

### 6.1 環境変数設定

```env
# .env.local
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PDF_STORAGE_BUCKET=pdf-uploads
MAX_FILE_SIZE=10485760
```

### 6.2 Supabaseセットアップ

```sql
-- Supabase SQLエディタで実行
CREATE TABLE salary_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  overtime_allowance DECIMAL(10, 2),
  commuting_allowance DECIMAL(10, 2),
  other_allowances JSONB,
  health_insurance DECIMAL(10, 2) NOT NULL,
  pension_insurance DECIMAL(10, 2) NOT NULL,
  employment_insurance DECIMAL(10, 2) NOT NULL,
  income_tax DECIMAL(10, 2) NOT NULL,
  resident_tax DECIMAL(10, 2) NOT NULL,
  other_deductions JSONB,
  total_payment DECIMAL(10, 2) NOT NULL,
  total_deductions DECIMAL(10, 2) NOT NULL,
  net_payment DECIMAL(10, 2) NOT NULL,
  pdf_file_url TEXT,
  extraction_confidence FLOAT,
  extraction_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLSポリシー
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own salary slips"
  ON salary_slips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary slips"
  ON salary_slips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary slips"
  ON salary_slips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary slips"
  ON salary_slips FOR DELETE
  USING (auth.uid() = user_id);

-- ストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-uploads', 'pdf-uploads', false);
```

### 6.3 ビルドとデプロイ

```bash
# ビルド
npm run build

# プレビュー
npm run preview

# Vercelへのデプロイ
vercel --prod
```

## 7. 保守・運用

### 7.1 監視項目

- PDF抽出成功率
- 平均処理時間
- エラー発生率
- ストレージ使用量

### 7.2 定期メンテナンス

- 古いPDFファイルの定期削除
- ログファイルのローテーション
- パフォーマンスボトルネックの改善
- セキュリティパッチの適用

### 7.3 改善計画

**フェーズ2（次期バージョン）**

- OCR機能の追加（画像ベースPDF対応）
- 複数PDFの一括処理
- テンプレート学習機能
- データエクスポート機能

**フェーズ3（将来）**

- AIによる自動分類
- 他システムとのAPI連携
- モバイルアプリ対応
- 多言語対応

## 8. 付録

### 8.1 用語集

| 用語 | 説明                                          |
| ---- | --------------------------------------------- |
| PDF  | Portable Document Format                      |
| OCR  | Optical Character Recognition（光学文字認識） |
| FSD  | Feature-Sliced Design                         |
| SSR  | Server-Side Rendering                         |
| RLS  | Row Level Security                            |

### 8.2 参考資料

- [pdf-parse Documentation](https://www.npmjs.com/package/pdf-parse)
- [pdfjs-dist Documentation](https://mozilla.github.io/pdf.js/)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)

### 8.3 変更履歴

| バージョン | 日付       | 変更内容 |
| ---------- | ---------- | -------- |
| 1.0.0      | 2025/01/13 | 初版作成 |

---

**作成者**: Orchestrator-Agent with Claude Code  
**承認者**: [要承認]  
**最終更新**: 2025/01/13

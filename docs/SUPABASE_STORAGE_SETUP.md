# Supabase Storage Setup for PDF Upload

## 1. Supabase管理画面での設定

### ストレージバケットの作成

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. 左サイドバーから「Storage」を選択
4. 「New bucket」ボタンをクリック
5. 以下の設定でバケットを作成：
   - Name: `pdf-uploads`
   - Public bucket: **OFF** (プライベートバケット)
   - File size limit: 10MB
   - Allowed MIME types: `application/pdf`

### RLSポリシーの設定

Storage > Policies から以下のポリシーを追加：

#### 1. Upload Policy (INSERT)

```sql
-- ユーザーが自分のPDFをアップロードできる
CREATE POLICY "Users can upload own PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 2. View Policy (SELECT)

```sql
-- ユーザーが自分のPDFを表示できる
CREATE POLICY "Users can view own PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdf-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 3. Delete Policy (DELETE)

```sql
-- ユーザーが自分のPDFを削除できる
CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdf-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## 2. データベーステーブルの作成

SQL Editorで以下のSQLを実行：

```sql
-- salary_slipsテーブルの作成
CREATE TABLE IF NOT EXISTS salary_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 支給情報
  payment_date DATE NOT NULL,
  basic_salary DECIMAL(10, 2) NOT NULL,
  overtime_allowance DECIMAL(10, 2),
  commuting_allowance DECIMAL(10, 2),
  other_allowances JSONB,

  -- 控除情報
  health_insurance DECIMAL(10, 2) NOT NULL,
  pension_insurance DECIMAL(10, 2) NOT NULL,
  employment_insurance DECIMAL(10, 2) NOT NULL,
  income_tax DECIMAL(10, 2) NOT NULL,
  resident_tax DECIMAL(10, 2) NOT NULL,
  other_deductions JSONB,

  -- 合計
  total_payment DECIMAL(10, 2) NOT NULL,
  total_deductions DECIMAL(10, 2) NOT NULL,
  net_payment DECIMAL(10, 2) NOT NULL,

  -- メタデータ
  pdf_file_url TEXT,
  extraction_confidence FLOAT,
  extraction_method TEXT CHECK (extraction_method IN ('auto', 'manual', 'template')),

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
```

## 3. 動作確認

1. アプリケーションにログイン
2. `/salary/import` ページにアクセス
3. PDFファイルをアップロード
4. Storage > pdf-uploads バケットにファイルが保存されることを確認

## トラブルシューティング

### エラー: "Failed to upload file: Bucket not found"

→ ストレージバケット `pdf-uploads` が作成されていません。上記手順1を実行してください。

### エラー: "Failed to upload file: Policy violation"

→ RLSポリシーが正しく設定されていません。上記のポリシーを追加してください。

### エラー: "Failed to upload file: Payload too large"

→ ファイルサイズが10MBを超えています。小さいファイルを選択してください。

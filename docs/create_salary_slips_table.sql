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

-- RLSポリシーを有効化
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分の給料明細を表示できる
CREATE POLICY "Users can view own salary slips"
  ON salary_slips FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーが自分の給料明細を作成できる
CREATE POLICY "Users can insert own salary slips"
  ON salary_slips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーが自分の給料明細を更新できる
CREATE POLICY "Users can update own salary slips"
  ON salary_slips FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーが自分の給料明細を削除できる
CREATE POLICY "Users can delete own salary slips"
  ON salary_slips FOR DELETE
  USING (auth.uid() = user_id);
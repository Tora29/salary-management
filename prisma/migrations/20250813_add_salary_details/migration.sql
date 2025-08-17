-- 給料テーブルに詳細カラムを追加
ALTER TABLE "salaries" 
ADD COLUMN IF NOT EXISTS "overtime_allowance" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "commuting_allowance" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "health_insurance" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pension_insurance" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "employment_insurance" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "income_tax" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "resident_tax" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_payment" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_deductions" DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "payment_date" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "pdf_file_id" VARCHAR(255);

-- 既存のカラム名を変更（net_salaryをnet_paymentに）
ALTER TABLE "salaries" RENAME COLUMN "net_salary" TO "net_payment";
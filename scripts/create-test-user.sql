-- テストユーザー作成用SQL
-- Supabase Dashboard > SQL Editorで実行してください

-- 注意: この方法でユーザーを作成します
-- 1. まずSupabase Dashboard > Authentication > Usersから手動でユーザーを作成
--    Email: test@example.com
--    Password: Test123456!
-- 2. 作成されたユーザーIDをコピー
-- 3. 以下のSQLでuser_idを置き換えて実行

-- テストユーザーのプロフィール作成（user_idを実際のIDに置き換えてください）
INSERT INTO public.profiles (user_id, name, bio)
VALUES 
  ('YOUR_USER_ID_HERE', '田中太郎', 'テストユーザーです。給料と資産管理のデモ用アカウント。');

-- テストデータ挿入用のプロフィールIDを取得
DO $$
DECLARE
  test_profile_id UUID;
BEGIN
  -- プロフィールIDを取得
  SELECT id INTO test_profile_id FROM public.profiles WHERE name = '田中太郎' LIMIT 1;

  -- 給料データを挿入（過去6ヶ月分）
  INSERT INTO public.salaries (profile_id, year_month, basic_salary, overtime, allowances, deductions, net_salary, notes)
  VALUES 
    (test_profile_id, '2025-01', 300000, 25000, 30000, 65000, 290000, '1月分給与'),
    (test_profile_id, '2024-12', 300000, 45000, 35000, 70000, 310000, '賞与含む'),
    (test_profile_id, '2024-11', 300000, 20000, 30000, 65000, 285000, NULL),
    (test_profile_id, '2024-10', 300000, 30000, 30000, 66000, 294000, NULL),
    (test_profile_id, '2024-09', 300000, 15000, 30000, 64000, 281000, NULL),
    (test_profile_id, '2024-08', 300000, 40000, 30000, 68000, 302000, '夏季手当含む');

  -- 資産データを挿入
  INSERT INTO public.assets (profile_id, asset_type, symbol, name, quantity, purchase_price, current_price, currency, purchase_date, notes)
  VALUES 
    (test_profile_id, 'stock', '7203', 'トヨタ自動車', 100, 2800, 3100, 'JPY', '2024-01-15', '日本株'),
    (test_profile_id, 'stock', '9432', 'NTT', 200, 180, 195, 'JPY', '2024-03-20', '高配当株'),
    (test_profile_id, 'stock', 'AAPL', 'Apple Inc.', 10, 180, 225, 'USD', '2023-11-10', '米国株'),
    (test_profile_id, 'crypto', 'BTC', 'Bitcoin', 0.05, 4500000, 10000000, 'JPY', '2023-06-15', '暗号資産'),
    (test_profile_id, 'cash', NULL, '普通預金', 2500000, 1, 1, 'JPY', '2024-01-01', '三菱UFJ銀行'),
    (test_profile_id, 'bond', NULL, '個人向け国債', 1000000, 1, 1.002, 'JPY', '2024-04-01', '10年変動金利');

  RAISE NOTICE 'テストデータの作成が完了しました。Profile ID: %', test_profile_id;
END $$;
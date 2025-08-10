# インデックス戦略詳細設計書

## 文書情報
- **作成日**: 2025-08-10
- **作成者**: エキスパートデータベース詳細設計アーキテクト
- **バージョン**: 1.0.0
- **ステータス**: 詳細設計フェーズ
- **データベース**: PostgreSQL 15+
- **ORM**: Prisma 5.x

---

## 1. インデックス戦略概要

### 1.1 設計方針

本インデックス戦略は、給料・資産管理システムの特性を考慮した最適化戦略です：

| 戦略 | 目的 | 実装手段 |
|------|------|----------|
| **クエリパターン最適化** | 頻繁なクエリの高速化 | 使用頻度別インデックス設計 |
| **複合インデックス活用** | 多条件検索の効率化 | カラムの選択性を考慮した設計 |
| **カバリングインデックス** | ディスクI/O削減 | INCLUDE句の戦略的活用 |
| **部分インデックス** | インデックスサイズ最適化 | 条件付きインデックスの活用 |
| **インデックス保守自動化** | 継続的なパフォーマンス保持 | 統計情報更新・再構築の自動化 |

### 1.2 クエリパターン分析

#### 主要アクセスパターン

```sql
-- パターン1: ダッシュボード表示 (使用頻度: 極高)
SELECT s.net_pay, s.payment_date, s.total_earnings 
FROM salary_slips s 
WHERE s.user_id = ? 
ORDER BY s.payment_date DESC 
LIMIT 12;

-- パターン2: ポートフォリオサマリー (使用頻度: 極高)
SELECT p.current_value, p.unrealized_gain_loss, sm.name, sm.symbol
FROM stock_portfolios p
JOIN stock_masters sm ON p.stock_id = sm.id
WHERE p.user_id = ? AND p.quantity > 0;

-- パターン3: 月次レポート生成 (使用頻度: 高)
SELECT 
    DATE_TRUNC('month', s.payment_date) as month,
    SUM(s.net_pay) as total_income,
    AVG(s.total_earnings) as avg_earnings
FROM salary_slips s
WHERE s.user_id = ? 
    AND s.payment_date BETWEEN ? AND ?
    AND s.status = 'confirmed'
GROUP BY DATE_TRUNC('month', s.payment_date);

-- パターン4: 全文検索 (使用頻度: 中)
SELECT s.* FROM salary_slips s
WHERE s.user_id = ? 
    AND s.search_vector @@ plainto_tsquery('japanese', ?);

-- パターン5: 株価履歴分析 (使用頻度: 中)
SELECT ph.date, ph.close, ph.volume
FROM stock_price_histories ph
WHERE ph.stock_id = ?
    AND ph.date BETWEEN ? AND ?
ORDER BY ph.date ASC;
```

---

## 2. 基本インデックス戦略

### 2.1 主キーとユニークインデックス

```sql
-- 主キーインデックス（自動作成）
-- users: PRIMARY KEY (id) - BTREE
-- salary_slips: PRIMARY KEY (id) - BTREE
-- stock_masters: PRIMARY KEY (id) - BTREE
-- 等...

-- ユニークインデックス
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX idx_stock_masters_symbol_unique ON stock_masters(symbol);
CREATE UNIQUE INDEX idx_user_sessions_token_unique ON user_sessions(session_token);

-- 複合ユニークインデックス
CREATE UNIQUE INDEX idx_salary_slips_user_payment_company_unique 
ON salary_slips(user_id, payment_date, company_name);

CREATE UNIQUE INDEX idx_stock_portfolios_user_stock_unique 
ON stock_portfolios(user_id, stock_id);

CREATE UNIQUE INDEX idx_stock_current_prices_stock_unique 
ON stock_current_prices(stock_id);

CREATE UNIQUE INDEX idx_stock_price_history_stock_date_unique 
ON stock_price_histories(stock_id, date);
```

### 2.2 外部キーインデックス

```sql
-- 外部キーに対する基本インデックス（参照整合性とJOIN性能向上）
CREATE INDEX idx_salary_slips_user_id ON salary_slips(user_id);
CREATE INDEX idx_salary_slip_attachments_salary_slip_id ON salary_slip_attachments(salary_slip_id);
CREATE INDEX idx_stock_portfolios_user_id ON stock_portfolios(user_id);
CREATE INDEX idx_stock_portfolios_stock_id ON stock_portfolios(stock_id);
CREATE INDEX idx_stock_transactions_portfolio_id ON stock_transactions(portfolio_id);
CREATE INDEX idx_stock_transactions_stock_id ON stock_transactions(stock_id);
CREATE INDEX idx_stock_transactions_user_id ON stock_transactions(user_id);
CREATE INDEX idx_stock_current_prices_stock_id ON stock_current_prices(stock_id);
CREATE INDEX idx_stock_price_histories_stock_id ON stock_price_histories(stock_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX idx_budget_trackings_category_id ON budget_trackings(category_id);
CREATE INDEX idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit.audit_logs(user_id);
```

---

## 3. 複合インデックス設計

### 3.1 ダッシュボード最適化インデックス

```sql
-- 給料明細ダッシュボード用（最も重要）
CREATE INDEX idx_salary_dashboard_primary 
ON salary_slips(user_id, payment_date DESC, status)
INCLUDE (net_pay, total_earnings, total_deductions, company_name);

-- ポートフォリオダッシュボード用
CREATE INDEX idx_portfolio_dashboard_primary
ON stock_portfolios(user_id, quantity)
WHERE quantity > 0
INCLUDE (current_value, unrealized_gain_loss, unrealized_gain_loss_rate, stock_id);

-- 資産サマリー用
CREATE INDEX idx_assets_dashboard_primary
ON assets(user_id, asset_type, currency)
INCLUDE (amount, as_of_date);

-- 最近のアクティビティ用
CREATE INDEX idx_recent_activity_salary
ON salary_slips(user_id, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
INCLUDE (id, company_name, net_pay, status);

CREATE INDEX idx_recent_activity_transactions
ON stock_transactions(user_id, created_at DESC)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
INCLUDE (id, transaction_type, quantity, total_amount, stock_id);
```

### 3.2 レポート生成最適化インデックス

```sql
-- 月次収入レポート
CREATE INDEX idx_monthly_income_report
ON salary_slips(user_id, payment_date DESC, status)
WHERE status = 'confirmed'
INCLUDE (net_pay, total_earnings, total_deductions, currency);

-- 年次収入推移
CREATE INDEX idx_yearly_income_trend
ON salary_slips(user_id, EXTRACT(YEAR FROM payment_date), status)
WHERE status = 'confirmed'
INCLUDE (net_pay, total_earnings);

-- ポートフォリオパフォーマンス
CREATE INDEX idx_portfolio_performance
ON stock_transactions(user_id, transaction_date DESC, transaction_type)
INCLUDE (stock_id, quantity, price_per_share, total_amount);

-- 部門別支出分析（予算）
CREATE INDEX idx_budget_analysis
ON budget_trackings(category_id, transaction_date DESC)
INCLUDE (amount, description, source);

-- 資産配分分析
CREATE INDEX idx_asset_allocation_analysis
ON assets(user_id, asset_type, currency)
INCLUDE (amount, as_of_date, name);
```

### 3.3 検索・フィルタリング最適化インデックス

```sql
-- 給料明細の詳細検索
CREATE INDEX idx_salary_detailed_search
ON salary_slips(user_id, company_name, status, payment_date DESC);

CREATE INDEX idx_salary_amount_range
ON salary_slips(user_id, net_pay DESC, payment_date DESC)
WHERE status = 'confirmed';

-- 株式検索・フィルタリング
CREATE INDEX idx_stock_search
ON stock_masters(exchange, sector, is_active)
WHERE is_active = true
INCLUDE (symbol, name, currency);

CREATE INDEX idx_stock_market_cap_range
ON stock_masters(market_cap DESC, exchange)
WHERE is_active = true AND market_cap IS NOT NULL;

-- 取引履歴検索
CREATE INDEX idx_transaction_search
ON stock_transactions(user_id, transaction_type, transaction_date DESC);

CREATE INDEX idx_transaction_amount_range
ON stock_transactions(user_id, total_amount DESC, transaction_date DESC);

-- 予算追跡検索
CREATE INDEX idx_budget_tracking_search
ON budget_trackings(category_id, source, transaction_date DESC);
```

---

## 4. 特殊インデックス設計

### 4.1 全文検索インデックス（GIN）

```sql
-- 給料明細全文検索
CREATE INDEX idx_salary_slips_fulltext_search
ON salary_slips
USING GIN(search_vector);

-- search_vectorの更新トリガーは既に定義済み

-- ユーザー設定検索（JSONB）
CREATE INDEX idx_user_preferences_search
ON users
USING GIN(preferences jsonb_path_ops);

-- 特定のJSONBフィールドへの高速アクセス
CREATE INDEX idx_user_preferences_currency
ON users
USING GIN((preferences->'defaultCurrency'));

-- 給料明細のJSONBフィールド検索
CREATE INDEX idx_salary_earnings_search
ON salary_slips
USING GIN(earnings jsonb_path_ops);

CREATE INDEX idx_salary_deductions_search
ON salary_slips
USING GIN(deductions jsonb_path_ops);

-- 特定の収入項目検索
CREATE INDEX idx_salary_base_salary_jsonb
ON salary_slips
USING GIN((earnings->'baseSalary'));

CREATE INDEX idx_salary_overtime_jsonb
ON salary_slips
USING GIN((earnings->'overtimePay'));

-- 株式メタデータ検索
CREATE INDEX idx_stock_metadata_search
ON stock_masters
USING GIN(metadata jsonb_path_ops)
WHERE metadata IS NOT NULL;

-- 資産メタデータ検索
CREATE INDEX idx_asset_metadata_search
ON assets
USING GIN(metadata jsonb_path_ops)
WHERE metadata IS NOT NULL;
```

### 4.2 部分インデックス（WHERE句付き）

```sql
-- アクティブレコードのみのインデックス
CREATE INDEX idx_active_users_only
ON users(email, last_login_at DESC)
WHERE is_active = true;

CREATE INDEX idx_active_stocks_only
ON stock_masters(symbol, exchange, sector)
WHERE is_active = true;

CREATE INDEX idx_current_portfolios_only
ON stock_portfolios(user_id, current_value DESC)
WHERE quantity > 0;

-- 最近のデータのみのインデックス
CREATE INDEX idx_recent_salary_slips_only
ON salary_slips(user_id, payment_date DESC)
WHERE payment_date >= CURRENT_DATE - INTERVAL '2 years';

CREATE INDEX idx_recent_transactions_only
ON stock_transactions(user_id, transaction_date DESC)
WHERE transaction_date >= CURRENT_DATE - INTERVAL '3 years';

CREATE INDEX idx_recent_price_updates_only
ON stock_current_prices(last_updated DESC, stock_id)
WHERE last_updated >= CURRENT_DATE - INTERVAL '7 days';

-- ステータス別インデックス
CREATE INDEX idx_confirmed_salary_slips_only
ON salary_slips(user_id, payment_date DESC, net_pay DESC)
WHERE status = 'confirmed';

CREATE INDEX idx_draft_salary_slips_only
ON salary_slips(user_id, created_at DESC)
WHERE status = 'draft';

CREATE INDEX idx_active_budgets_only
ON budgets(user_id, end_date DESC)
WHERE status = 'active';

-- 高価値ポートフォリオのインデックス
CREATE INDEX idx_high_value_portfolios_only
ON stock_portfolios(user_id, current_value DESC, unrealized_gain_loss_rate DESC)
WHERE current_value >= 100000 AND quantity > 0;

-- エラー系データの特別インデックス
CREATE INDEX idx_poor_data_quality_prices
ON stock_current_prices(stock_id, last_updated DESC)
WHERE data_quality IN ('warning', 'poor');
```

### 4.3 BRIN インデックス（大量データ用）

```sql
-- 時系列データ用のBRINインデックス（パーティションテーブル用）
CREATE INDEX idx_salary_slips_payment_date_brin
ON salary_slips
USING BRIN(payment_date)
WITH (pages_per_range = 128);

CREATE INDEX idx_stock_price_histories_date_brin
ON stock_price_histories
USING BRIN(date, stock_id)
WITH (pages_per_range = 128);

CREATE INDEX idx_audit_logs_created_brin
ON audit.audit_logs
USING BRIN(created_at)
WITH (pages_per_range = 64);

-- 順序相関の高いデータのBRIN
CREATE INDEX idx_stock_transactions_created_brin
ON stock_transactions
USING BRIN(created_at, user_id)
WITH (pages_per_range = 128);
```

---

## 5. カバリングインデックス戦略

### 5.1 高頻度クエリのカバリングインデックス

```sql
-- ダッシュボード用カバリングインデックス
CREATE INDEX idx_dashboard_salary_full_cover
ON salary_slips(user_id, payment_date DESC)
INCLUDE (id, company_name, employee_name, net_pay, total_earnings, total_deductions, 
         currency, status, created_at);

CREATE INDEX idx_dashboard_portfolio_full_cover
ON stock_portfolios(user_id)
WHERE quantity > 0
INCLUDE (id, stock_id, quantity, current_value, unrealized_gain_loss, 
         unrealized_gain_loss_rate, first_purchase_date, last_purchase_date);

-- リスト表示用カバリングインデックス
CREATE INDEX idx_salary_list_cover
ON salary_slips(user_id, payment_date DESC, status)
INCLUDE (id, company_name, net_pay, currency, source_type, created_at);

CREATE INDEX idx_transaction_list_cover
ON stock_transactions(user_id, transaction_date DESC)
INCLUDE (id, transaction_type, quantity, price_per_share, total_amount, 
         commission, tax, stock_id, notes);

-- 統計計算用カバリングインデックス
CREATE INDEX idx_salary_stats_cover
ON salary_slips(user_id, status)
WHERE status = 'confirmed'
INCLUDE (net_pay, total_earnings, total_deductions, payment_date, currency);

CREATE INDEX idx_portfolio_stats_cover
ON stock_portfolios(user_id)
WHERE quantity > 0
INCLUDE (current_value, total_investment, unrealized_gain_loss, stock_id);
```

### 5.2 JOIN最適化カバリングインデックス

```sql
-- Portfolio + StockMaster JOIN用
CREATE INDEX idx_portfolio_stock_join_cover
ON stock_portfolios(stock_id, user_id)
WHERE quantity > 0
INCLUDE (id, quantity, current_value, unrealized_gain_loss, unrealized_gain_loss_rate);

CREATE INDEX idx_stock_master_join_cover
ON stock_masters(id, is_active)
WHERE is_active = true
INCLUDE (symbol, name, exchange, sector, currency);

-- Transaction + Portfolio JOIN用
CREATE INDEX idx_transaction_portfolio_join_cover
ON stock_transactions(portfolio_id, transaction_date DESC)
INCLUDE (id, transaction_type, quantity, price_per_share, total_amount, 
         user_id, stock_id);

-- Budget関連JOIN用
CREATE INDEX idx_budget_category_join_cover
ON budget_categories(budget_id, category_type)
INCLUDE (id, category_name, allocated_amount, actual_amount, variance, 
         display_order);

CREATE INDEX idx_budget_tracking_join_cover
ON budget_trackings(category_id, transaction_date DESC)
INCLUDE (id, amount, description, source);
```

---

## 6. パーティション別インデックス戦略

### 6.1 時系列パーティションのインデックス

```sql
-- 給料明細パーティション（年別）のインデックス
CREATE INDEX idx_salary_slips_2024_user_date 
ON salary_slips_2024(user_id, payment_date DESC);

CREATE INDEX idx_salary_slips_2025_user_date 
ON salary_slips_2025(user_id, payment_date DESC);

CREATE INDEX idx_salary_slips_2026_user_date 
ON salary_slips_2026(user_id, payment_date DESC);

-- カバリングインデックス（パーティション用）
CREATE INDEX idx_salary_slips_2024_cover 
ON salary_slips_2024(user_id, payment_date DESC)
INCLUDE (net_pay, total_earnings, company_name, status);

CREATE INDEX idx_salary_slips_2025_cover 
ON salary_slips_2025(user_id, payment_date DESC)
INCLUDE (net_pay, total_earnings, company_name, status);

-- 株価履歴パーティション（年別）のインデックス
CREATE INDEX idx_stock_price_histories_2024_stock_date 
ON stock_price_histories_2024(stock_id, date DESC);

CREATE INDEX idx_stock_price_histories_2025_stock_date 
ON stock_price_histories_2025(stock_id, date DESC);

CREATE INDEX idx_stock_price_histories_2026_stock_date 
ON stock_price_histories_2026(stock_id, date DESC);

-- 技術指標用インデックス
CREATE INDEX idx_stock_price_histories_2024_indicators 
ON stock_price_histories_2024(stock_id, date DESC)
INCLUDE (close, sma20, sma50, rsi);

CREATE INDEX idx_stock_price_histories_2025_indicators 
ON stock_price_histories_2025(stock_id, date DESC)
INCLUDE (close, sma20, sma50, rsi);

-- 監査ログパーティション（月別）のインデックス
DO $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    FOR i IN 0..12 LOOP
        start_date := date_trunc('month', CURRENT_DATE) + (i - 6) * INTERVAL '1 month';
        partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
        
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_user_date 
            ON audit.%s(user_id, created_at DESC)
        ', partition_name, partition_name);
        
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%s_entity 
            ON audit.%s(entity_type, entity_id, created_at DESC)
        ', partition_name, partition_name);
    END LOOP;
END $$;
```

---

## 7. インデックス保守・監視戦略

### 7.1 統計情報管理

```sql
-- 統計情報の自動更新設定
ALTER TABLE users SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE salary_slips SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE stock_portfolios SET (autovacuum_analyze_scale_factor = 0.05);
ALTER TABLE stock_transactions SET (autovacuum_analyze_scale_factor = 0.1);
ALTER TABLE stock_price_histories SET (autovacuum_analyze_scale_factor = 0.2);

-- 手動統計情報更新関数
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('public', 'audit')
    LOOP
        EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
        RAISE NOTICE 'Analyzed table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 7.2 インデックス使用状況監視

```sql
-- インデックス使用統計ビュー
CREATE VIEW v_index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'LOW_USAGE'
        WHEN idx_scan < 100 THEN 'MEDIUM_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC, pg_relation_size(indexrelid) DESC;

-- 重複・冗長インデックス検出
CREATE VIEW v_duplicate_indexes AS
WITH index_columns AS (
    SELECT 
        i.indexrelid,
        i.indrelid,
        n.nspname as schema_name,
        t.relname as table_name,
        c.relname as index_name,
        array_agg(a.attname ORDER BY k.n) as columns
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN lateral unnest(i.indkey) WITH ORDINALITY k(attnum, n) ON true
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
    WHERE i.indisprimary = false
    GROUP BY i.indexrelid, i.indrelid, n.nspname, t.relname, c.relname
)
SELECT 
    ic1.schema_name,
    ic1.table_name,
    ic1.index_name as index1,
    ic2.index_name as index2,
    ic1.columns
FROM index_columns ic1
JOIN index_columns ic2 ON ic1.indrelid = ic2.indrelid 
    AND ic1.columns = ic2.columns 
    AND ic1.indexrelid < ic2.indexrelid;

-- パフォーマンスが悪いクエリの特定
CREATE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE mean_time > 100 -- 100ms以上のクエリ
ORDER BY mean_time DESC;
```

### 7.3 インデックス最適化プロシージャ

```sql
-- インデックスの再構築（オンライン）
CREATE OR REPLACE FUNCTION rebuild_indexes_concurrently()
RETURNS TABLE (
    schema_name text,
    table_name text,
    index_name text,
    action text,
    result text
) AS $$
DECLARE
    index_record RECORD;
    rebuild_sql TEXT;
BEGIN
    FOR index_record IN
        SELECT 
            n.nspname as schema_name,
            t.relname as table_name,
            c.relname as index_name,
            pg_relation_size(c.oid) as index_size
        FROM pg_class c
        JOIN pg_index i ON c.oid = i.indexrelid
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE c.relkind = 'i'
            AND n.nspname IN ('public', 'audit')
            AND NOT i.indisprimary
            AND NOT i.indisunique
            AND pg_relation_size(c.oid) > 100 * 1024 * 1024 -- 100MB以上
    LOOP
        BEGIN
            rebuild_sql := format('REINDEX INDEX CONCURRENTLY %I.%I', 
                                index_record.schema_name, index_record.index_name);
            EXECUTE rebuild_sql;
            
            RETURN QUERY SELECT 
                index_record.schema_name,
                index_record.table_name,
                index_record.index_name,
                'REBUILD'::text,
                'SUCCESS'::text;
                
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                index_record.schema_name,
                index_record.table_name,
                index_record.index_name,
                'REBUILD'::text,
                'FAILED: ' || SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 未使用インデックスの特定と削除提案
CREATE OR REPLACE FUNCTION identify_unused_indexes()
RETURNS TABLE (
    schema_name text,
    table_name text,
    index_name text,
    size_pretty text,
    drop_statement text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text,
        tablename::text,
        indexname::text,
        pg_size_pretty(pg_relation_size(indexrelid))::text,
        format('DROP INDEX IF EXISTS %I.%I;', schemaname, indexname)::text
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
        AND schemaname IN ('public', 'audit')
        AND pg_relation_size(indexrelid) > 10 * 1024 * 1024 -- 10MB以上
        AND indexname NOT LIKE '%_pkey' -- 主キーは除外
        AND indexname NOT LIKE '%_unique' -- ユニーク制約は除外
    ORDER BY pg_relation_size(indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. 環境別インデックス戦略

### 8.1 開発環境

```sql
-- 開発環境用の軽量インデックス
-- 必要最小限のインデックスのみ作成

-- 基本的な外部キーインデックス
CREATE INDEX IF NOT EXISTS idx_dev_salary_slips_user_id ON salary_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_stock_portfolios_user_id ON stock_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_stock_transactions_user_id ON stock_transactions(user_id);

-- 基本的な検索インデックス
CREATE INDEX IF NOT EXISTS idx_dev_salary_slips_payment_date ON salary_slips(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_dev_stock_masters_symbol ON stock_masters(symbol);
```

### 8.2 ステージング環境

```sql
-- ステージング環境用（本番環境のサブセット）
-- 主要なパフォーマンステスト用インデックス

-- 重要なカバリングインデックス
CREATE INDEX IF NOT EXISTS idx_stage_dashboard_salary ON salary_slips(user_id, payment_date DESC)
INCLUDE (net_pay, total_earnings, company_name, status);

CREATE INDEX IF NOT EXISTS idx_stage_dashboard_portfolio ON stock_portfolios(user_id)
WHERE quantity > 0
INCLUDE (current_value, unrealized_gain_loss, stock_id);

-- 検索性能テスト用
CREATE INDEX IF NOT EXISTS idx_stage_salary_fulltext ON salary_slips
USING GIN(search_vector);
```

### 8.3 本番環境

```sql
-- 本番環境用の完全なインデックス戦略
-- 上記で定義した全インデックスを適用

-- 本番環境専用の監視インデックス
CREATE INDEX idx_prod_performance_monitoring 
ON salary_slips(created_at DESC, user_id)
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX idx_prod_error_tracking 
ON stock_current_prices(last_updated DESC, data_quality)
WHERE data_quality IN ('warning', 'poor');

-- 本番バックアップ用インデックス
CREATE INDEX idx_prod_backup_checkpoint 
ON salary_slips(updated_at DESC)
WHERE updated_at >= CURRENT_DATE - INTERVAL '1 day';
```

---

## 9. クエリ最適化例

### 9.1 Before/After 比較

#### ダッシュボードクエリの最適化

```sql
-- BEFORE: 非最適化クエリ
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.id, s.company_name, s.net_pay, s.payment_date
FROM salary_slips s
WHERE s.user_id = 'cm3k8n4r90001oe6v8h7x2p1q'
ORDER BY s.payment_date DESC
LIMIT 12;

-- Query plan (estimated):
-- Seq Scan on salary_slips s (cost=0.00..1580.00 rows=12 width=50)
--   Filter: (user_id = 'cm3k8n4r90001oe6v8h7x2p1q')
--   Rows Removed by Filter: 7988

-- AFTER: インデックス最適化後
-- 使用インデックス: idx_dashboard_salary_full_cover

-- Query plan (optimized):
-- Index Scan using idx_dashboard_salary_full_cover on salary_slips s 
--   (cost=0.15..45.23 rows=12 width=50)
--   Index Cond: (user_id = 'cm3k8n4r90001oe6v8h7x2p1q')
```

#### ポートフォリオJOINクエリの最適化

```sql
-- BEFORE: 非最適化JOIN
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.current_value, p.unrealized_gain_loss, sm.name, sm.symbol
FROM stock_portfolios p
JOIN stock_masters sm ON p.stock_id = sm.id
WHERE p.user_id = 'cm3k8n4r90001oe6v8h7x2p1q' AND p.quantity > 0;

-- AFTER: カバリングインデックス最適化後
-- 使用インデックス: idx_portfolio_stock_join_cover, idx_stock_master_join_cover

-- パフォーマンス改善例:
-- 実行時間: 125ms → 3ms (約40倍高速化)
-- バッファ使用量: 1,250 pages → 15 pages (約80倍削減)
```

### 9.2 N+1問題の解決

```sql
-- N+1問題のあるクエリパターンの最適化

-- BEFORE: N+1問題発生
-- 1. SELECT * FROM stock_portfolios WHERE user_id = ?
-- 2. SELECT * FROM stock_masters WHERE id = ? (N回実行)

-- AFTER: 単一クエリ化 + カバリングインデックス
SELECT 
    p.id, p.current_value, p.unrealized_gain_loss, p.quantity,
    sm.name, sm.symbol, sm.exchange, sm.sector
FROM stock_portfolios p
JOIN stock_masters sm ON p.stock_id = sm.id
WHERE p.user_id = ? AND p.quantity > 0;

-- 使用インデックス: 
-- - idx_portfolio_stock_join_cover (stock_portfolios)
-- - idx_stock_master_join_cover (stock_masters)
```

---

## 10. パフォーマンス監視とアラート

### 10.1 監視クエリ

```sql
-- インデックス効率性監視
CREATE VIEW v_index_efficiency AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    CASE 
        WHEN idx_scan = 0 THEN 0
        ELSE round((idx_tup_read::numeric / idx_scan), 2)
    END as avg_tuples_per_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname IN ('public', 'audit')
ORDER BY idx_scan DESC;

-- テーブルスキャン監視
CREATE VIEW v_table_scan_monitoring AS
SELECT 
    schemaname,
    relname as tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    CASE 
        WHEN seq_scan + idx_scan = 0 THEN 0
        ELSE round((seq_scan::numeric / (seq_scan + idx_scan) * 100), 2)
    END as seq_scan_percentage
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'audit')
ORDER BY seq_scan DESC;

-- クエリパフォーマンス監視
CREATE VIEW v_query_performance AS
SELECT 
    left(query, 100) as query_preview,
    calls,
    total_time,
    round((total_time / calls)::numeric, 2) as avg_time_per_call,
    max_time,
    round(((100.0 * shared_blks_hit) / nullif(shared_blks_hit + shared_blks_read, 0))::numeric, 2) as hit_ratio_percent
FROM pg_stat_statements
WHERE calls > 10
ORDER BY avg_time_per_call DESC;
```

### 10.2 自動アラート関数

```sql
-- パフォーマンス劣化検出
CREATE OR REPLACE FUNCTION check_index_performance()
RETURNS TABLE (
    alert_level text,
    message text,
    recommendation text
) AS $$
DECLARE
    slow_query_count INTEGER;
    unused_index_count INTEGER;
    large_seq_scan_count INTEGER;
BEGIN
    -- 遅いクエリの検出
    SELECT COUNT(*) INTO slow_query_count
    FROM pg_stat_statements
    WHERE mean_time > 500 AND calls > 100;
    
    IF slow_query_count > 10 THEN
        RETURN QUERY SELECT 
            'HIGH'::text,
            format('Found %s slow queries (>500ms avg)', slow_query_count)::text,
            'Review query performance and consider adding indexes'::text;
    END IF;
    
    -- 未使用インデックスの検出
    SELECT COUNT(*) INTO unused_index_count
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND pg_relation_size(indexrelid) > 50 * 1024 * 1024;
    
    IF unused_index_count > 5 THEN
        RETURN QUERY SELECT 
            'MEDIUM'::text,
            format('Found %s large unused indexes (>50MB)', unused_index_count)::text,
            'Consider dropping unused indexes to save space'::text;
    END IF;
    
    -- 大量シーケンシャルスキャンの検出
    SELECT COUNT(*) INTO large_seq_scan_count
    FROM pg_stat_user_tables
    WHERE seq_scan > idx_scan * 2 AND seq_tup_read > 100000;
    
    IF large_seq_scan_count > 0 THEN
        RETURN QUERY SELECT 
            'HIGH'::text,
            format('Found %s tables with excessive sequential scans', large_seq_scan_count)::text,
            'Add appropriate indexes for frequently scanned tables'::text;
    END IF;
    
    -- 正常状態
    IF slow_query_count <= 10 AND unused_index_count <= 5 AND large_seq_scan_count = 0 THEN
        RETURN QUERY SELECT 
            'OK'::text,
            'All index performance metrics are within normal ranges'::text,
            'Continue monitoring'::text;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 定期実行スケジュール（pg_cronが利用可能な場合）
-- SELECT cron.schedule('index-performance-check', '0 8 * * *', 'SELECT * FROM check_index_performance();');
```

---

## 11. 次のステップ

1. ✅ パフォーマンス最適化のインデックス戦略と複合インデックス設計（本書）
2. → データアクセスパターン最適化とN+1問題回避策

---

## 承認

| 役割 | 名前 | 日付 | 署名 |
|------|------|------|------|
| データベースアーキテクト | エキスパートデータベース詳細設計アーキテクト | 2025-08-10 | ✅ |
| レビュアー | - | - | [ ] |
| 承認者 | - | - | [ ] |

---

**改訂履歴**

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|----------|---------|
| 1.0.0 | 2025-08-10 | 初版作成 | エキスパートデータベース詳細設計アーキテクト |
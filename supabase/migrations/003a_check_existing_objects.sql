-- 既存のテーブルとポリシーを確認するクエリ

-- 1. requests関連のテーブルが存在するか確認
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'requests'
) as requests_table_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'responses'
) as responses_table_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'drugs'
) as drugs_table_exists;

-- 2. RLSポリシーが存在するか確認
SELECT pol.polname as policy_name, 
       tab.relname as table_name
FROM pg_policy pol
JOIN pg_class tab ON pol.polrelid = tab.oid
WHERE tab.relname IN ('requests', 'responses', 'drugs')
ORDER BY tab.relname, pol.polname;

-- 3. 拡張機能が有効か確認
SELECT EXISTS (
    SELECT FROM pg_extension 
    WHERE extname = 'pg_trgm'
) as pg_trgm_enabled;

-- 4. トリガーが存在するか確認
SELECT tgname as trigger_name,
       relname as table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE relname IN ('responses')
AND tgname = 'update_patient_counts_on_response';
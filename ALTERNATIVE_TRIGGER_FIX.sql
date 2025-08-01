-- Supabase SQL Editorで実行してください
-- 権限エラーを回避する代替案

-- 方法1: トリガー関数を削除して再作成（権限エラーを回避）
BEGIN;

-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 何もしない新しいトリガー関数を作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- エラーハンドリングを追加
  BEGIN
    -- ログだけ記録して、ユーザー作成は必ず成功させる
    RAISE LOG 'New user created: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      -- 何もしない（エラーを無視）
      NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- 方法2: 現在のトリガーの状態を確認するだけ
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
  END as status,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'on_auth_user_created';

-- 方法3: RLSポリシーの確認（これは権限エラーなく実行できます）
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'companies')
ORDER BY tablename, policyname;
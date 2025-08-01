-- Supabase SQL Editorで実行してください

-- 1. 現在のトリガーの状態を確認
SELECT 
  tgname as trigger_name,
  tgenabled as enabled_status,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. トリガーを一時的に無効化
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 3. 無効化されたことを確認
SELECT 
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 注意: テスト後は以下のコマンドでトリガーを再度有効化してください
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
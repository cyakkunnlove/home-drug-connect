-- Supabase SQL Editorで実行してください

-- 1. handle_new_user関数のソースコードを表示
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as full_definition,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'handle_new_user'
LIMIT 1;

-- 2. auth.usersの最新5件を確認（メールアドレスでマスク）
SELECT 
  id,
  SUBSTRING(email, 1, 3) || '***@' || SPLIT_PART(email, '@', 2) as masked_email,
  created_at,
  raw_user_meta_data->>'role' as meta_role
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. public.usersの最新5件を確認
SELECT 
  id,
  SUBSTRING(email, 1, 3) || '***@' || SPLIT_PART(email, '@', 2) as masked_email,
  role,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. auth.usersにあってpublic.usersにないレコードを確認
SELECT 
  au.id,
  SUBSTRING(au.email, 1, 3) || '***@' || SPLIT_PART(au.email, '@', 2) as masked_email,
  au.created_at as auth_created,
  au.raw_user_meta_data->>'role' as intended_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 5. トリガーの実行状態を確認
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'on_auth_user_created';

-- 6. RLSポリシーの確認（usersテーブル）
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 7. companiesテーブルのRLSポリシー
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY policyname;
-- Supabase SQL Editorで実行してください

-- 1. handle_new_user関数の定義を確認
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. 最近のエラーログを確認（もしあれば）
-- Supabase Dashboard → Logs → Postgres で確認することもできます

-- 3. usersテーブルとcompaniesテーブルのデータを確認
SELECT COUNT(*) as user_count FROM public.users;
SELECT COUNT(*) as company_count FROM public.companies;

-- 4. 最新のusersレコードを確認（最近登録を試みたものがあるか）
SELECT 
  id,
  email,
  role,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 5. auth.usersとpublic.usersの不一致を確認
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  pu.id as public_user_id,
  pu.created_at as public_created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
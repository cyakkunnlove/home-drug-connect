-- Supabaseの現在の状態を確認

-- 1. auth.usersとpublic.usersの同期状況
SELECT 
  'Auth users total' as description,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Public users total' as description,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Missing in public.users' as description,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. 最新のユーザー（作成日順）
SELECT 
  au.id,
  SUBSTRING(au.email, 1, 3) || '***' as masked_email,
  au.created_at as auth_created,
  pu.created_at as public_created,
  pu.role,
  pu.company_id
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 3. 会社データの確認
SELECT 
  id,
  name,
  status,
  created_at
FROM companies
ORDER BY created_at DESC
LIMIT 10;

-- 4. トリガー関数の現在の定義を確認
SELECT 
  pg_get_functiondef(oid) as full_definition
FROM pg_proc 
WHERE proname = 'handle_new_user'
LIMIT 1;
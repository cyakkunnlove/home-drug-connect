-- 特定のユーザーのroleを医師に更新
UPDATE public.users
SET 
  role = 'doctor',
  updated_at = now()
WHERE email = 'cyakkunnlove@gmail.com';

-- 確認用クエリ
SELECT id, email, role, organization_name, company_id, created_at, updated_at
FROM public.users
WHERE email = 'cyakkunnlove@gmail.com';
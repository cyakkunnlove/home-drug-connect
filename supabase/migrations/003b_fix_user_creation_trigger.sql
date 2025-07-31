-- ユーザー作成トリガーを修正
-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 新しいトリガー関数を作成（既存の場合は置き換え）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'pharmacy_admin')::user_role,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 既存のユーザーでusersテーブルにレコードがない場合の修正
-- 医師として登録したユーザーのレコードを手動で作成
INSERT INTO public.users (id, email, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'doctor'::user_role,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email = 'cyakkunnlove@gmail.com'
ON CONFLICT (id) DO NOTHING;
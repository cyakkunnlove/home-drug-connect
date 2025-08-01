-- Supabase SQL Editorで実行してください

-- 1. 現在のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 修正されたトリガー関数を作成（型キャストエラーを回避）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- エラーハンドリングを追加
  BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email,
      -- 型キャストを安全に行う
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
          NEW.raw_user_meta_data->>'role'
        ELSE
          'pharmacy_admin'
      END::user_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  EXCEPTION
    WHEN OTHERS THEN
      -- エラーが発生してもユーザー作成は成功させる
      RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
      -- エラーログを残すが、トリガーは成功として処理
      INSERT INTO public.users (id, email, role, created_at, updated_at)
      VALUES (
        NEW.id, 
        NEW.email,
        'pharmacy_admin'::user_role, -- デフォルト値を使用
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 確認：auth.usersにあってpublic.usersにないレコードを修復
DO $$
DECLARE
  missing_user RECORD;
BEGIN
  FOR missing_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.users (id, email, role, created_at, updated_at)
      VALUES (
        missing_user.id,
        missing_user.email,
        COALESCE(
          missing_user.raw_user_meta_data->>'role',
          'pharmacy_admin'
        )::user_role,
        NOW(),
        NOW()
      );
      RAISE NOTICE 'Fixed missing user: %', missing_user.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not fix user %: %', missing_user.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- 5. 最終確認
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
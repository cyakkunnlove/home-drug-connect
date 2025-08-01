-- Supabase SQL Editorで実行してください

-- 1. まず、現在のトリガーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 修正されたトリガー関数を作成（型キャストを修正）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- エラーハンドリングを追加
  BEGIN
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
      NEW.id, 
      NEW.email,
      -- 型キャストを修正（publicスキーマを明示）
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
          (NEW.raw_user_meta_data->>'role')::public.user_role
        ELSE
          'pharmacy_admin'::public.user_role
      END,
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
        'pharmacy_admin'::public.user_role, -- デフォルト値を使用（publicスキーマを明示）
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. トリガーを再作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. 確認：user_role型が正しく使用できるかテスト
DO $$
DECLARE
  test_role public.user_role;
BEGIN
  test_role := 'pharmacy_admin'::public.user_role;
  RAISE NOTICE 'user_role型のテスト成功: %', test_role;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'user_role型のテスト失敗: %', SQLERRM;
END $$;
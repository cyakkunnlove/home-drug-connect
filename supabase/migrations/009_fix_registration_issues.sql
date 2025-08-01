-- 1. companiesテーブルの作成（まだ存在しない場合）
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    headquarters_phone TEXT,
    headquarters_email TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- companiesテーブルにcompany_idカラムを追加（まだ存在しない場合）
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- 2. users テーブルに医師用のカラムを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clinic_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS medical_license_number TEXT;

-- 3. user_role enumに'doctor'を追加（まだ存在しない場合）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'doctor' AND enumtypid = 'user_role'::regtype::oid) THEN
        ALTER TYPE user_role ADD VALUE 'doctor';
    END IF;
END $$;

-- 4. RLS ポリシーを有効化
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 5. companiesテーブルのRLSポリシー
-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

-- 認証されたユーザーは会社を作成できる
CREATE POLICY "Authenticated users can create companies" 
ON public.companies FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ユーザーは自分の会社を表示できる
CREATE POLICY "Users can view their own company" 
ON public.companies FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.company_id = companies.id 
        AND users.id = auth.uid()
    )
);

-- ユーザーは自分の会社を更新できる
CREATE POLICY "Users can update their own company" 
ON public.companies FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.company_id = companies.id 
        AND users.id = auth.uid()
    )
);

-- 6. usersテーブルのINSERTポリシーを追加
-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Handle trigger user creation" ON public.users;

CREATE POLICY "Service role can insert users" 
ON public.users FOR INSERT 
TO service_role 
WITH CHECK (true);

-- トリガー関数でユーザーが作成されるため、これも必要
CREATE POLICY "Handle trigger user creation" 
ON public.users FOR INSERT 
WITH CHECK (id = auth.uid());

-- 7. pharmaciesテーブルの位置情報カラムを修正（NULLを許可）
ALTER TABLE public.pharmacies ALTER COLUMN location DROP NOT NULL;

-- 8. 薬局詳細ページ用のビューを作成（location座標の順序を修正）
CREATE OR REPLACE VIEW public.pharmacy_details AS
SELECT 
    p.*,
    ST_Y(p.location::geometry) as lat,
    ST_X(p.location::geometry) as lng,
    CASE 
        WHEN p.location IS NOT NULL THEN 
            json_build_object(
                'type', 'Point',
                'coordinates', ARRAY[ST_X(p.location::geometry), ST_Y(p.location::geometry)]
            )
        ELSE NULL
    END as location_json
FROM public.pharmacies p;

-- 9. pharmacy_detailsビューのRLSポリシー
GRANT SELECT ON public.pharmacy_details TO authenticated, anon;

-- 10. 既存のトリガー関数を更新（companiesテーブルとの整合性）
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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. pharmacies テーブルのインサート時に位置情報を設定するトリガー
CREATE OR REPLACE FUNCTION public.set_pharmacy_location()
RETURNS trigger AS $$
BEGIN
  -- 住所から位置情報を取得する処理は後でアプリケーション側で実装
  -- ここでは一旦NULLを許可
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS set_pharmacy_location_trigger ON public.pharmacies;

-- 新しいトリガーを作成
CREATE TRIGGER set_pharmacy_location_trigger
  BEFORE INSERT OR UPDATE ON public.pharmacies
  FOR EACH ROW EXECUTE FUNCTION public.set_pharmacy_location();
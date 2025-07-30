# テストアカウント情報

## 作成済みテストアカウント

**作成日時**: 2025-07-30T09:25:21Z
**ユーザーID**: d7d07fff-08ca-43eb-a22f-3a4080d34c7f

### ログイン情報
- **メールアドレス**: test-pharmacy-2025@testmail.com
- **パスワード**: Test1234!

### 会社情報（手動で作成が必要）
- **会社名**: テスト薬局株式会社
- **電話番号**: 03-1234-5678

⚠️ **注意**: このアカウントは認証メールの確認が必要です。また、会社と薬局のデータは別途Supabaseダッシュボードで作成する必要があります。

## 新規作成済みテストアカウント（2回目）

**作成日時**: 2025-07-30T09:59:41Z
**ユーザーID**: 3ff7860d-f5a3-4943-add6-fad13faf9973

### ログイン情報
- **メールアドレス**: test-pharmacy-demo@gmail.com
- **パスワード**: Test1234!
- **状態**: メール確認済み（即座にログイン可能）

### 会社情報（ユーザーメタデータに保存済み）
- **会社名**: テスト薬局株式会社
- **電話番号**: 03-1234-5678

⚠️ **注意**: 会社と薬局のデータは、初回ログイン後にダッシュボードから作成してください。

---

## テストアカウントの作成方法

### 方法1: Webインターフェースから作成（推奨）

1. https://home-drug-connect-9dxudw55w-cyakkunnloves-projects.vercel.app/pharmacy/register にアクセス
2. 以下の情報で新規登録:
   - **メールアドレス**: test@example.com
   - **パスワード**: Test1234!
   - **会社名**: テスト薬局株式会社
   - **電話番号**: 03-1234-5678

3. 登録後、メール確認が必要な場合:
   - Supabaseダッシュボードで手動で確認
   - または、メールのリンクをクリック

### 方法2: ローカル環境でテストアカウント作成

1. ローカルでプロジェクトを起動:
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/test-account.html` を開く

3. 「テストアカウントを作成」ボタンをクリック

### 方法3: Supabaseダッシュボードから手動作成

1. Supabaseダッシュボードにログイン
2. Authentication > Users で新規ユーザーを作成
3. SQLエディタで以下を実行:

```sql
-- ユーザーのメールアドレスを指定
DO $$
DECLARE
  target_user_id UUID;
  new_company_id UUID;
  user_email TEXT := 'test@example.com'; -- ここに作成したユーザーのメールアドレス
BEGIN
  -- ユーザーIDを取得
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- 会社を作成
  INSERT INTO public.companies (
    name,
    headquarters_phone,
    headquarters_email,
    status
  ) VALUES (
    'テスト薬局株式会社',
    '03-1234-5678',
    user_email,
    'active'
  ) RETURNING id INTO new_company_id;
  
  -- usersテーブルにレコードを作成
  INSERT INTO public.users (
    id,
    email,
    organization_name,
    phone,
    company_id
  ) VALUES (
    target_user_id,
    user_email,
    'テスト薬局株式会社',
    '03-1234-5678',
    new_company_id
  );
  
  -- テスト薬局を作成
  INSERT INTO public.pharmacies (
    company_id,
    name,
    address,
    formatted_address,
    prefecture,
    city,
    postal_code,
    phone,
    email,
    location,
    latitude,
    longitude,
    twenty_four_support,
    holiday_support,
    emergency_support,
    has_clean_room,
    handles_narcotics,
    accepts_emergency,
    max_capacity,
    current_capacity,
    available_spots,
    service_radius_km,
    status
  ) VALUES (
    new_company_id,
    'テスト薬局 本店',
    '東京都千代田区丸の内1-1-1',
    '〒100-0005 東京都千代田区丸の内1-1-1',
    '東京都',
    '千代田区',
    '100-0005',
    '03-1234-5678',
    user_email,
    'POINT(139.7647 35.6812)',
    35.6812,
    139.7647,
    true,
    true,
    true,
    true,
    true,
    true,
    20,
    5,
    15,
    10,
    'active'
  );
END $$;
```

## テストアカウントの機能

作成されたテストアカウントには以下が含まれます:
- 会社（テスト薬局株式会社）
- 薬局1店舗（全機能有効）
- 24時間対応、無菌室、麻薬取扱いなど全てのオプションが有効
- 受入可能人数: 15名（最大20名中5名使用）
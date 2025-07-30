# 既存ユーザーの手動移行手順

## 問題の概要
既存ユーザーがログインできない問題は、会社情報（company_id）が設定されていないことが原因です。

## 個別ユーザーの移行手順

### 1. 対象ユーザーの確認

まず、移行が必要なユーザーを確認します：

```sql
-- company_idがNULLのユーザーを確認
SELECT 
  id,
  email,
  organization_name,
  phone,
  created_at
FROM public.users
WHERE company_id IS NULL
ORDER BY created_at DESC;
```

### 2. 特定ユーザーの会社作成と紐付け

特定のユーザーに対して会社を作成し、薬局を紐付けます：

```sql
-- 例: test@example.com のユーザーを移行
DO $$
DECLARE
  target_user_id UUID;
  new_company_id UUID;
BEGIN
  -- ユーザーIDを取得
  SELECT id INTO target_user_id
  FROM public.users
  WHERE email = 'ここにメールアドレスを入力' -- 対象ユーザーのメールアドレス
    AND company_id IS NULL;

  IF target_user_id IS NOT NULL THEN
    -- 会社を作成
    INSERT INTO public.companies (
      name,
      headquarters_phone,
      headquarters_email,
      status
    )
    SELECT 
      organization_name,
      phone,
      email,
      'active'
    FROM public.users
    WHERE id = target_user_id
    RETURNING id INTO new_company_id;
    
    -- ユーザーのcompany_idを更新
    UPDATE public.users 
    SET company_id = new_company_id 
    WHERE id = target_user_id;
    
    -- そのユーザーの薬局のcompany_idを更新
    UPDATE public.pharmacies 
    SET company_id = new_company_id 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'ユーザー % の移行が完了しました', target_user_id;
  ELSE
    RAISE NOTICE 'ユーザーが見つからないか、既に移行済みです';
  END IF;
END $$;
```

### 3. 移行結果の確認

```sql
-- 特定ユーザーの移行結果を確認
SELECT 
  u.email,
  u.organization_name,
  u.company_id,
  c.name as company_name,
  COUNT(p.id) as pharmacy_count
FROM public.users u
LEFT JOIN public.companies c ON u.company_id = c.id
LEFT JOIN public.pharmacies p ON p.company_id = c.id
WHERE u.email = 'ここにメールアドレスを入力'
GROUP BY u.id, u.email, u.organization_name, u.company_id, c.name;
```

## トラブルシューティング

### エラー: ユーザーが見つからない
- メールアドレスが正しいか確認してください
- ユーザーが既に移行済みでないか確認してください

### エラー: 会社名がNULL
- organization_nameが設定されていない場合は、手動で会社名を指定する必要があります

## 緊急対応

どうしても移行できない場合の緊急対応として、新規アカウントの作成をご案内ください。
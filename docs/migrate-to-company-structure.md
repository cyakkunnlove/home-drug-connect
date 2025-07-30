# 会社構造への既存データ移行手順

## 概要
既存のユーザーと薬局データを会社ベースの構造に移行する手順です。

## 移行SQL

Supabaseのダッシュボードで以下のSQLを実行してください：

```sql
-- 既存のユーザーごとに会社を作成し、薬局を紐付ける
DO $$
DECLARE
  user_record RECORD;
  new_company_id UUID;
BEGIN
  -- company_idがNULLのユーザーをループ
  FOR user_record IN 
    SELECT id, email, organization_name, phone 
    FROM public.users 
    WHERE company_id IS NULL 
      AND organization_name IS NOT NULL
  LOOP
    -- 会社を作成
    INSERT INTO public.companies (
      name,
      headquarters_phone,
      headquarters_email,
      status
    ) VALUES (
      user_record.organization_name,
      user_record.phone,
      user_record.email,
      'active'
    ) RETURNING id INTO new_company_id;
    
    -- ユーザーのcompany_idを更新
    UPDATE public.users 
    SET company_id = new_company_id 
    WHERE id = user_record.id;
    
    -- そのユーザーの薬局のcompany_idを更新
    UPDATE public.pharmacies 
    SET company_id = new_company_id 
    WHERE user_id = user_record.id;
  END LOOP;
END $$;
```

## 実行手順

1. Supabaseダッシュボードにログイン
2. 該当プロジェクトを選択
3. 左メニューから「SQL Editor」を選択
4. 上記のSQLをコピー＆ペースト
5. 「Run」ボタンをクリックして実行

## 確認

移行後、以下のSQLで結果を確認できます：

```sql
-- 会社数の確認
SELECT COUNT(*) as company_count FROM public.companies;

-- company_idがNULLのユーザーがいないことを確認
SELECT COUNT(*) as users_without_company 
FROM public.users 
WHERE company_id IS NULL;

-- 各会社の薬局数を確認
SELECT c.name, COUNT(p.id) as pharmacy_count
FROM public.companies c
LEFT JOIN public.pharmacies p ON p.company_id = c.id
GROUP BY c.id, c.name;
```

## 注意事項

- このマイグレーションは一度だけ実行してください
- 実行前にデータベースのバックアップを取ることを推奨します
- 新規ユーザーは登録時に自動的に会社が作成されるため、このマイグレーションは既存データのみが対象です
# データベースマイグレーション実行手順

## 実行するマイグレーション

以下の2つのSQLファイルをSupabaseのSQL Editorで実行してください：

1. `supabase/migrations/002_fix_schema_and_add_features.sql`
   - organization_nameカラムの追加
   - 薬局の施設基準フィールドの追加
   - 満床薬局のフィルタリング機能
   - サービス管理テーブルの作成

## 実行手順

### 1. Supabase管理画面にアクセス
1. https://supabase.com/dashboard/project/hrbsbdyutqwdxfartyzz にアクセス
2. 左側メニューから「SQL Editor」をクリック

### 2. マイグレーション実行
1. 「New query」をクリック
2. `/Users/takuyakatou/Projects/home-drug-connect/supabase/migrations/002_fix_schema_and_add_features.sql`の内容をコピー
3. SQL Editorに貼り付け
4. 「Run」ボタンをクリック

### 3. 実行確認
エラーがないことを確認し、以下が作成されたことを確認：
- `pharmacy_services`テーブル
- 新しいカラム（has_clean_room, handles_narcotics等）
- 更新された検索関数

## 新機能の確認

マイグレーション後、以下の機能が利用可能になります：

### 薬局側の新機能
- 無菌調剤室の有無を設定
- 麻薬取扱いの可否を設定
- より詳細な施設情報の入力

### 患者側の新機能
- 満床の薬局を除外して検索
- 施設基準でフィルタリング（無菌室、麻薬取扱い等）
- 薬局の詳細情報をモーダルで確認

## トラブルシューティング

### エラーが発生した場合
1. エラーメッセージを確認
2. 既にテーブルやカラムが存在する場合は、IF NOT EXISTSが付いているので安全です
3. 必要に応じて個別のALTER文を実行

### ロールバックが必要な場合
以下のSQLで変更を元に戻せます：
```sql
-- 新しいテーブルを削除
DROP TABLE IF EXISTS pharmacy_services CASCADE;

-- 追加したカラムを削除
ALTER TABLE pharmacies 
DROP COLUMN IF EXISTS has_clean_room,
DROP COLUMN IF EXISTS handles_narcotics,
DROP COLUMN IF EXISTS accepts_emergency,
DROP COLUMN IF EXISTS service_radius_km;

ALTER TABLE users
DROP COLUMN IF EXISTS organization_name;
```
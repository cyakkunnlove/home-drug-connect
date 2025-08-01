# マイグレーション適用手順

## 問題の修正

現在、以下の問題が発生しています：
1. 薬局登録時に `companies` テーブルが存在しない
2. 医師登録時にユーザーテーブルへの INSERT ポリシーがない
3. 薬局詳細ページで位置情報エラーが発生

## 修正手順

### 1. Supabase Dashboardにログイン

1. [Supabase Dashboard](https://app.supabase.com) にアクセス
2. プロジェクトを選択
3. 左側メニューから「SQL Editor」を選択

### 2. マイグレーションの実行

以下のSQLを順番に実行してください：

```sql
-- まず最新のマイグレーションファイルの内容を実行
-- ファイルパス: supabase/migrations/009_fix_registration_issues.sql
```

SQLエディタに `supabase/migrations/009_fix_registration_issues.sql` の内容をコピー&ペーストして実行してください。

### 3. 確認事項

実行後、以下を確認してください：

1. **companiesテーブルの作成確認**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'companies';
   ```

2. **usersテーブルの新しいカラム確認**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('company_id', 'name', 'clinic_name', 'medical_license_number');
   ```

3. **RLSポリシーの確認**
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('users', 'companies');
   ```

### 4. テスト

1. 薬局登録をテスト
2. 医師登録をテスト
3. 検索画面から薬局詳細を表示

## 注意事項

- Google Maps APIキーが設定されていない場合、位置情報の取得は失敗しますが、登録は続行されます
- 薬局の位置情報がない場合、地図は表示されません
- マイグレーション実行時に「policy already exists」エラーが出た場合は、既にポリシーが適用されているため無視して構いません

## トラブルシューティング

エラーが発生した場合：

1. ブラウザの開発者ツールでコンソールエラーを確認
2. Supabaseのログを確認（Dashboard > Logs）
3. RLSポリシーが正しく設定されているか確認
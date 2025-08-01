# Database Error 修正手順

## エラーの原因
「Database error saving new user」エラーは、Supabase Service Role Keyが設定されていないため発生しています。

## 修正手順

### 1. Supabase Service Role Keyの取得

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 「HOME-DRUG CONNECT」プロジェクトを選択
3. 左側メニューの「Settings」をクリック
4. 「API」タブを選択
5. 「Project API keys」セクションの「service_role」キーをコピー

⚠️ **重要**: service_roleキーは機密情報です。絶対に公開しないでください。

### 2. Vercelに環境変数を設定

方法1: Vercel CLIを使用
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# プロンプトが表示されたら、コピーしたservice_roleキーを貼り付けてEnter
```

方法2: Vercelダッシュボードを使用
1. [Vercel Dashboard](https://vercel.com)にログイン
2. 「home-drug-connect」プロジェクトを選択
3. 「Settings」→「Environment Variables」
4. 既存の`SUPABASE_SERVICE_ROLE_KEY`を編集、または新規追加
5. Value欄にservice_roleキーを貼り付け
6. 「Production」にチェック
7. 「Save」をクリック

### 3. 再デプロイ

環境変数を更新した後、再デプロイが必要です：

```bash
vercel --prod --force
```

または、Vercelダッシュボードから：
1. 「Deployments」タブ
2. 最新のデプロイメントの「...」メニュー
3. 「Redeploy」を選択

## 確認事項

1. **登録テスト**
   - 薬局登録が正常に動作するか確認
   - 医師登録が正常に動作するか確認

2. **エラーログ確認**
   - Vercelダッシュボードの「Functions」タブでエラーログを確認

## トラブルシューティング

### それでもエラーが発生する場合

1. **RLSポリシーの確認**
   ```sql
   -- Supabase SQL Editorで実行
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('users', 'companies');
   ```

2. **トリガー関数の確認**
   ```sql
   -- handle_new_user関数が存在するか確認
   SELECT proname FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. **Vercel関数ログの確認**
   - Vercelダッシュボード → Functions → エラーが発生した関数を選択

## 注意事項

- Service Role Keyは本番環境でのみ必要です
- ローカル開発では`.env.local`に設定してください
- キーは定期的にローテーションすることを推奨します
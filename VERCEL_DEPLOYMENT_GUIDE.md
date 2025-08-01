# Vercel デプロイメントガイド

## 1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリ「home-drug-connect」をインポート
4. Framework Preset: `Next.js`を選択
5. Root Directory: そのまま（変更不要）

## 2. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を追加してください：

### 必須の環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hrbsbdyutqwdxfartyzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE
SUPABASE_SERVICE_ROLE_KEY=[Supabaseダッシュボードから取得]

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBN-JwTRud38REKKJFFeKBrtho13MCWQZs

# App URL (本番環境用)
NEXT_PUBLIC_APP_URL=https://[your-project-name].vercel.app

# CSP設定
NEXT_PUBLIC_CSP_DISABLED=true

# Resend Email
RESEND_API_KEY=re_AdLw16f6_hfkigqKxqTGwxUP5rRxjaw83
```

### 今後設定が必要な環境変数

```env
# Stripe (決済機能を使用する場合)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# OpenAI (AI機能を使用する場合)
OPENAI_API_KEY=
```

## 3. Service Role Keyの取得方法

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクト「HOME-DRUG CONNECT」を選択
3. 左メニューの「Settings」→「API」を選択
4. 「Service role key」をコピー
5. Vercelの環境変数に`SUPABASE_SERVICE_ROLE_KEY`として設定

## 4. デプロイ前のチェックリスト

- [ ] すべての必須環境変数が設定されている
- [ ] `NEXT_PUBLIC_APP_URL`が正しいVercel URLに設定されている
- [ ] データベースマイグレーションが完了している
- [ ] ローカルでビルドが成功することを確認済み

## 5. デプロイ実行

1. Vercelダッシュボードで「Deploy」をクリック
2. ビルドログを確認
3. エラーが発生した場合は、ログを確認して修正

## 6. デプロイ後の確認

1. **基本動作確認**
   - ホームページが表示される
   - 薬局検索が動作する
   - 地図が表示される

2. **認証機能確認**
   - 薬局登録ができる
   - 医師登録ができる
   - ログインができる

3. **データベース接続確認**
   - 検索結果が表示される
   - 薬局詳細ページが表示される

## 7. トラブルシューティング

### ビルドエラーが発生した場合
```bash
# ローカルでビルドを確認
npm run build
```

### 500エラーが発生した場合
1. Vercelのログを確認
2. 環境変数が正しく設定されているか確認
3. Supabaseの接続を確認

### Google Mapsが表示されない場合
1. APIキーが正しいか確認
2. Google Cloud ConsoleでMaps JavaScript APIが有効か確認
3. APIキーの制限設定を確認

## 8. カスタムドメインの設定（オプション）

1. Vercelプロジェクトの「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定
4. SSL証明書の発行を待つ（自動）

## 9. 本番環境の注意事項

- `NEXT_PUBLIC_APP_URL`を本番URLに更新する
- Stripeを使用する場合は本番用のキーに切り替える
- Google Maps APIキーに本番用の制限を設定する
- Supabaseのセキュリティルールを確認する
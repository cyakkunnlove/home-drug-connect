# Service Role Key 設定ガイド

## 問題
現在、「Database error creating new user」エラーが発生している原因は、`SUPABASE_SERVICE_ROLE_KEY`が設定されていないためです。

## 解決方法

### 1. Supabase Dashboardにアクセス
1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 「HOME-DRUG CONNECT」プロジェクトを選択

### 2. Service Role Keyを取得
1. 左側メニューから「Settings」をクリック
2. 「API」タブを選択
3. 「Service Role Key」セクションを探す
4. 「Reveal」をクリックしてキーを表示
5. キーをコピー

### 3. 環境変数を設定

#### ローカル環境（.env.local）
```bash
SUPABASE_SERVICE_ROLE_KEY=実際のService Role Keyをここに貼り付け
```

#### Vercel環境
1. [Vercel Dashboard](https://vercel.com) にログイン
2. home-drug-connectプロジェクトを選択
3. Settings → Environment Variables
4. 以下を追加:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: コピーしたService Role Key
   - Environment: Production, Preview, Development

### 4. 確認事項
- Service Role Keyは`service_role`と表示されているキー（`anon`キーではない）
- キーは`eyJ`で始まる長い文字列
- **このキーは絶対に公開しないでください**

### 5. デプロイ後の確認
環境変数を設定後、Vercelで再デプロイが必要です:
```bash
git add .
git commit -m "Update environment configuration"
git push
```

## セキュリティ注意事項
- Service Role Keyはバックエンドでのみ使用
- フロントエンドコードには絶対に含めない
- GitHubにコミットしない（.env.localは.gitignoreに含まれています）
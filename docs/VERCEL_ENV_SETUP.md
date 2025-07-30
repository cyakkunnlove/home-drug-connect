# Vercel環境変数設定ガイド

Vercelダッシュボードで以下の環境変数を設定してください：

1. Vercelダッシュボード (https://vercel.com) にログイン
2. `home-drug-connect` プロジェクトを選択
3. Settings → Environment Variables に移動
4. 以下の環境変数を追加：

## 必須の環境変数

```
NEXT_PUBLIC_SUPABASE_URL=https://hrbsbdyutqwdxfartyzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYnNiZHl1dHF3ZHhmYXJ0eXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTY3MTcsImV4cCI6MjA2OTQzMjcxN30.vSGlWeY6vxB1oDP48DGTRqpNgU36viWq4CE9RROuDRE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBN-JwTRud38REKKJFFeKBrtho13MCWQZs
NEXT_PUBLIC_APP_URL=https://home-drug-connect.vercel.app
```

## オプション（後で設定）

```
STRIPE_SECRET_KEY=（Stripeダッシュボードから取得）
STRIPE_WEBHOOK_SECRET=（Stripe CLIまたはWebhook設定から取得）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=（Stripeダッシュボードから取得）
```

## 設定手順

1. 各環境変数を一つずつ追加
2. Production, Preview, Development すべての環境にチェック
3. "Save" ボタンをクリック
4. すべての環境変数を追加後、プロジェクトを再デプロイ

## 再デプロイ方法

1. Deployments タブに移動
2. 最新のデプロイメントの右側の "..." メニューをクリック
3. "Redeploy" を選択
4. "Use existing Build Cache" のチェックを外す
5. "Redeploy" ボタンをクリック
# Vercel環境変数設定手順

## 現在の状況
Vercelにデプロイは成功していますが、環境変数が設定されていないため、一部機能が動作しません。

## 設定が必要な環境変数

### 1. Supabase（必須）
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. その他のサービス（オプション - 後で設定可能）
```
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PLAN_PRICE_ID=price_...

# Resend (メール)
RESEND_API_KEY=re_...

# アプリ設定
NEXT_PUBLIC_APP_URL=https://home-drug-connect.vercel.app
```

## Vercelでの設定方法

### 方法1: Vercel CLIを使用
```bash
# Supabase設定（必須）
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# デプロイ
vercel --prod
```

### 方法2: Vercelダッシュボードを使用（推奨）

1. https://vercel.com/cyakkunnloves-projects/home-drug-connect にアクセス
2. Settings タブをクリック
3. Environment Variables をクリック
4. 各環境変数を追加:
   - Key: 環境変数名
   - Value: 値
   - Environment: Production にチェック
5. Save をクリック
6. Deployments タブから最新のデプロイを選択
7. 「Redeploy」ボタンをクリック

## 最小構成での動作確認

最低限以下の環境変数を設定すれば、基本的な機能は動作します：

```
NEXT_PUBLIC_SUPABASE_URL=<あなたのSupabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<あなたのSupabase Anonキー>
```

これらの値は、Supabaseダッシュボード > Settings > API から確認できます。

## 現在のデプロイURL

https://home-drug-connect.vercel.app

環境変数を設定してRedeployすれば、404エラーは解消され、アプリケーションが正常に動作するはずです。
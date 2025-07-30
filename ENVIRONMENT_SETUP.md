# 環境変数設定ガイド

## 必要な環境変数一覧

### 1. Supabase 設定

```env
# Supabase URL - プロジェクトのURL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Supabase Anonymous Key - 公開用のキー
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**取得方法:**
1. Supabase Dashboard にログイン
2. Project Settings > API
3. URLとanon keyをコピー

### 2. Google Maps API 設定

```env
# Google Maps API キー
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

**取得方法:**
1. [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services > Credentials
3. Create Credentials > API Key
4. 以下のAPIを有効化:
   - Maps JavaScript API
   - Geocoding API
   - Places API

### 3. Stripe 設定

```env
# Stripe 公開キー
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # または pk_live_...

# Stripe シークレットキー
STRIPE_SECRET_KEY=sk_test_... # または sk_live_...

# Stripe Webhook シークレット
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe 価格ID（月額プラン）
STRIPE_BASIC_PLAN_PRICE_ID=price_...
```

**取得方法:**
1. [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers > API keys でキーを取得
3. Products で商品と価格を作成し、Price IDを取得
4. Webhooks > Add endpoint でWebhook secretを取得

### 4. メール送信設定 (Resend)

```env
# Resend API キー
RESEND_API_KEY=re_...
```

**取得方法:**
1. [Resend](https://resend.com) にサインアップ
2. API Keys > Create API Key
3. Full Access権限で作成

### 5. アプリケーション設定

```env
# アプリケーションURL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # 開発環境
# NEXT_PUBLIC_APP_URL=https://your-domain.com # 本番環境

# ビルドID（オプション）
BUILD_ID=local-build
```

## 環境別の設定

### 開発環境 (.env.local)

```env
# 開発環境用の設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_dev_maps_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_BASIC_PLAN_PRICE_ID=price_test_...
RESEND_API_KEY=re_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 本番環境 (Vercel環境変数)

```env
# 本番環境用の設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_prod_maps_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_BASIC_PLAN_PRICE_ID=price_live_...
RESEND_API_KEY=re_live_...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## セットアップ手順

### 1. ローカル開発環境

1. プロジェクトルートに `.env.local` ファイルを作成
2. 上記の環境変数をコピー＆ペースト
3. 各サービスから取得した値に置き換え

```bash
# .env.localファイルを作成
cp .env.example .env.local

# エディタで開いて値を設定
code .env.local
```

### 2. Vercel本番環境

1. Vercel Dashboard にログイン
2. Project Settings > Environment Variables
3. 各環境変数を追加（Production環境を選択）
4. 保存してデプロイ

## 注意事項

### セキュリティ

- **秘密キーは絶対にコミットしない**
  - `.env.local` は `.gitignore` に含まれています
  - `STRIPE_SECRET_KEY` や `RESEND_API_KEY` は秘密情報です

### 命名規則

- `NEXT_PUBLIC_` プレフィックス: クライアント側で使用する変数
- プレフィックスなし: サーバー側のみで使用する変数

### トラブルシューティング

1. **環境変数が読み込まれない**
   - Next.jsを再起動する
   - `.env.local` ファイルの場所を確認

2. **APIキーエラー**
   - APIキーの権限を確認
   - 本番/テスト環境の違いを確認

3. **Vercelでの環境変数エラー**
   - Environment Variablesで設定されているか確認
   - 再デプロイを実行

## 環境変数チェックリスト

- [ ] Supabase URLとAnon Keyを設定
- [ ] Google Maps API キーを設定し、必要なAPIを有効化
- [ ] Stripe のテスト/本番キーを適切に設定
- [ ] Resend API キーを設定
- [ ] APP_URLを環境に応じて設定
- [ ] `.env.local` が `.gitignore` に含まれているか確認
- [ ] Vercelに本番用の環境変数を設定
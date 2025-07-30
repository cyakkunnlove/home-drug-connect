# HOME-DRUG CONNECT デプロイメントガイド

このガイドでは、HOME-DRUG CONNECTをプロダクション環境にデプロイする手順を説明します。

## 前提条件

以下のアカウントとサービスが必要です：

1. **Vercel アカウント**
2. **Supabase アカウント**
3. **Stripe アカウント**
4. **Google Cloud Platform アカウント** (Maps API用)
5. **Resend アカウント** (メール送信用)
6. **GitHub アカウント**

## ステップ1: Supabase のセットアップ

### 1.1 プロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョン（東京推奨）を設定

### 1.2 データベースのセットアップ

```bash
# Supabase CLIのインストール
npm install -g supabase

# ログインとプロジェクトのリンク
supabase login
supabase link --project-ref <your-project-ref>

# マイグレーションの実行
supabase db push
```

### 1.3 認証設定

Supabase Dashboard > Authentication > Providers で以下を設定：
- Email認証を有効化
- サイトURL: `https://your-domain.com`
- リダイレクトURL: `https://your-domain.com/auth/callback`

## ステップ2: Stripe のセットアップ

### 2.1 商品とプライスの作成

1. [Stripe Dashboard](https://dashboard.stripe.com) にログイン
2. Products > Add Product
   - 名前: `薬局プラン`
   - 説明: `HOME-DRUG CONNECT 月額利用料`
3. 価格を設定
   - ¥2,200/月
   - 請求期間: 月次
   - Price IDをメモ

### 2.2 Webhook の設定

1. Developers > Webhooks > Add endpoint
2. エンドポイントURL: `https://your-domain.com/api/stripe/webhook`
3. イベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Webhook signing secretをメモ

## ステップ3: Google Maps API のセットアップ

### 3.1 API キーの作成

1. [Google Cloud Console](https://console.cloud.google.com) にログイン
2. APIs & Services > Credentials > Create Credentials > API Key
3. APIキーの制限:
   - HTTP referrers: `https://your-domain.com/*`
   - APIs: Maps JavaScript API, Geocoding API, Places API

### 3.2 請求アカウントの設定

1. Billing > Link a billing account
2. 予算アラートの設定（推奨）

## ステップ4: Resend のセットアップ

### 4.1 APIキーの作成

1. [Resend Dashboard](https://resend.com) にログイン
2. API Keys > Create API Key
3. Full Access権限で作成

### 4.2 ドメインの検証

1. Domains > Add Domain
2. DNSレコードを追加
3. 検証完了を待つ

## ステップ5: Vercel へのデプロイ

### 5.1 GitHubリポジトリの連携

1. [Vercel Dashboard](https://vercel.com) にログイン
2. New Project > Import Git Repository
3. `home-drug-connect` リポジトリを選択

### 5.2 環境変数の設定

Vercel Dashboard > Settings > Environment Variables で以下を設定：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PLAN_PRICE_ID=price_...

# Email (Resend)
RESEND_API_KEY=re_...

# App Settings
NEXT_PUBLIC_APP_URL=https://your-domain.com
BUILD_ID=production-build
```

### 5.3 カスタムドメインの設定

1. Settings > Domains
2. Add Domain
3. DNSレコードを設定

## ステップ6: 本番環境の初期設定

### 6.1 管理者ユーザーの作成

Supabase SQL Editorで実行：

```sql
-- 管理者ユーザーの作成
INSERT INTO users (email, role, name, phone, created_at, updated_at)
VALUES ('admin@your-domain.com', 'admin', '管理者', '000-0000-0000', NOW(), NOW());
```

### 6.2 初期データの投入

必要に応じて、テスト用薬局データなどを投入。

## ステップ7: 監視とメンテナンス

### 7.1 監視の設定

- Vercel Analytics を有効化
- Supabase のログ監視を設定
- Stripe の支払い失敗アラートを設定

### 7.2 バックアップ

- Supabase の自動バックアップを確認
- 定期的なデータエクスポートを設定

### 7.3 セキュリティチェック

- [ ] HTTPS が有効になっているか
- [ ] 環境変数が適切に設定されているか
- [ ] RLSポリシーが有効になっているか
- [ ] APIキーの権限が最小限か
- [ ] CSRFトークンが実装されているか

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数が正しく設定されているか確認
   - サービスロールキーではなくAnonキーを使用しているか確認

2. **Stripe Webhook エラー**
   - Webhook secretが正しいか確認
   - エンドポイントURLが正しいか確認

3. **Google Maps エラー**
   - APIキーの制限が適切か確認
   - 請求アカウントが有効か確認

## サポート

問題が発生した場合は、以下を確認してください：

1. Vercel のビルドログ
2. Supabase のログ
3. ブラウザのコンソールエラー

## 更新履歴

- 2024-01-30: 初版作成
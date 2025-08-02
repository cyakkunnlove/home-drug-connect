# HOME-DRUG CONNECT 技術スタック

## アーキテクチャ

### システム設計
- **アーキテクチャタイプ**: サーバーレスアーキテクチャを採用したモノリシックなNext.jsアプリケーション
- **デプロイメントモデル**: Vercel上のJAMstack + 外部サービス連携
- **API設計**: Next.js App Router API routesを使用したRESTful API
- **データベース設計**: Row Level Security (RLS)を実装したPostgreSQL
- **リアルタイム機能**: Supabase Realtimeサブスクリプション

### インフラ概要
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client (PWA)  │────▶│  Vercel Edge    │────▶│   Supabase      │
│  React + Next   │     │  (Next.js 15)   │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    External Services    │
                    ├──────────────────────────┤
                    │ • Google Maps API       │
                    │ • OpenAI API            │
                    │ • Stripe Payment        │
                    │ • Resend Email          │
                    └──────────────────────────┘
```

## フロントエンド

### コアフレームワーク
- **Next.js 15.4.5** - App Routerを採用したReactフレームワーク
- **React 19.1.0** - UIライブラリ
- **TypeScript 5.x** - strict modeを有効にした型安全性

### スタイリング & UI
- **Tailwind CSS 4.x** - ユーティリティファーストCSSフレームワーク
- **Framer Motion 12.x** - アニメーションライブラリ
- **Lucide React** - アイコンライブラリ
- **iOS風カスタムコンポーネント** - TouchFeedback、IOSButton等

### 状態管理
- **Zustand 5.0.7** - グローバル状態管理
- **React Context API** - コンポーネントレベルの状態管理
- **ネイティブフォーム** - React Hook Formは最小限の使用、基本的にネイティブフォームを推奨

### パフォーマンス最適化
- **Turbopack** - 開発環境用Next.jsバンドラー
- **React Server Components** - 全コンポーネントでデフォルト採用
- **動的インポート** - 大規模コンポーネントのコード分割
- **Next/Image** - 最適化された画像読み込み
- **Web Vitals** - パフォーマンス監視

## バックエンド

### ランタイム & フレームワーク
- **Node.js 18+** - JavaScriptランタイム
- **Vercel Edge Runtime** - サーバーレス関数
- **Next.js API Routes** - RESTful APIエンドポイント

### データベース & ORM
- **Supabase** - PostgreSQL 15のマネージドサービス
- **Supabase Client** - 型安全なデータベースクエリ
- **Row Level Security (RLS)** - データベースレベルの認可
- **PostGIS** - 薬局検索用の地理空間クエリ

### 認証・認可
- **Supabase Auth** - JWTベースの認証
- **ロールベースアクセス制御 (RBAC)** - doctor、pharmacy_admin、adminロール
- **httpOnly Cookie** - セキュアなセッション管理

### 外部サービス連携
- **OpenAI API** - GPT-4o-miniによるAI文書生成・文章校閲
- **Google Maps API** - ジオコーディングと地図表示
- **Stripe API** - サブスクリプション決済処理
- **Resend API** - トランザクションメール配信

## 開発環境

### 必要なツール
```bash
# 基本要件
Node.js 18.x以上
npm 9.x以上
Git

# 推奨IDE
Visual Studio Code + 拡張機能:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
```

### ローカル開発環境セットアップ
```bash
# リポジトリのクローン
git clone <repository-url>
cd home-drug-connect

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localに必要な認証情報を設定

# 開発サーバーの起動
npm run dev
```

### 主要コマンド
```bash
# 開発
npm run dev          # Turbopackを使用した開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint実行
npm run type-check   # TypeScript型チェック（※現在未定義）

# データベース
npm run db:migrate   # Supabaseマイグレーション実行
npm run db:reset     # データベースリセット

# 薬剤データ管理
npm run import:drugs     # Excelから薬剤データインポート
npm run generate:drugs   # 静的JSONファイル生成
npm run etl:drugs       # 完全なETL処理

# テスト・デバッグ（※現在未定義）
npm run create:test-account  # テストアカウント作成
npm run verify:flow         # ユーザーフロー検証
```

## 環境変数

### 必須環境変数
```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=          # SupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase匿名キー
SUPABASE_SERVICE_ROLE_KEY=         # サービスロールキー（サーバーサイドのみ）

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Maps JavaScript APIキー

# Stripe決済
STRIPE_SECRET_KEY=                  # Stripeシークレットキー
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe公開可能キー
STRIPE_WEBHOOK_SECRET=              # Webhookエンドポイントシークレット
STRIPE_SUBSCRIPTION_PRICE_ID=       # サブスクリプション価格ID

# OpenAI
OPENAI_API_KEY=                     # OpenAI APIキー

# メールサービス
RESEND_API_KEY=                     # Resend APIキー
EMAIL_FROM=                         # 送信元メールアドレス

# アプリケーション
NEXT_PUBLIC_APP_URL=                # 本番環境URL
```

### 開発環境 vs 本番環境
- 開発環境: `.env.local`ファイルを使用
- 本番環境: Vercelダッシュボードで設定
- `.env`ファイルは絶対にGitにコミットしない

## ポート設定

### デフォルトポート
```bash
3000  # Next.js開発サーバー
54321 # SupabaseローカルPostgreSQL
54322 # SupabaseローカルStudio
```

### 本番環境URL
- アプリケーション: `https://home-drug-connect.vercel.app`
- API: 同一ドメインの`/api/*`ルート
- Supabase: `https://<project-id>.supabase.co`

## ビルド & デプロイメント

### ビルドプロセス
1. **ビルド前処理**: 静的薬剤JSONファイルの生成
2. **ビルド**: TypeScriptコンパイルを含むNext.js本番ビルド
3. **ビルド後処理**: Crittersによるクリティカルパス最適化

### デプロイメントパイプライン
- **プラットフォーム**: Vercel
- **ブランチ戦略**: 
  - `main` → 本番環境
  - プルリクエスト → プレビューデプロイメント
- **環境変数**: Vercelダッシュボードで管理
- **Edge Functions**: Vercel Edge Networkへの自動デプロイ

### パフォーマンス最適化
- **静的生成 (SSG)**: 公開ページ用
- **増分静的再生成 (ISR)**: 薬局プロフィール用
- **エッジキャッシング**: APIレスポンスのエッジキャッシュ
- **画像最適化**: Next.jsによる自動最適化
- **フォント最適化**: next/fontによるGeistフォント
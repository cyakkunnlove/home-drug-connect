# HOME-DRUG CONNECT プロジェクト構造

## ルートディレクトリ構成

```
home-drug-connect/
├── app/                    # Next.js App Router（ページ、レイアウト、APIルート）
├── components/             # 再利用可能なReactコンポーネント
├── lib/                    # ユーティリティ、ヘルパー、サービス統合
├── types/                  # TypeScript型定義
├── public/                 # 静的アセットと生成ファイル
├── scripts/                # ビルド・メンテナンススクリプト
├── supabase/              # データベースマイグレーションと設定
├── docs/                   # プロジェクトドキュメント
├── .claude-specs/         # Kiroスペック駆動開発ファイル
└── [設定ファイル]         # ルートレベルの設定ファイル
```

## サブディレクトリ構造

### `/app` - Next.js App Router
```
app/
├── (public)/              # 公開ページ用ルートグループ
├── admin/                 # 管理者ダッシュボードルート
├── api/                   # APIエンドポイント
│   ├── auth/             # 認証エンドポイント
│   ├── ai/               # AI統合エンドポイント
│   │   ├── generate-request/    # 依頼文生成
│   │   └── refine-text/        # 文章校閲
│   ├── drugs/            # 薬剤検索エンドポイント
│   ├── profile/          # プロフィール管理
│   ├── requests/         # 依頼管理
│   └── [resource]/       # RESTfulリソースエンドポイント
├── dashboard/             # 薬局ダッシュボードルート
├── doctor/                # 医師ポータルルート
│   ├── requests/         # 依頼管理
│   ├── settings/         # 設定ページ
│   └── request/new/      # 新規依頼作成
├── pharmacy/              # 個別薬局ページ
├── auth/                  # 認証ページ
├── search/                # 検索機能
├── globals.css           # グローバルスタイル
├── layout.tsx            # ルートレイアウト
└── page.tsx              # ホームページ
```

### `/components` - コンポーネント構成
```
components/
├── auth/                  # 認証関連コンポーネント
│   └── ProfileEditForm.tsx # プロフィール編集フォーム（再利用可能）
├── dashboard/             # ダッシュボード固有コンポーネント
├── doctor/                # 医師ポータルコンポーネント
│   ├── OfflineDrugAutocomplete.tsx  # 薬剤名オートコンプリート
│   ├── DrugAutocompleteWrapper.tsx  # オートコンプリートラッパー
│   └── RequestForm.tsx             # 拡張依頼フォーム
├── forms/                 # 再利用可能なフォームコンポーネント
├── layout/                # レイアウトコンポーネント
│   ├── Header.tsx        # ヘッダー
│   ├── Footer.tsx        # フッター
│   └── MobileNav.tsx     # モバイルナビゲーション
├── maps/                  # Google Maps統合コンポーネント
│   ├── GoogleMapComponent.tsx    # 地図表示
│   └── PharmacyMarker.tsx       # カスタムマーカー
├── pharmacy/              # 薬局関連コンポーネント
│   ├── PharmacyCard.tsx         # 薬局カード
│   ├── PharmacyFormExtended.tsx # 拡張薬局設定フォーム
│   ├── ImprovedResponseForm.tsx # 改善された返信フォーム
│   └── PharmacyDetails.tsx      # 薬局詳細表示
├── search/                # 検索インターフェースコンポーネント
├── settings/              # 設定ページコンポーネント
└── ui/                    # 汎用UIコンポーネント
    ├── AnimatedPage.tsx   # ページ遷移ラッパー
    ├── TouchFeedback.tsx  # iOS風タッチインタラクション
    ├── IOSButton.tsx      # iOS風ボタン
    ├── Modal.tsx          # モーダルダイアログ
    └── LoadingSpinner.tsx # ローディング表示
```

### `/lib` - ライブラリコード
```
lib/
├── auth/                  # 認証ユーティリティ
│   ├── actions.ts        # 認証用サーバーアクション
│   └── middleware.ts     # 認証ミドルウェア
├── email/                 # メールサービス統合
│   ├── client.ts         # Resendクライアント設定
│   └── templates/        # メールHTMLテンプレート
├── google-maps/           # Google Mapsユーティリティ
│   ├── config.ts         # Maps設定
│   └── geocoding.ts      # ジオコーディング処理
├── monitoring/            # パフォーマンス監視
├── stripe/                # Stripe決済統合
├── supabase/              # データベースクライアント設定
│   ├── client.ts         # ブラウザクライアント
│   ├── server.ts         # サーバークライアント
│   └── middleware.ts     # Supabaseミドルウェア
└── utils/                 # 汎用ユーティリティ
    ├── format.ts         # フォーマット関数
    ├── validation.ts     # バリデーション
    └── constants.ts      # 定数定義
```

### `/public` - 静的ファイル
```
public/
├── images/               # 画像アセット
├── drugs/                # 薬剤データJSONファイル
│   └── drug-data.json   # 17,000件以上の薬剤データ
└── manifest.json        # PWAマニフェスト
```

## コード組織パターン

### コンポーネント構造
- **サーバーコンポーネント**: 全コンポーネントのデフォルト
- **クライアントコンポーネント**: `'use client'`で明示的にマーク
- **コンポーネントファイル**: PascalCase命名（例: `RequestForm.tsx`）
- **ユーティリティファイル**: camelCase命名（例: `formatDate.ts`）

### ルート構成
- **ルートグループ**: URLに影響しない論理的グルーピング
- **動的ルート**: パラメータ用の角括弧 `[id]`
- **ルートハンドラー**: APIエンドポイント用の`route.ts`ファイル
- **レイアウト**: 共通UI構造のためのネストレイアウト

### API構造
```typescript
// 標準APIルートパターン
export async function GET(request: NextRequest) { }
export async function POST(request: NextRequest) { }
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) { }
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) { }
```

## ファイル命名規則

### TypeScript/JavaScriptファイル
- **コンポーネント**: `PascalCase.tsx`（例: `PharmacyCard.tsx`）
- **フック**: `use`プレフィックス + camelCase（例: `usePharmacySearch.ts`）
- **ユーティリティ**: camelCase（例: `calculateDistance.ts`）
- **定数**: UPPER_SNAKE_CASE（例: `MAX_SEARCH_RADIUS`）
- **型**: インターフェース/型はPascalCase（例: `PharmacyData`）

### ルートファイル
- **ページ**: ルートページ用の`page.tsx`
- **レイアウト**: ルートレイアウト用の`layout.tsx`
- **APIルート**: APIエンドポイント用の`route.ts`
- **ローディング**: ローディング状態用の`loading.tsx`
- **エラー**: エラーバウンダリ用の`error.tsx`

### データベースファイル
- **マイグレーション**: `xxx_description.sql`（例: `001_initial_schema.sql`）
- **型**: `types/database.ts`に生成

## インポート構成

### 標準インポート順序
```typescript
// 1. ReactとNext.jsのインポート
import { useState, useEffect } from 'react'
import { NextRequest, NextResponse } from 'next/server'

// 2. 外部ライブラリのインポート
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// 3. 内部絶対インポート
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth/hooks'

// 4. 相対インポート
import { formatPharmacyData } from './utils'

// 5. 型インポート
import type { Database } from '@/types/database'
```

### パスエイリアス
- `@/*` はプロジェクトルートにマッピング
- クリーンなインポートに使用: `@/components/...`、`@/lib/...`

## 主要アーキテクチャ原則

### 1. **サーバーファーストアーキテクチャ**
- デフォルトでサーバーコンポーネント
- クライアントコンポーネントは必要時のみ（フォーム、インタラクティビティ）
- ミューテーションにはサーバーアクション

### 2. **型安全性**
- 厳格なTypeScript設定
- Supabaseスキーマからの型生成
- 実行時型チェックのZodバリデーション

### 3. **パフォーマンス最適化**
- 可能な限り静的生成
- コード分割のための動的インポート
- オプティミスティックUI更新
- Edge関数デプロイメント

### 4. **セキュリティ・バイ・デザイン**
- データベースレベルのRow Level Security (RLS)
- サーバーサイド認証チェック
- 環境変数の分離
- 入力バリデーションとサニタイズ

### 5. **モバイルファーストレスポンシブデザイン**
- iOS風インタラクションとアニメーション
- タッチ最適化UIコンポーネント
- Progressive Web App機能
- レスポンシブブレークポイント: モバイル → タブレット → デスクトップ

### 6. **モジュラーサービス統合**
- 各サービスごとの独立クライアントモジュール
- 明確な関心の分離
- 依存性注入パターン
- テスト可能なサービスインターフェース

## 開発パターン

### 状態管理
```typescript
// Zustandでのグローバル状態
const useSearchStore = create<SearchState>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
}))

// Reactフックでのローカル状態
const [isLoading, setIsLoading] = useState(false)
```

### エラーハンドリング
```typescript
// 一貫性のあるエラーレスポンス形式
try {
  // 処理
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'ERROR_CODE', message: 'ユーザーフレンドリーなメッセージ' } },
    { status: 400 }
  )
}
```

### データフェッチング
```typescript
// サーバーコンポーネント - 直接データベースアクセス
const pharmacy = await supabase.from('pharmacies').select('*').single()

// クライアントコンポーネント - APIルート
const response = await fetch('/api/pharmacies/search')
const data = await response.json()
```

## 最近の構造的変更

### 2025年8月の更新
- **拡張されたコンポーネント**:
  - `RequestForm.tsx`: 30項目以上の既往歴、治療方針テンプレート、薬局期待事項
  - `ImprovedResponseForm.tsx`: 3段階返信システム（11テンプレート）
  - `ProfileEditForm.tsx`: 再利用可能なプロフィール編集
  
- **新規APIエンドポイント**:
  - `/api/ai/refine-text`: 文章校閲機能
  - `/api/profile/update`: プロフィール更新
  
- **データ構造の拡張**:
  - 薬局期待事項の配列化
  - 条件付き受け入れのサポート
  - 薬剤在庫・往診日管理
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
│   ├── drugs/            # 薬剤検索エンドポイント
│   └── [resource]/       # RESTfulリソースエンドポイント
├── dashboard/             # 薬局ダッシュボードルート
├── doctor/                # 医師ポータルルート
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
├── dashboard/             # ダッシュボード固有コンポーネント
├── doctor/                # 医師ポータルコンポーネント
│   ├── OfflineDrugAutocomplete.tsx  # 薬剤名オートコンプリート
│   └── RequestForm.tsx             # 依頼フォーム
├── forms/                 # 再利用可能なフォームコンポーネント
├── layout/                # レイアウトコンポーネント（Header、Footer等）
├── maps/                  # Google Maps統合コンポーネント
├── pharmacy/              # 薬局関連コンポーネント
├── search/                # 検索インターフェースコンポーネント
├── settings/              # 設定ページコンポーネント
└── ui/                    # 汎用UIコンポーネント
    ├── AnimatedPage.tsx   # ページ遷移ラッパー
    ├── TouchFeedback.tsx  # iOS風タッチインタラクション
    ├── IOSButton.tsx      # iOS風ボタン
    └── Modal.tsx          # モーダルダイアログコンポーネント
```

### `/lib` - ライブラリコード
```
lib/
├── auth/                  # 認証ユーティリティ
│   └── actions.ts        # 認証用サーバーアクション
├── email/                 # メールサービス統合
│   ├── client.ts         # Resendクライアント設定
│   └── templates/        # メールHTMLテンプレート
├── google-maps/           # Google Mapsユーティリティ
├── monitoring/            # パフォーマンス監視
├── stripe/                # Stripe決済統合
├── supabase/              # データベースクライアント設定
│   ├── client.ts         # ブラウザクライアント
│   └── server.ts         # サーバークライアント
└── utils/                 # 汎用ユーティリティ
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
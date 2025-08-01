# Service Role Key 取得ガイド（図解付き）

## 重要：現在の問題
`.env.local`ファイルの`SUPABASE_SERVICE_ROLE_KEY`が`YOUR_SERVICE_ROLE_KEY_HERE`のままになっています。
これが「Database error creating new user」エラーの原因です。

## Service Role Key を取得する手順

### 1. Supabase Dashboardにログイン
1. ブラウザで [https://app.supabase.com](https://app.supabase.com) を開く
2. GitHubアカウントでログイン

### 2. プロジェクトを選択
1. プロジェクト一覧から「HOME-DRUG CONNECT」をクリック
   - Project ID: `hrbsbdyutqwdxfartyzz`

### 3. Service Role Keyを取得
1. 左側のサイドバーから「⚙️ Settings」をクリック
2. 「API」タブをクリック
3. 下にスクロールして「Project API keys」セクションを探す
4. 「service_role」の行を見つける（「anon」ではない方）
5. 「Reveal」ボタンをクリック
6. 表示されたキーをコピー
   - キーは`eyJ`で始まる非常に長い文字列です
   - **anonキーと間違えないよう注意！**

### 4. .env.localファイルを更新
```bash
# 現在（間違い）
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# 修正後（正しい）
SUPABASE_SERVICE_ROLE_KEY=eyJ...（コピーしたService Role Key）
```

### 5. 確認
```bash
node check-local-env.js
```

正しく設定されていれば：
```
✅ Service Role Keyが設定されています
   最初の10文字: eyJ...
```

## Service Role Key の見分け方

### ❌ Anon Key（間違い）
- role: `anon`
- 公開可能なキー
- フロントエンドで使用

### ✅ Service Role Key（正しい）
- role: `service_role`
- **絶対に公開してはいけない**
- バックエンドでのみ使用
- 全てのRLSをバイパスする強力な権限

## Vercelへの設定も必要

### Vercel環境変数の設定
1. [https://vercel.com](https://vercel.com) にログイン
2. home-drug-connectプロジェクトを選択
3. Settings → Environment Variables
4. 新しい環境変数を追加：
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: コピーしたService Role Key
   - Environment: ✅ Production, ✅ Preview, ✅ Development
5. 「Save」をクリック

## よくある間違い

1. **Anon KeyとService Role Keyを間違える**
   - 必ず「service_role」の方を使う

2. **値に改行が含まれる**
   - キーの前後に空白や改行がないか確認

3. **プレースホルダーのまま**
   - `YOUR_SERVICE_ROLE_KEY_HERE`を実際のキーに置き換える

## セキュリティ注意事項
- Service Role Keyは**絶対にGitHubにコミットしない**
- フロントエンドコードに含めない
- 公開リポジトリで共有しない
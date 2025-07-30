# HOME-DRUG CONNECT 移行計画

## 問題
- Vercel環境でCSPエラーが解決できない
- ログインページにアクセスできない

## 移行オプション

### オプション1: 新しいVercelアカウント/プロジェクト
1. 新しいVercelアカウントを作成（または別のチームを作成）
2. GitHubリポジトリを新しいVercelプロジェクトに接続
3. 環境変数を設定
4. デプロイ

### オプション2: Netlifyへの移行
```bash
# Netlifyにデプロイ
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

### オプション3: 最小限の再構築
1. 新しいNext.jsプロジェクトを作成
2. 必要なコンポーネントのみコピー
3. 段階的に機能を追加

## 推奨: Netlifyへの移行

Netlifyは設定がシンプルで、CSP関連の問題が少ない傾向があります。

### 手順
1. Netlifyアカウントを作成
2. `netlify.toml`を作成
3. 環境変数を設定
4. デプロイ

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_ENABLE_EXPERIMENTAL_TURBO = "false"
```

## データの保持
- Supabaseのデータベースはそのまま使用可能
- 環境変数を新しい環境にコピーするだけ

## 決定事項
どのオプションを選択しますか？
# セキュリティ修正対応

## Google API Key漏洩への対応

GitGuardianからGoogle API Keyの漏洩が検出されました。以下の対応を実施しました：

### 実施済み対応

1. **.gitignoreの強化**
   - 環境変数ファイルを確実に除外
   - APIキーやシークレットファイルの除外パターンを追加

2. **.env.exampleの作成**
   - 環境変数のテンプレートファイルを作成
   - 実際の値は含まず、設定が必要な項目のみ記載

### 必要なアクション（あなたが実施）

#### 1. Google Cloud Consoleでの対応
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 該当のAPIキーを**即座に無効化**
3. 新しいAPIキーを生成
4. 新しいキーに以下の制限を設定：
   - **アプリケーション制限**: HTTPリファラー
   - **許可するリファラー**: 
     - `http://localhost:3000/*`
     - `https://your-domain.com/*` (本番環境のドメイン)
   - **API制限**: Maps JavaScript API、Geocoding APIのみ許可

#### 2. Vercelでの環境変数設定
1. Vercelダッシュボードにアクセス
2. プロジェクトの Settings → Environment Variables
3. 以下の環境変数を設定（既存のものは値を更新）：
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=新しいAPIキー
   OPENAI_API_KEY=既存のキー（Vercelに設定済みなら変更不要）
   ```

#### 3. GitHubでの対応
1. リポジトリのSecrets設定で古いキーを削除
2. 必要に応じてリポジトリ履歴のクリーニング（BFG Repo-Cleanerなど）

### 今後の予防策

1. **環境変数は必ずVercelで管理**
   - ローカルでは`.env.local`を使用
   - このファイルは絶対にコミットしない

2. **APIキーの制限を必ず設定**
   - Google Maps APIキーは必ずリファラー制限
   - 使用するAPIのみを許可

3. **定期的な監査**
   - GitGuardianのアラートに即座に対応
   - 定期的にAPIキーをローテーション

### ローカル開発環境のセットアップ

```bash
# .env.localファイルを作成
cp .env.example .env.local

# .env.localを編集して実際の値を設定
# 注意：このファイルは絶対にコミットしないこと！
```

## 確認事項

- [ ] Google Cloud ConsoleでAPIキーを無効化・再生成した
- [ ] 新しいAPIキーに適切な制限を設定した
- [ ] Vercelに新しい環境変数を設定した
- [ ] ローカルの.env.localファイルを更新した
- [ ] .gitignoreが正しく設定されていることを確認した
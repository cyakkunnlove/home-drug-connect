# 薬剤マスターデータ管理ガイド

## 概要
HOME-DRUG CONNECTでは、薬剤の自動補完機能のために薬剤マスターデータを管理しています。

## データソース

### 1. 厚生労働省の薬価基準収載医薬品データ
- **URL**: https://www.mhlw.go.jp/topics/2021/04/tp20210401-01.html
- **更新頻度**: 年4回（4月、6月、10月、12月）
- **形式**: CSV/Excel
- **内容**: 
  - 医薬品コード（YJコード）
  - 医薬品名
  - 規格・剤形
  - 製造販売業者
  - 薬価
  - 後発品フラグ

### 2. 日本医薬情報センター（JAPIC）
- 有料サービス
- より詳細な医薬品情報
- 添付文書情報

## データ構造

```sql
CREATE TABLE drugs (
  code VARCHAR PRIMARY KEY,        -- YJコード
  name VARCHAR NOT NULL,           -- 医薬品名
  name_kana VARCHAR,              -- 医薬品名（カナ）
  type VARCHAR NOT NULL,          -- 'generic' or 'brand'
  manufacturer VARCHAR,           -- 製造販売業者
  dosage_form VARCHAR,           -- 剤形
  standard VARCHAR,              -- 規格
  approval_date DATE,            -- 承認日
  updated_at TIMESTAMPTZ         -- 更新日時
);
```

## インポート手順

### 1. 初回セットアップ
```bash
# 環境変数の設定
export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_key

# スクリプトの実行
npm run import:drugs
```

### 2. 定期更新（推奨: 月1回）
```bash
# Cronジョブの設定例
0 2 1 * * cd /path/to/project && npm run import:drugs
```

### 3. 手動実行
```bash
# サンプルデータでテスト
npx tsx scripts/import-mhlw-drugs.ts

# 本番データでインポート
MHLW_DATA_URL=https://actual-url.csv npx tsx scripts/import-mhlw-drugs.ts
```

## データ最適化

### 1. インデックス
- 薬剤名の部分一致検索: `gin_trgm_ops`
- カナ検索: `gin_trgm_ops`
- タイプ別検索: `btree`
- 製造元検索: `btree`

### 2. キャッシュ戦略
- **クライアントサイド**: 5分間のメモリキャッシュ
- **API レスポンス**: 5分間のHTTPキャッシュ
- **頻出薬剤**: 起動時にプリロード

### 3. パフォーマンス指標
- 検索レスポンス: < 100ms
- オートコンプリート表示: < 50ms
- データベース負荷: < 10 queries/sec

## トラブルシューティング

### Q: インポートが失敗する
```bash
# 権限の確認
psql -h your-db-host -U postgres -c "SELECT * FROM pg_extension WHERE extname = 'pg_trgm';"

# 拡張機能のインストール
psql -h your-db-host -U postgres -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### Q: 検索が遅い
```bash
# インデックスの再構築
psql -h your-db-host -U postgres -c "REINDEX TABLE drugs;"

# 統計情報の更新
psql -h your-db-host -U postgres -c "ANALYZE drugs;"
```

### Q: データが古い
- 厚生労働省のサイトで最新データを確認
- インポートスクリプトを実行
- キャッシュをクリア

## セキュリティ考慮事項

1. **個人情報**: 薬剤マスターには個人情報は含まれません
2. **アクセス制御**: 読み取り専用のAPIエンドポイント
3. **レート制限**: 1IPあたり100req/min
4. **データ検証**: インポート時の整合性チェック

## 今後の改善案

1. **増分更新**: 差分のみを更新する仕組み
2. **画像データ**: 薬剤の画像を追加
3. **相互作用チェック**: 薬剤間の相互作用データ
4. **在庫連携**: 薬局の在庫情報との連携
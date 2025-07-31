# Supabase マイグレーション実行手順

## 概要
スケーラビリティ改善のための3つのマイグレーションファイルを実行する必要があります。

## マイグレーションファイル

### 1. 005_performance_indexes.sql
パフォーマンス最適化のためのインデックスを追加します：
- 空間検索用のGISTインデックス
- テキスト検索用のトライグラムインデックス
- 各種フィルタリング用の複合インデックス
- パフォーマンス統計用のマテリアライズドビュー

### 2. 006_optimized_search_functions.sql
検索機能を最適化します：
- 効率的な空間検索関数
- バッチ処理関数
- 検索分析集計関数

### 3. 007_monitoring_tables.sql
モニタリング用のテーブルを作成します：
- Web Vitalsメトリクス
- APIパフォーマンス追跡
- エラーログ
- システムヘルスメトリクス

## 実行方法

### オプション1: Supabase Dashboard経由（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard/project/hrbsbdyutqwdxfartyzz/sql/new) にアクセス

2. 以下の順番でSQLを実行：
   - `supabase/migrations/005_performance_indexes.sql`
   - `supabase/migrations/006_optimized_search_functions.sql`
   - `supabase/migrations/007_monitoring_tables.sql`

3. 各ファイルの内容をコピーして、SQL Editorに貼り付け、実行

### オプション2: Supabase CLI経由

```bash
# データベースパスワードが必要です
supabase db push

# または個別に実行
supabase db execute -f supabase/migrations/005_performance_indexes.sql
supabase db execute -f supabase/migrations/006_optimized_search_functions.sql
supabase db execute -f supabase/migrations/007_monitoring_tables.sql
```

## 実行順序の重要性

必ず以下の順番で実行してください：
1. 005_performance_indexes.sql（基本的なインデックス）
2. 006_optimized_search_functions.sql（関数の最適化）
3. 007_monitoring_tables.sql（モニタリングテーブル）

## 実行後の確認

### インデックスの確認
```sql
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### 関数の確認
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

### テーブルの確認
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## トラブルシューティング

### エラー: "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"
- すでに修正済み（CONCURRENTLYを削除）

### エラー: "extension already exists"
- 無視して続行（IF NOT EXISTSで処理済み）

### エラー: "index already exists"
- 無視して続行（IF NOT EXISTSで処理済み）

## 注意事項

- 大きなテーブルへのインデックス作成は時間がかかる場合があります
- マイグレーション中は一時的にパフォーマンスが低下する可能性があります
- 本番環境では、オフピーク時に実行することを推奨します

## 実行後の次のステップ

1. アプリケーションの動作確認
2. 検索パフォーマンスのテスト
3. モニタリングエンドポイントの動作確認
4. Redis環境変数の設定（本番環境用）
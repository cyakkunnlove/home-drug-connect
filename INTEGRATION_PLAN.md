# HOME-DRUG CONNECT 統合実装計画書

## 1. 新機能概要
ドクターから薬局への患者受け入れ依頼システムを既存の薬局プラットフォームに統合

## 2. データベース拡張設計

### 2.1 新規テーブル

```sql
-- 依頼管理
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) NOT NULL,
  patient_info JSONB NOT NULL, -- {medications, conditions, treatment_plan, notes}
  ai_document TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 薬局からの回答
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) NOT NULL,
  accepted BOOLEAN NOT NULL,
  rejection_reasons JSONB, -- {inventory: false, capacity: true, ...}
  notes TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 薬剤マスタ
CREATE TABLE drugs (
  code VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  name_kana VARCHAR,
  type VARCHAR CHECK (type IN ('generic', 'brand')),
  approval_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 薬局キャパシティ拡張
ALTER TABLE pharmacies 
ADD COLUMN accepted_patients_count INTEGER DEFAULT 0;
```

### 2.2 インデックス追加

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_drugs_name_trgm ON drugs USING gin (name gin_trgm_ops);
CREATE INDEX idx_drugs_name_kana_trgm ON drugs USING gin (name_kana gin_trgm_ops);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_pharmacy_id ON requests(pharmacy_id);
```

## 3. 既存システムとの統合ポイント

### 3.1 ユーザー認証
- 既存のuser_roleに'doctor'を追加
- 既存の認証フローを活用

### 3.2 薬局データ
- 既存のpharmaciesテーブルを活用
- キャパシティ管理を既存のmax_capacity/current_capacityと連携

### 3.3 通知システム
- 既存のinquiriesの通知機能を拡張
- lib/email/notifications.tsを活用

## 4. 新規実装コンポーネント

### 4.1 ドクター向け画面
```
app/doctor/
├── dashboard/
│   ├── page.tsx         # ダッシュボード
│   └── requests/        # 依頼管理
├── request/
│   └── new/
│       └── page.tsx     # 新規依頼作成
└── layout.tsx
```

### 4.2 薬局向け機能拡張
```
app/dashboard/requests/
├── page.tsx             # 依頼一覧
└── [id]/
    └── page.tsx         # 依頼詳細・回答
```

### 4.3 API Routes
```
app/api/
├── requests/
│   ├── route.ts         # 依頼作成・一覧
│   └── [id]/
│       └── route.ts     # 依頼詳細
├── responses/
│   └── route.ts         # 回答送信
├── drugs/
│   └── search/
│       └── route.ts     # 薬剤検索
└── ai/
    └── generate-request/
        └── route.ts     # AI依頼文生成
```

## 5. 実装スケジュール

### Phase 1: 基盤構築 (1週間)
- [ ] データベーススキーマ追加
- [ ] 認証ロール拡張
- [ ] 基本的なRLS設定

### Phase 2: ドクター機能 (1週間)
- [ ] 依頼作成フォーム
- [ ] 薬剤オートコンプリート
- [ ] AI依頼文生成

### Phase 3: 薬局機能 (1週間)
- [ ] 依頼受信・一覧表示
- [ ] 回答機能
- [ ] キャパシティ自動更新

### Phase 4: ETL & 最適化 (3日)
- [ ] 薬剤マスタETLスクリプト
- [ ] JSON配信設定
- [ ] パフォーマンス最適化

### Phase 5: テスト & デプロイ (3日)
- [ ] 統合テスト
- [ ] 負荷テスト
- [ ] 本番デプロイ

## 6. 技術的考慮事項

### 6.1 パフォーマンス
- 薬剤検索: pg_trgmで初期実装、将来的にクライアントサイド移行
- キャッシュ: Vercel Edge Cacheを活用
- リアルタイム: Supabase Realtimeで依頼通知

### 6.2 セキュリティ
- 患者情報は最小限のみ保存
- RLSで厳格なアクセス制御
- AI生成文書の事前レビュー必須

### 6.3 拡張性
- 薬剤マスタは月次更新で運用開始
- 検索負荷増大時はRedis導入を検討
- 将来的な在庫管理連携を考慮した設計

## 7. 移行リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| 既存機能への影響 | 中 | 段階的デプロイ、Feature Flag活用 |
| DB負荷増大 | 高 | インデックス最適化、Read Replica検討 |
| ユーザー混乱 | 低 | UI/UXの一貫性維持、ガイド作成 |
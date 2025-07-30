-- Fix organization_name column issue and add pharmacy features
-- このマイグレーションを実行してスキーマを修正します

-- 1. users テーブルの修正
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- name カラムが存在する場合、データを移行してからカラムを削除
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
    UPDATE users SET organization_name = name WHERE organization_name IS NULL;
    ALTER TABLE users DROP COLUMN name;
  END IF;
END $$;

-- 2. pharmacies テーブルに施設基準フィールドを追加
ALTER TABLE pharmacies
ADD COLUMN IF NOT EXISTS has_clean_room BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS handles_narcotics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS facility_standards TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accepts_emergency BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(5,2) DEFAULT 5.0;

-- 3. 既存の twenty_four_support, holiday_support, emergency_support を移行（存在する場合）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacies' AND column_name = 'twenty_four_support') THEN
    UPDATE pharmacies SET accepts_emergency = emergency_support WHERE accepts_emergency IS NULL;
  END IF;
END $$;

-- 4. pharmacy_services テーブルを作成（より柔軟な施設基準管理用）
CREATE TABLE IF NOT EXISTS pharmacy_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, service_type)
);

-- 5. 標準的なサービスタイプを挿入するための関数
CREATE OR REPLACE FUNCTION initialize_pharmacy_services(pharmacy_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO pharmacy_services (pharmacy_id, service_type, is_available)
  VALUES 
    (pharmacy_id, '無菌調剤', false),
    (pharmacy_id, '麻薬調剤', false),
    (pharmacy_id, '在宅患者訪問薬剤管理指導', true),
    (pharmacy_id, '24時間対応', false),
    (pharmacy_id, '休日対応', false),
    (pharmacy_id, '緊急時対応', true),
    (pharmacy_id, '医療材料供給', false),
    (pharmacy_id, '中心静脈栄養法用輸液調製', false),
    (pharmacy_id, '抗がん剤調製', false)
  ON CONFLICT (pharmacy_id, service_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6. 検索関数を更新（満床の薬局を除外するオプション付き）
CREATE OR REPLACE FUNCTION search_nearby_pharmacies(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 5,
  exclude_full BOOLEAN DEFAULT true,
  required_services TEXT[] DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  email TEXT,
  services TEXT[],
  available_spots INTEGER,
  max_spots INTEGER,
  has_clean_room BOOLEAN,
  handles_narcotics BOOLEAN,
  facility_standards TEXT[],
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.address,
    p.latitude,
    p.longitude,
    p.phone,
    p.email,
    p.services,
    p.available_spots,
    p.max_spots,
    p.has_clean_room,
    p.handles_narcotics,
    p.facility_standards,
    ST_Distance(
      p.location,
      ST_MakePoint(search_lng, search_lat)::geography
    ) / 1000 AS distance_km
  FROM pharmacies p
  WHERE 
    p.status = 'active'
    AND ST_DWithin(
      p.location,
      ST_MakePoint(search_lng, search_lat)::geography,
      COALESCE(p.service_radius_km, radius_km) * 1000
    )
    AND (NOT exclude_full OR p.available_spots > 0)
    AND (
      COALESCE(array_length(required_services, 1), 0) = 0
      OR p.id IN (
        SELECT ps.pharmacy_id 
        FROM pharmacy_services ps
        WHERE ps.service_type = ANY(required_services)
        AND ps.is_available = true
        GROUP BY ps.pharmacy_id
        HAVING COUNT(*) = array_length(required_services, 1)
      )
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. インデックスを追加
CREATE INDEX IF NOT EXISTS idx_pharmacies_has_clean_room ON pharmacies(has_clean_room) WHERE has_clean_room = true;
CREATE INDEX IF NOT EXISTS idx_pharmacies_handles_narcotics ON pharmacies(handles_narcotics) WHERE handles_narcotics = true;
CREATE INDEX IF NOT EXISTS idx_pharmacies_available_spots ON pharmacies(available_spots) WHERE available_spots > 0;
CREATE INDEX IF NOT EXISTS idx_pharmacy_services_pharmacy_id ON pharmacy_services(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_services_service_type ON pharmacy_services(service_type);

-- 8. RLSポリシーを追加
ALTER TABLE pharmacy_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pharmacy services" ON pharmacy_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pharmacies 
      WHERE id = pharmacy_id AND status = 'active'
    )
  );

CREATE POLICY "Pharmacy owners can manage their services" ON pharmacy_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pharmacies 
      WHERE id = pharmacy_id AND user_id = auth.uid()
    )
  );

-- 9. 既存の薬局にサービス情報を初期化
DO $$
DECLARE
  pharmacy_record RECORD;
BEGIN
  FOR pharmacy_record IN SELECT id FROM pharmacies
  LOOP
    PERFORM initialize_pharmacy_services(pharmacy_record.id);
  END LOOP;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_nearby_pharmacies TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_pharmacy_services TO authenticated;
-- HOME-DRUG CONNECT: Doctor Request Features Migration
-- Description: Add doctor-to-pharmacy patient request functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id) NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) NOT NULL,
  patient_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_document TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) NOT NULL,
  accepted BOOLEAN NOT NULL,
  rejection_reasons JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id) -- One response per request
);

-- Create drugs master table
CREATE TABLE IF NOT EXISTS drugs (
  code VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  name_kana VARCHAR,
  type VARCHAR NOT NULL CHECK (type IN ('generic', 'brand')),
  approval_date DATE,
  manufacturer VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add accepted patients tracking to pharmacies
ALTER TABLE pharmacies 
ADD COLUMN IF NOT EXISTS accepted_patients_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_requests_doctor_id ON requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_requests_pharmacy_id ON requests(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_pharmacy_id ON responses(pharmacy_id);

-- Drug search indexes using trigram
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm ON drugs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_drugs_name_kana_trgm ON drugs USING gin (name_kana gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_drugs_type ON drugs(type);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drugs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requests
-- Doctors can view their own requests
CREATE POLICY "Doctors can view their own requests" ON requests
  FOR SELECT USING (doctor_id = auth.uid());

-- Pharmacies can view requests sent to them
CREATE POLICY "Pharmacies can view their requests" ON requests
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
  );

-- Doctors can create requests
CREATE POLICY "Doctors can create requests" ON requests
  FOR INSERT WITH CHECK (
    doctor_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'doctor'
    )
  );

-- RLS Policies for responses
-- Request creators can view responses
CREATE POLICY "Request creators can view responses" ON responses
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM requests WHERE doctor_id = auth.uid()
    )
  );

-- Pharmacies can view and create responses
CREATE POLICY "Pharmacies can view their responses" ON responses
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Pharmacies can create responses" ON responses
  FOR INSERT WITH CHECK (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
    AND request_id IN (
      SELECT id FROM requests WHERE pharmacy_id = responses.pharmacy_id
    )
  );

-- RLS Policies for drugs (public read access)
CREATE POLICY "Anyone can view drugs" ON drugs
  FOR SELECT USING (true);

-- Function to increment accepted patients count
CREATE OR REPLACE FUNCTION increment_accepted_patients()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.accepted = true THEN
    UPDATE pharmacies 
    SET accepted_patients_count = accepted_patients_count + 1
    WHERE id = NEW.pharmacy_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-incrementing accepted patients
CREATE TRIGGER trg_increment_accepted_patients
  AFTER INSERT ON responses
  FOR EACH ROW 
  EXECUTE FUNCTION increment_accepted_patients();

-- Function to search drugs with fuzzy matching
CREATE OR REPLACE FUNCTION search_drugs(
  search_query TEXT,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  code VARCHAR,
  name VARCHAR,
  name_kana VARCHAR,
  type VARCHAR,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.code,
    d.name,
    d.name_kana,
    d.type,
    GREATEST(
      similarity(d.name, search_query),
      COALESCE(similarity(d.name_kana, search_query), 0)
    ) AS similarity
  FROM drugs d
  WHERE 
    d.name % search_query 
    OR (d.name_kana IS NOT NULL AND d.name_kana % search_query)
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_drugs TO authenticated;

-- Add updated_at triggers
CREATE TRIGGER update_requests_updated_at 
  BEFORE UPDATE ON requests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drugs_updated_at 
  BEFORE UPDATE ON drugs
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add function to expire old pending requests (run via cron)
CREATE OR REPLACE FUNCTION expire_old_requests()
RETURNS void AS $$
BEGIN
  UPDATE requests
  SET status = 'expired'
  WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
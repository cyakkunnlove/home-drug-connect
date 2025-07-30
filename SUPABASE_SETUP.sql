-- HOME-DRUG CONNECT Database Setup
-- このSQLをSupabase SQL Editorで実行してください

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('pharmacy_admin', 'clinic_staff', 'admin');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'pharmacy_admin',
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT NOT NULL,
  fax TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  business_hours JSONB DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  available_spots INTEGER DEFAULT 0,
  max_spots INTEGER DEFAULT 10,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for location-based queries
CREATE INDEX idx_pharmacies_location ON pharmacies USING GIST(location);
CREATE INDEX idx_pharmacies_status ON pharmacies(status);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'cancelled')),
  plan_type TEXT DEFAULT 'basic',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(stripe_customer_id),
  UNIQUE(stripe_subscription_id)
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_jpy INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create search_logs table
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  search_address TEXT,
  search_location GEOGRAPHY(POINT, 4326),
  radius_km INTEGER DEFAULT 5,
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'responded', 'closed')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pharmacy_views table
CREATE TABLE IF NOT EXISTS pharmacy_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewer_session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for pharmacies
CREATE POLICY "Anyone can view active pharmacies" ON pharmacies
  FOR SELECT USING (status = 'active');

CREATE POLICY "Pharmacy owners can view their own pharmacy" ON pharmacies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Pharmacy owners can update their own pharmacy" ON pharmacies
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Pharmacy owners can insert their own pharmacy" ON pharmacies
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history" ON payment_history
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscriptions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for inquiries
CREATE POLICY "Pharmacy owners can view their inquiries" ON inquiries
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create inquiries" ON inquiries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Pharmacy owners can update their inquiries" ON inquiries
  FOR UPDATE USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pharmacy_views
CREATE POLICY "Pharmacy owners can view their analytics" ON pharmacy_views
  FOR SELECT USING (
    pharmacy_id IN (
      SELECT id FROM pharmacies WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create views" ON pharmacy_views
  FOR INSERT WITH CHECK (true);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Create search function
CREATE OR REPLACE FUNCTION search_nearby_pharmacies(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 5
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
      radius_km * 1000
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create analytics functions
CREATE OR REPLACE FUNCTION get_daily_pharmacy_views(
  pharmacy_ids UUID[],
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
  date DATE,
  views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(pv.created_at) as date,
    COUNT(*)::BIGINT as views
  FROM pharmacy_views pv
  WHERE 
    pv.pharmacy_id = ANY(pharmacy_ids)
    AND pv.created_at >= start_date
  GROUP BY DATE(pv.created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_nearby_pharmacies TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_pharmacy_views TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
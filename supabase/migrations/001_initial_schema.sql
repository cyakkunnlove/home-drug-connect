-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('pharmacy_admin', 'clinic_staff', 'admin');
CREATE TYPE pharmacy_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE inquiry_status AS ENUM ('pending', 'read', 'replied', 'closed');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    organization_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacies table
CREATE TABLE public.pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    twenty_four_support BOOLEAN DEFAULT FALSE,
    holiday_support BOOLEAN DEFAULT FALSE,
    emergency_support BOOLEAN DEFAULT FALSE,
    max_capacity INTEGER DEFAULT 100,
    current_capacity INTEGER DEFAULT 0,
    coverage_radius_km NUMERIC(5,2) DEFAULT 5.0,
    status pharmacy_status DEFAULT 'pending',
    business_hours JSONB,
    services JSONB,
    description TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_capacity CHECK (max_capacity > 0 AND current_capacity >= 0),
    CONSTRAINT valid_capacity CHECK (current_capacity <= max_capacity)
);

-- Create spatial index for location-based queries
CREATE INDEX idx_pharmacies_location ON public.pharmacies USING GIST(location);

-- Pharmacy capabilities table
CREATE TABLE public.pharmacy_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    capability_name TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(pharmacy_id, capability_name)
);

-- Coverage areas table
CREATE TABLE public.coverage_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    coverage_polygon GEOGRAPHY(POLYGON, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_jpy INTEGER NOT NULL,
    stripe_price_id TEXT UNIQUE,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status subscription_status NOT NULL DEFAULT 'trialing',
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history table
CREATE TABLE public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    amount_jpy INTEGER NOT NULL,
    status TEXT NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries table
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    from_name TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status inquiry_status DEFAULT 'pending',
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search logs table
CREATE TABLE public.search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    search_location GEOGRAPHY(POINT, 4326),
    search_address TEXT,
    search_filters JSONB,
    results_count INTEGER,
    session_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy views/analytics table
CREATE TABLE public.pharmacy_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    viewer_session_id TEXT,
    viewer_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email notifications log
CREATE TABLE public.email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_name TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pharmacies_user_id ON public.pharmacies(user_id);
CREATE INDEX idx_pharmacies_status ON public.pharmacies(status);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_inquiries_pharmacy_id ON public.inquiries(pharmacy_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_pharmacy_views_pharmacy_id ON public.pharmacy_views(pharmacy_id);
CREATE INDEX idx_pharmacy_views_created_at ON public.pharmacy_views(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plan
INSERT INTO public.subscription_plans (name, price_jpy, features) VALUES 
('ベーシックプラン', 2200, '{"max_pharmacies": 1, "analytics": true, "priority_support": false}'::jsonb);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_views ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Pharmacies policies  
CREATE POLICY "Anyone can view active pharmacies" ON public.pharmacies
    FOR SELECT USING (status = 'active');

CREATE POLICY "Pharmacy admins can manage their pharmacies" ON public.pharmacies
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all pharmacies" ON public.pharmacies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Pharmacy capabilities policies
CREATE POLICY "Anyone can view pharmacy capabilities" ON public.pharmacy_capabilities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pharmacies 
            WHERE id = pharmacy_id AND status = 'active'
        )
    );

CREATE POLICY "Pharmacy owners can manage capabilities" ON public.pharmacy_capabilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pharmacies 
            WHERE id = pharmacy_id AND user_id = auth.uid()
        )
    );

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payment history policies
CREATE POLICY "Users can view their payment history" ON public.payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions 
            WHERE id = subscription_id AND user_id = auth.uid()
        )
    );

-- Inquiries policies
CREATE POLICY "Anyone can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Pharmacy owners can view their inquiries" ON public.inquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pharmacies 
            WHERE id = pharmacy_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Inquiry creators can view their inquiries" ON public.inquiries
    FOR SELECT USING (from_user_id = auth.uid());

-- Analytics policies
CREATE POLICY "Pharmacy owners can view their analytics" ON public.pharmacy_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pharmacies 
            WHERE id = pharmacy_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create pharmacy views" ON public.pharmacy_views
    FOR INSERT WITH CHECK (true);
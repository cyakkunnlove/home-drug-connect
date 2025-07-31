-- Performance optimization indexes for HOME-DRUG CONNECT
-- This migration adds indexes based on the actual database schema

-- Enable trigram extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 1. Pharmacy Search Optimization
-- ============================================

-- Composite index for active pharmacy searches with location
CREATE INDEX IF NOT EXISTS idx_pharmacies_active_location 
ON pharmacies USING GIST(location) 
WHERE status = 'active';

-- Index for capacity-based filtering (using actual column names)
CREATE INDEX IF NOT EXISTS idx_pharmacies_capacity 
ON pharmacies(max_capacity, current_capacity) 
WHERE status = 'active';

-- Composite index for service filtering
CREATE INDEX IF NOT EXISTS idx_pharmacies_services 
ON pharmacies(twenty_four_support, holiday_support, emergency_support) 
WHERE status = 'active';

-- Index for pharmacy name search (trigram for fuzzy search)
CREATE INDEX IF NOT EXISTS idx_pharmacies_name_trgm 
ON pharmacies USING gin(name gin_trgm_ops);

-- Index for pharmacy address search
CREATE INDEX IF NOT EXISTS idx_pharmacies_address_trgm 
ON pharmacies USING gin(address gin_trgm_ops);

-- ============================================
-- 2. Search Analytics Optimization
-- ============================================

-- Index for search logs by timestamp
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at 
ON search_logs(created_at DESC);

-- Index for search location queries
CREATE INDEX IF NOT EXISTS idx_search_logs_location 
ON search_logs USING GIST(search_location);

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_logs_analytics 
ON search_logs(created_at DESC, session_id);

-- Index for search_logs filters (actual column name)
CREATE INDEX IF NOT EXISTS idx_search_logs_filters 
ON search_logs USING GIN(filters);

-- Index for results count
CREATE INDEX IF NOT EXISTS idx_search_logs_results 
ON search_logs(results_count);

-- ============================================
-- 3. User and Authentication Optimization
-- ============================================

-- Index for user role queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role, created_at DESC);

-- Index for user email lookup
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email));

-- Index for company-based user queries
CREATE INDEX IF NOT EXISTS idx_users_company 
ON users(company_id, created_at DESC) 
WHERE company_id IS NOT NULL;

-- ============================================
-- 4. Request Management Optimization
-- ============================================

-- Index for active requests
CREATE INDEX IF NOT EXISTS idx_requests_active 
ON requests(status, created_at DESC) 
WHERE status IN ('pending', 'accepted');

-- Index for doctor request history
CREATE INDEX IF NOT EXISTS idx_requests_doctor_history 
ON requests(doctor_id, created_at DESC);

-- Index for pharmacy request management
CREATE INDEX IF NOT EXISTS idx_requests_pharmacy 
ON requests(pharmacy_id, status, created_at DESC);

-- ============================================
-- 5. Drug Search Optimization
-- ============================================

-- Index for drug name search
CREATE INDEX IF NOT EXISTS idx_drugs_name_trgm 
ON drugs USING gin(name gin_trgm_ops);

-- Index for drug name kana search
CREATE INDEX IF NOT EXISTS idx_drugs_name_kana_trgm 
ON drugs USING gin(name_kana gin_trgm_ops);

-- Index for drug type filtering
CREATE INDEX IF NOT EXISTS idx_drugs_type 
ON drugs(type);

-- ============================================
-- 6. Review Optimization
-- ============================================

-- Index for pharmacy reviews
CREATE INDEX IF NOT EXISTS idx_reviews_pharmacy 
ON reviews(pharmacy_id, created_at DESC);

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user 
ON reviews(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================
-- 7. Inquiry Management
-- ============================================

-- Index for unread inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_unread 
ON inquiries(status, created_at DESC) 
WHERE status = 'unread';

-- Index for pharmacy inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_pharmacy 
ON inquiries(pharmacy_id, created_at DESC) 
WHERE pharmacy_id IS NOT NULL;

-- ============================================
-- 8. Performance Statistics Views
-- ============================================

-- Create materialized view for pharmacy statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS v_pharmacy_performance_stats AS
SELECT 
    p.id,
    p.name,
    p.address,
    p.status,
    COUNT(DISTINCT r.id) as total_requests,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'accepted') as accepted_requests,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'rejected') as rejected_requests,
    COUNT(DISTINCT r.doctor_id) as unique_doctors,
    COUNT(DISTINCT rv.id) as total_reviews,
    ROUND(AVG(rv.rating)::NUMERIC, 2) as avg_rating,
    MAX(r.created_at) as last_request_at
FROM pharmacies p
LEFT JOIN requests r ON r.pharmacy_id = p.id
LEFT JOIN reviews rv ON rv.pharmacy_id = p.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.address, p.status;

-- Index for the materialized view
CREATE INDEX IF NOT EXISTS idx_pharmacy_performance_stats_id 
ON v_pharmacy_performance_stats(id);

-- ============================================
-- 9. Search Performance Monitoring
-- ============================================

-- Create table for query performance tracking
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_type TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    result_count INTEGER,
    parameters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance analysis
CREATE INDEX IF NOT EXISTS idx_query_performance_type_time 
ON query_performance_log(query_type, created_at DESC);

-- ============================================
-- 10. Company and Subscription Indexes
-- ============================================

-- Index for company status
CREATE INDEX IF NOT EXISTS idx_companies_status 
ON companies(status) 
WHERE status = 'active';

-- Index for subscription status
CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON subscriptions(status, current_period_end) 
WHERE status IN ('active', 'trialing');

-- Index for user subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user 
ON subscriptions(user_id) 
WHERE user_id IS NOT NULL;

-- ============================================
-- 11. Response Management
-- ============================================

-- Index for request responses
CREATE INDEX IF NOT EXISTS idx_responses_request 
ON responses(request_id);

-- Index for pharmacy responses
CREATE INDEX IF NOT EXISTS idx_responses_pharmacy 
ON responses(pharmacy_id, responded_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_pharmacies_active_location IS 'Spatial index for active pharmacy location searches';
COMMENT ON INDEX idx_pharmacies_capacity IS 'Index for filtering pharmacies by available capacity';
COMMENT ON INDEX idx_pharmacies_services IS 'Composite index for service-based pharmacy filtering';
COMMENT ON INDEX idx_search_logs_analytics IS 'Optimized index for search analytics queries';
COMMENT ON MATERIALIZED VIEW v_pharmacy_performance_stats IS 'Aggregated pharmacy performance metrics for dashboard';
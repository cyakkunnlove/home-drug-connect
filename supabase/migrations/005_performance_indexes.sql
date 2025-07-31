-- Performance optimization indexes for HOME-DRUG CONNECT
-- This migration adds comprehensive indexes to improve query performance at scale

-- ============================================
-- 1. Pharmacy Search Optimization
-- ============================================

-- Composite index for active pharmacy searches with location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacies_active_location 
ON pharmacies USING GIST(location) 
WHERE status = 'active';

-- Index for capacity-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacies_capacity 
ON pharmacies(max_capacity, current_capacity) 
WHERE status = 'active';

-- Composite index for service filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacies_services 
ON pharmacies(twenty_four_support, holiday_support, emergency_support) 
WHERE status = 'active';

-- Index for pharmacy name search (trigram for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacies_name_trgm 
ON pharmacies USING gin(name gin_trgm_ops);

-- ============================================
-- 2. Search Analytics Optimization
-- ============================================

-- Index for search logs by timestamp
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_logs_created_at 
ON search_logs(created_at DESC);

-- Index for search location queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_logs_location 
ON search_logs USING GIST(search_location);

-- Composite index for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_logs_analytics 
ON search_logs(created_at DESC, session_id) 
INCLUDE (search_filters, results_count);

-- ============================================
-- 3. User and Authentication Optimization
-- ============================================

-- Index for user role queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role) 
WHERE role IN ('doctor', 'pharmacy_admin');

-- Index for user email lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower 
ON users(lower(email));

-- ============================================
-- 4. Request Management Optimization
-- ============================================

-- Composite index for request queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_pharmacy 
ON requests(status, pharmacy_id, created_at DESC);

-- Index for doctor's requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_doctor 
ON requests(doctor_id, created_at DESC);

-- Index for patient name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_patient_name 
ON requests USING gin(patient_name gin_trgm_ops);

-- Index for request message search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_message_search 
ON requests USING gin(to_tsvector('japanese', message));

-- ============================================
-- 5. Subscription and Payment Optimization
-- ============================================

-- Index for active subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_active 
ON subscriptions(user_id, status) 
WHERE status = 'active';

-- Index for subscription expiry monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_expiry 
ON subscriptions(current_period_end) 
WHERE status IN ('active', 'trialing');

-- ============================================
-- 6. Inquiry Management Optimization
-- ============================================

-- Composite index for pharmacy inquiries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inquiries_pharmacy_status 
ON inquiries(pharmacy_id, status, created_at DESC);

-- Index for unread inquiries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inquiries_unread 
ON inquiries(pharmacy_id, created_at DESC) 
WHERE status = 'pending';

-- ============================================
-- 7. Analytics and Monitoring Optimization
-- ============================================

-- Index for pharmacy view analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacy_views_analytics 
ON pharmacy_views(pharmacy_id, created_at DESC);

-- Partial index for recent views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pharmacy_views_recent 
ON pharmacy_views(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================
-- 8. Performance Statistics
-- ============================================

-- Create table to track index usage
CREATE TABLE IF NOT EXISTS index_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    index_scans BIGINT DEFAULT 0,
    index_size TEXT,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update index statistics
CREATE OR REPLACE FUNCTION update_index_stats() RETURNS void AS $$
BEGIN
    INSERT INTO index_usage_stats (index_name, table_name, index_scans, index_size, last_used)
    SELECT 
        indexrelname::text as index_name,
        tablename::text as table_name,
        idx_scan as index_scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        NOW() as last_used
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ON CONFLICT (index_name) DO UPDATE
    SET 
        index_scans = EXCLUDED.index_scans,
        index_size = EXCLUDED.index_size,
        last_used = EXCLUDED.last_used;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Query Performance Views
-- ============================================

-- View for slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    mean_exec_time,
    total_exec_time,
    calls,
    100.0 * total_exec_time / sum(total_exec_time) OVER () AS percent_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
ORDER BY mean_exec_time DESC
LIMIT 20;

-- View for missing indexes
CREATE OR REPLACE VIEW v_missing_indexes AS
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND n_distinct > 100
    AND correlation < 0.1
ORDER BY n_distinct DESC;

-- ============================================
-- 10. Maintenance Configuration
-- ============================================

-- Update autovacuum settings for high-traffic tables
ALTER TABLE pharmacies SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.01
);

ALTER TABLE search_logs SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE requests SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.02
);

-- Add comment for documentation
COMMENT ON SCHEMA public IS 'Performance optimized schema for HOME-DRUG CONNECT with comprehensive indexing strategy';
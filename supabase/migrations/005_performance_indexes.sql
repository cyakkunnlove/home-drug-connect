-- Performance optimization indexes for HOME-DRUG CONNECT
-- This migration adds comprehensive indexes to improve query performance at scale
-- Note: CONCURRENTLY removed for Supabase migration compatibility
-- Note: INCLUDE clause removed for PostgreSQL compatibility

-- ============================================
-- 1. Pharmacy Search Optimization
-- ============================================

-- Enable trigram extension first
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite index for active pharmacy searches with location
CREATE INDEX IF NOT EXISTS idx_pharmacies_active_location 
ON pharmacies USING GIST(location) 
WHERE status = 'active';

-- Index for capacity-based filtering
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

-- Additional indexes for search_logs columns
CREATE INDEX IF NOT EXISTS idx_search_logs_filters 
ON search_logs USING GIN(search_filters);

CREATE INDEX IF NOT EXISTS idx_search_logs_results 
ON search_logs(results_count);

-- ============================================
-- 3. User and Authentication Optimization
-- ============================================

-- Index for user role queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role, created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for user email lookup
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON users(LOWER(email)) 
WHERE deleted_at IS NULL;

-- ============================================
-- 4. Request Management Optimization
-- ============================================

-- Index for active requests
CREATE INDEX IF NOT EXISTS idx_requests_active 
ON requests(status, created_at DESC) 
WHERE status IN ('pending', 'accepted');

-- Index for user request history
CREATE INDEX IF NOT EXISTS idx_requests_user_history 
ON requests(user_id, created_at DESC);

-- Index for pharmacy request management
CREATE INDEX IF NOT EXISTS idx_requests_pharmacy 
ON requests(pharmacy_id, status, created_at DESC);

-- Index for scheduled pickup times
CREATE INDEX IF NOT EXISTS idx_requests_pickup_time 
ON requests(preferred_pickup_time) 
WHERE status = 'accepted';

-- ============================================
-- 5. Medication Search Optimization
-- ============================================

-- Index for medication name search
CREATE INDEX IF NOT EXISTS idx_medications_name_trgm 
ON medications USING gin(name gin_trgm_ops);

-- Index for medication type filtering
CREATE INDEX IF NOT EXISTS idx_medications_type 
ON medications(type, is_active) 
WHERE is_active = true;

-- ============================================
-- 6. Message Thread Optimization
-- ============================================

-- Index for unread messages
CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages(thread_id, created_at DESC) 
WHERE is_read = false;

-- Index for message threads by participant
CREATE INDEX IF NOT EXISTS idx_message_threads_pharmacy 
ON message_threads(pharmacy_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_message_threads_user 
ON message_threads(user_id, updated_at DESC);

-- ============================================
-- 7. Notification Optimization
-- ============================================

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(recipient_id, created_at DESC) 
WHERE read_at IS NULL;

-- Index for notification type queries
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(notification_type, recipient_id, created_at DESC);

-- ============================================
-- 8. Performance Statistics Views
-- ============================================

-- Create materialized view for pharmacy statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS v_pharmacy_performance_stats AS
SELECT 
    p.id,
    p.name,
    COUNT(DISTINCT r.id) as total_requests,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed') as completed_requests,
    AVG(EXTRACT(EPOCH FROM (r.updated_at - r.created_at))/3600) 
        FILTER (WHERE r.status = 'completed') as avg_completion_hours,
    COUNT(DISTINCT r.user_id) as unique_patients,
    ROUND(AVG(rr.rating), 2) as avg_rating,
    COUNT(rr.id) as total_reviews
FROM pharmacies p
LEFT JOIN requests r ON r.pharmacy_id = p.id
LEFT JOIN request_reviews rr ON rr.request_id = r.id
WHERE p.status = 'active'
GROUP BY p.id, p.name;

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

-- Add comments for documentation
COMMENT ON INDEX idx_pharmacies_active_location IS 'Spatial index for active pharmacy location searches';
COMMENT ON INDEX idx_pharmacies_capacity IS 'Index for filtering pharmacies by available capacity';
COMMENT ON INDEX idx_pharmacies_services IS 'Composite index for service-based pharmacy filtering';
COMMENT ON INDEX idx_search_logs_analytics IS 'Optimized index for search analytics queries';
COMMENT ON MATERIALIZED VIEW v_pharmacy_performance_stats IS 'Aggregated pharmacy performance metrics for dashboard';
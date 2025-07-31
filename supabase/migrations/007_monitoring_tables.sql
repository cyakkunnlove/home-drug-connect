-- Monitoring tables for performance tracking and analytics
-- Stores web vitals, API performance, and system metrics

-- ============================================
-- 1. Performance Metrics Table
-- ============================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    rating TEXT CHECK (rating IN ('good', 'needs-improvement', 'poor')),
    url TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at 
ON performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_session 
ON performance_metrics(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_rating 
ON performance_metrics(metric_name, rating, created_at DESC);

-- ============================================
-- 2. API Performance Table
-- ============================================

CREATE TABLE IF NOT EXISTS api_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    request_size INTEGER,
    response_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for API performance analysis
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint 
ON api_performance(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_performance_status 
ON api_performance(status_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_performance_duration 
ON api_performance(duration_ms DESC) 
WHERE duration_ms > 1000;

-- ============================================
-- 3. Error Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    url TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for error analysis
CREATE INDEX IF NOT EXISTS idx_error_logs_type 
ON error_logs(error_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_user 
ON error_logs(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================
-- 4. System Health Metrics
-- ============================================

CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    threshold_status TEXT CHECK (threshold_status IN ('healthy', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for health monitoring
CREATE INDEX IF NOT EXISTS idx_system_health_type_status 
ON system_health(metric_type, threshold_status, created_at DESC);

-- ============================================
-- 5. Aggregated Metrics Views
-- ============================================

-- Web Vitals Summary View
CREATE OR REPLACE VIEW v_web_vitals_summary AS
SELECT 
    metric_name,
    date_trunc('hour', created_at) AS hour,
    COUNT(*) AS sample_count,
    ROUND(AVG(metric_value)::NUMERIC, 2) AS avg_value,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY metric_value)::NUMERIC, 2) AS median_value,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY metric_value)::NUMERIC, 2) AS p75_value,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value)::NUMERIC, 2) AS p95_value,
    COUNT(*) FILTER (WHERE rating = 'good') AS good_count,
    COUNT(*) FILTER (WHERE rating = 'needs-improvement') AS needs_improvement_count,
    COUNT(*) FILTER (WHERE rating = 'poor') AS poor_count
FROM performance_metrics
WHERE metric_name IN ('CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP')
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY metric_name, hour
ORDER BY hour DESC, metric_name;

-- API Performance Summary View
CREATE OR REPLACE VIEW v_api_performance_summary AS
SELECT 
    endpoint,
    method,
    date_trunc('hour', created_at) AS hour,
    COUNT(*) AS request_count,
    ROUND(AVG(duration_ms)::NUMERIC, 0) AS avg_duration_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::NUMERIC, 0) AS median_duration_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::NUMERIC, 0) AS p95_duration_ms,
    COUNT(*) FILTER (WHERE status_code >= 200 AND status_code < 300) AS success_count,
    COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) AS client_error_count,
    COUNT(*) FILTER (WHERE status_code >= 500) AS server_error_count,
    ROUND((100.0 * COUNT(*) FILTER (WHERE status_code >= 400) / COUNT(*))::NUMERIC, 2) AS error_rate
FROM api_performance
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method, hour
ORDER BY hour DESC, request_count DESC;

-- ============================================
-- 6. Monitoring Functions
-- ============================================

-- Function to get current system health status
CREATE OR REPLACE FUNCTION get_system_health_status()
RETURNS TABLE (
    status TEXT,
    critical_count INTEGER,
    warning_count INTEGER,
    healthy_count INTEGER,
    last_check TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH latest_metrics AS (
        SELECT DISTINCT ON (metric_type, metric_name)
            metric_type,
            metric_name,
            threshold_status,
            created_at
        FROM system_health
        WHERE created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY metric_type, metric_name, created_at DESC
    )
    SELECT 
        CASE 
            WHEN COUNT(*) FILTER (WHERE threshold_status = 'critical') > 0 THEN 'critical'
            WHEN COUNT(*) FILTER (WHERE threshold_status = 'warning') > 0 THEN 'warning'
            ELSE 'healthy'
        END AS status,
        COUNT(*) FILTER (WHERE threshold_status = 'critical')::INTEGER AS critical_count,
        COUNT(*) FILTER (WHERE threshold_status = 'warning')::INTEGER AS warning_count,
        COUNT(*) FILTER (WHERE threshold_status = 'healthy')::INTEGER AS healthy_count,
        MAX(created_at) AS last_check
    FROM latest_metrics;
END;
$$;

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete performance metrics older than 30 days
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete API performance data older than 30 days
    DELETE FROM api_performance 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete error logs older than 90 days
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete system health data older than 7 days
    DELETE FROM system_health 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Performance metrics are write-only for authenticated users
CREATE POLICY "Authenticated users can insert performance metrics" 
ON performance_metrics FOR INSERT TO authenticated WITH CHECK (true);

-- API performance can be written by service role
CREATE POLICY "Service role can manage API performance" 
ON api_performance FOR ALL TO service_role USING (true);

-- Error logs can be written by anyone but read by admins
CREATE POLICY "Anyone can insert error logs" 
ON error_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view error logs" 
ON error_logs FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- System health is managed by service role
CREATE POLICY "Service role manages system health" 
ON system_health FOR ALL TO service_role USING (true);

-- ============================================
-- 8. Scheduled Cleanup Job
-- ============================================

-- Note: This should be set up as a cron job in your hosting environment
-- Example for pg_cron (if available):
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_monitoring_data();');

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Stores web vitals and client-side performance metrics';
COMMENT ON TABLE api_performance IS 'Tracks API endpoint performance and response times';
COMMENT ON TABLE error_logs IS 'Centralized error logging for debugging and monitoring';
COMMENT ON TABLE system_health IS 'System-wide health metrics and threshold monitoring';
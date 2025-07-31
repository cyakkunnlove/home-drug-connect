-- Optimized search functions for HOME-DRUG CONNECT
-- These functions improve query performance based on actual schema

-- ============================================
-- 1. Optimized Pharmacy Search Function
-- ============================================

CREATE OR REPLACE FUNCTION search_nearby_pharmacies_optimized(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_km NUMERIC DEFAULT 5.0,
    p_exclude_full BOOLEAN DEFAULT TRUE,
    p_required_services TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    phone TEXT,
    distance_km NUMERIC,
    twenty_four_support BOOLEAN,
    holiday_support BOOLEAN,
    emergency_support BOOLEAN,
    current_capacity INTEGER,
    max_capacity INTEGER,
    available_spots INTEGER,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    has_clean_room BOOLEAN,
    handles_narcotics BOOLEAN
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    WITH distance_calc AS (
        SELECT 
            p.id,
            p.name,
            p.address,
            p.phone,
            p.twenty_four_support,
            p.holiday_support,
            p.emergency_support,
            p.current_capacity,
            p.max_capacity,
            p.latitude,
            p.longitude,
            p.has_clean_room,
            p.handles_narcotics,
            ROUND(
                (ST_Distance(
                    p.location::geography,
                    ST_Point(p_lng, p_lat)::geography
                ) / 1000.0)::NUMERIC,
                2
            ) AS dist_km
        FROM pharmacies p
        WHERE 
            p.status = 'active'
            AND p.location IS NOT NULL
            -- Use ST_DWithin for better performance with spatial index
            AND ST_DWithin(
                p.location::geography,
                ST_Point(p_lng, p_lat)::geography,
                p_radius_km * 1000
            )
    )
    SELECT 
        dc.id,
        dc.name,
        dc.address,
        dc.phone,
        dc.dist_km AS distance_km,
        dc.twenty_four_support,
        dc.holiday_support,
        dc.emergency_support,
        dc.current_capacity,
        dc.max_capacity,
        (dc.max_capacity - dc.current_capacity) AS available_spots,
        dc.latitude AS lat,
        dc.longitude AS lng,
        dc.has_clean_room,
        dc.handles_narcotics
    FROM distance_calc dc
    WHERE 
        -- Apply capacity filter
        (NOT p_exclude_full OR dc.current_capacity < dc.max_capacity)
        -- Apply service filters
        AND (
            p_required_services IS NULL 
            OR (
                ('24時間対応' = ANY(p_required_services) AND dc.twenty_four_support)
                OR ('無菌調剤' = ANY(p_required_services) AND dc.has_clean_room)
                OR ('麻薬調剤' = ANY(p_required_services) AND dc.handles_narcotics)
            )
        )
    ORDER BY dc.dist_km ASC
    LIMIT p_limit;
END;
$$;

-- Create index on function for better performance
COMMENT ON FUNCTION search_nearby_pharmacies_optimized IS 'Optimized pharmacy search using spatial indexes and efficient distance calculation';

-- ============================================
-- 2. Batch Pharmacy Details Function
-- ============================================

CREATE OR REPLACE FUNCTION get_pharmacy_details_batch(
    p_pharmacy_ids UUID[]
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    services TEXT[],
    business_hours JSONB,
    current_capacity INTEGER,
    max_capacity INTEGER,
    twenty_four_support BOOLEAN,
    holiday_support BOOLEAN,
    emergency_support BOOLEAN,
    has_clean_room BOOLEAN,
    handles_narcotics BOOLEAN,
    accepts_emergency BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.address,
        p.phone,
        p.email,
        p.services,
        p.business_hours,
        p.current_capacity,
        p.max_capacity,
        p.twenty_four_support,
        p.holiday_support,
        p.emergency_support,
        p.has_clean_room,
        p.handles_narcotics,
        p.accepts_emergency,
        p.created_at,
        p.updated_at
    FROM pharmacies p
    WHERE p.id = ANY(p_pharmacy_ids)
    AND p.status = 'active';
END;
$$;

-- ============================================
-- 3. Search Analytics Aggregation
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_search_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    date DATE,
    total_searches BIGINT,
    unique_sessions BIGINT,
    avg_results_count NUMERIC,
    most_common_radius INTEGER,
    filter_usage JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            DATE(sl.created_at) AS search_date,
            COUNT(*) AS search_count,
            COUNT(DISTINCT sl.session_id) AS unique_sessions,
            AVG(sl.results_count) AS avg_results,
            MODE() WITHIN GROUP (ORDER BY sl.radius_km) AS common_radius,
            sl.filters
        FROM search_logs sl
        WHERE sl.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(sl.created_at), sl.filters
    ),
    filter_stats AS (
        SELECT 
            search_date,
            jsonb_object_agg(
                filter_key,
                filter_count
            ) AS filter_usage
        FROM (
            SELECT 
                search_date,
                key AS filter_key,
                COUNT(*) AS filter_count
            FROM daily_stats
            CROSS JOIN LATERAL jsonb_each(filters)
            GROUP BY search_date, key
        ) fs
        GROUP BY search_date
    )
    SELECT 
        ds.search_date AS date,
        SUM(ds.search_count) AS total_searches,
        MAX(ds.unique_sessions) AS unique_sessions,
        ROUND(AVG(ds.avg_results)::NUMERIC, 2) AS avg_results_count,
        MAX(ds.common_radius) AS most_common_radius,
        COALESCE(fs.filter_usage, '{}'::jsonb) AS filter_usage
    FROM daily_stats ds
    LEFT JOIN filter_stats fs ON ds.search_date = fs.search_date
    GROUP BY ds.search_date, fs.filter_usage
    ORDER BY ds.search_date DESC;
END;
$$;

-- ============================================
-- 4. Request Volume Analysis
-- ============================================

CREATE OR REPLACE FUNCTION analyze_request_volume(
    p_pharmacy_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    pharmacy_id UUID,
    pharmacy_name TEXT,
    total_requests BIGINT,
    accepted_requests BIGINT,
    rejected_requests BIGINT,
    pending_requests BIGINT,
    acceptance_rate NUMERIC,
    avg_daily_requests NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS pharmacy_id,
        p.name AS pharmacy_name,
        COUNT(r.id) AS total_requests,
        COUNT(r.id) FILTER (WHERE r.status = 'accepted') AS accepted_requests,
        COUNT(r.id) FILTER (WHERE r.status = 'rejected') AS rejected_requests,
        COUNT(r.id) FILTER (WHERE r.status = 'pending') AS pending_requests,
        CASE 
            WHEN COUNT(r.id) > 0 THEN
                ROUND((100.0 * COUNT(r.id) FILTER (WHERE r.status = 'accepted') / COUNT(r.id))::NUMERIC, 2)
            ELSE 0
        END AS acceptance_rate,
        ROUND(COUNT(r.id)::NUMERIC / p_days, 2) AS avg_daily_requests
    FROM pharmacies p
    LEFT JOIN requests r ON r.pharmacy_id = p.id
        AND r.created_at >= NOW() - (p_days || ' days')::INTERVAL
    WHERE 
        (p_pharmacy_id IS NULL OR p.id = p_pharmacy_id)
        AND p.status = 'active'
    GROUP BY p.id, p.name
    ORDER BY total_requests DESC;
END;
$$;

-- ============================================
-- 5. Performance Monitoring Function
-- ============================================

CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_type TEXT,
    p_execution_time_ms INTEGER,
    p_result_count INTEGER DEFAULT NULL,
    p_parameters JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO query_performance_log (
        query_type,
        execution_time_ms,
        result_count,
        parameters
    ) VALUES (
        p_query_type,
        p_execution_time_ms,
        p_result_count,
        p_parameters
    );
    
    -- Clean up old logs (keep only last 30 days)
    DELETE FROM query_performance_log
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================
-- 6. Refresh Materialized Views Function
-- ============================================

CREATE OR REPLACE FUNCTION refresh_performance_stats()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh the pharmacy performance stats
    REFRESH MATERIALIZED VIEW CONCURRENTLY v_pharmacy_performance_stats;
    
    -- Log the refresh
    PERFORM log_query_performance(
        'refresh_materialized_view',
        EXTRACT(MILLISECOND FROM clock_timestamp() - statement_timestamp())::INTEGER,
        NULL,
        jsonb_build_object('view_name', 'v_pharmacy_performance_stats')
    );
END;
$$;

-- Create a scheduled job to refresh stats (requires pg_cron extension)
-- This is a comment for documentation - actual scheduling should be done via Supabase dashboard
-- SELECT cron.schedule('refresh-pharmacy-stats', '0 2 * * *', 'SELECT refresh_performance_stats();');
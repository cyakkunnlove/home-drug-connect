-- Optimized search functions for HOME-DRUG CONNECT
-- These functions improve query performance and reduce database load

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
            p.location,
            p.services,
            -- Use more efficient distance calculation
            ROUND(
                ST_Distance(
                    p.location::geography,
                    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
                ) / 1000.0, 2
            ) AS distance_km
        FROM pharmacies p
        WHERE 
            p.status = 'active'
            -- Use bounding box for initial filtering (much faster)
            AND ST_DWithin(
                p.location::geography,
                ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
                p_radius_km * 1000
            )
            -- Apply capacity filter if requested
            AND (NOT p_exclude_full OR p.current_capacity < p.max_capacity)
    )
    SELECT 
        dc.id,
        dc.name,
        dc.address,
        dc.phone,
        dc.distance_km,
        dc.twenty_four_support,
        dc.holiday_support,
        dc.emergency_support,
        dc.current_capacity,
        dc.max_capacity,
        (dc.max_capacity - dc.current_capacity) AS available_spots,
        ST_Y(dc.location::geometry) AS lat,
        ST_X(dc.location::geometry) AS lng,
        COALESCE((dc.services->>'has_clean_room')::boolean, false) AS has_clean_room,
        COALESCE((dc.services->>'handles_narcotics')::boolean, false) AS handles_narcotics
    FROM distance_calc dc
    WHERE 
        -- Apply service filters if provided
        (p_required_services IS NULL OR (
            ('24時間対応' = ANY(p_required_services) AND dc.twenty_four_support) OR
            ('休日対応' = ANY(p_required_services) AND dc.holiday_support) OR
            ('緊急対応' = ANY(p_required_services) AND dc.emergency_support) OR
            ('無菌調剤' = ANY(p_required_services) AND COALESCE((dc.services->>'has_clean_room')::boolean, false)) OR
            ('麻薬調剤' = ANY(p_required_services) AND COALESCE((dc.services->>'handles_narcotics')::boolean, false))
        ))
    ORDER BY dc.distance_km ASC
    LIMIT p_limit;
END;
$$;

-- Create index on function for better performance
COMMENT ON FUNCTION search_nearby_pharmacies_optimized IS 'Optimized pharmacy search with efficient spatial queries and service filtering';

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
    description TEXT,
    business_hours JSONB,
    services JSONB,
    capabilities TEXT[],
    current_requests_count INTEGER,
    avg_response_time_hours NUMERIC
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
AS $$
BEGIN
    RETURN QUERY
    WITH pharmacy_stats AS (
        SELECT 
            r.pharmacy_id,
            COUNT(*) AS request_count,
            AVG(
                EXTRACT(EPOCH FROM (r.updated_at - r.created_at)) / 3600
            ) AS avg_response_hours
        FROM requests r
        WHERE 
            r.pharmacy_id = ANY(p_pharmacy_ids)
            AND r.status IN ('accepted', 'completed')
            AND r.created_at > NOW() - INTERVAL '30 days'
        GROUP BY r.pharmacy_id
    ),
    pharmacy_capabilities AS (
        SELECT 
            pc.pharmacy_id,
            ARRAY_AGG(pc.capability_name) AS capabilities
        FROM pharmacy_capabilities pc
        WHERE 
            pc.pharmacy_id = ANY(p_pharmacy_ids)
            AND pc.is_available = true
        GROUP BY pc.pharmacy_id
    )
    SELECT 
        p.id,
        p.name,
        p.address,
        p.phone,
        p.email,
        p.description,
        p.business_hours,
        p.services,
        COALESCE(cap.capabilities, ARRAY[]::TEXT[]) AS capabilities,
        COALESCE(ps.request_count, 0)::INTEGER AS current_requests_count,
        ROUND(COALESCE(ps.avg_response_hours, 0), 1) AS avg_response_time_hours
    FROM pharmacies p
    LEFT JOIN pharmacy_stats ps ON p.id = ps.pharmacy_id
    LEFT JOIN pharmacy_capabilities cap ON p.id = cap.pharmacy_id
    WHERE p.id = ANY(p_pharmacy_ids);
END;
$$;

-- ============================================
-- 3. Search Analytics Aggregation Function
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_search_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    date_hour TIMESTAMPTZ,
    total_searches INTEGER,
    unique_sessions INTEGER,
    avg_results_count NUMERIC,
    popular_filters JSONB,
    geographic_center JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH hourly_stats AS (
        SELECT 
            date_trunc('hour', sl.created_at) AS hour,
            COUNT(*) AS search_count,
            COUNT(DISTINCT sl.session_id) AS unique_sessions,
            AVG(sl.results_count) AS avg_results,
            jsonb_object_agg(
                COALESCE(filter_key, 'unknown'),
                filter_count
            ) AS filters,
            ST_AsGeoJSON(
                ST_Centroid(
                    ST_Collect(sl.search_location::geometry)
                )
            )::jsonb AS geo_center
        FROM search_logs sl
        CROSS JOIN LATERAL (
            SELECT 
                key AS filter_key,
                COUNT(*) AS filter_count
            FROM jsonb_each(sl.search_filters)
            GROUP BY key
            ORDER BY filter_count DESC
            LIMIT 5
        ) AS filter_stats
        WHERE 
            sl.created_at BETWEEN p_start_date AND p_end_date
            AND sl.search_location IS NOT NULL
        GROUP BY hour
    )
    SELECT 
        hour AS date_hour,
        search_count::INTEGER AS total_searches,
        unique_sessions::INTEGER,
        ROUND(avg_results, 1) AS avg_results_count,
        filters AS popular_filters,
        geo_center AS geographic_center
    FROM hourly_stats
    ORDER BY hour DESC;
END;
$$;

-- ============================================
-- 4. Performance Monitoring Function
-- ============================================

CREATE OR REPLACE FUNCTION monitor_query_performance()
RETURNS TABLE (
    query_pattern TEXT,
    avg_duration_ms NUMERIC,
    total_calls BIGINT,
    cache_hit_ratio NUMERIC,
    last_executed TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Ensure pg_stat_statements extension is available
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    
    RETURN QUERY
    SELECT 
        -- Simplify query pattern for grouping
        regexp_replace(
            regexp_replace(query, '\$\d+', '?', 'g'),
            '\s+', ' ', 'g'
        ) AS query_pattern,
        ROUND(AVG(mean_exec_time), 2) AS avg_duration_ms,
        SUM(calls) AS total_calls,
        ROUND(
            AVG(shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)),
            3
        ) AS cache_hit_ratio,
        MAX(stats_since) AS last_executed
    FROM pg_stat_statements
    WHERE 
        query NOT LIKE '%pg_%'
        AND query NOT LIKE '%EXPLAIN%'
        AND userid = (SELECT oid FROM pg_roles WHERE rolname = current_user)
    GROUP BY query_pattern
    ORDER BY avg_duration_ms DESC
    LIMIT 50;
END;
$$;

-- ============================================
-- 5. Connection Pool Health Check
-- ============================================

CREATE OR REPLACE FUNCTION check_connection_health()
RETURNS TABLE (
    metric_name TEXT,
    current_value NUMERIC,
    max_allowed NUMERIC,
    usage_percentage NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH connection_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE state = 'active') AS active_connections,
            COUNT(*) FILTER (WHERE state = 'idle') AS idle_connections,
            COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
            COUNT(*) AS total_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
    ),
    settings AS (
        SELECT 
            setting::integer AS max_connections
        FROM pg_settings
        WHERE name = 'max_connections'
    )
    SELECT 
        'Total Connections'::TEXT AS metric_name,
        cs.total_connections::NUMERIC AS current_value,
        s.max_connections::NUMERIC AS max_allowed,
        ROUND((cs.total_connections::NUMERIC / s.max_connections) * 100, 1) AS usage_percentage,
        CASE 
            WHEN (cs.total_connections::NUMERIC / s.max_connections) > 0.9 THEN 'CRITICAL'
            WHEN (cs.total_connections::NUMERIC / s.max_connections) > 0.7 THEN 'WARNING'
            ELSE 'HEALTHY'
        END AS status
    FROM connection_stats cs, settings s
    
    UNION ALL
    
    SELECT 
        'Active Connections'::TEXT,
        cs.active_connections::NUMERIC,
        s.max_connections::NUMERIC,
        ROUND((cs.active_connections::NUMERIC / s.max_connections) * 100, 1),
        CASE 
            WHEN cs.active_connections > 50 THEN 'WARNING'
            ELSE 'HEALTHY'
        END
    FROM connection_stats cs, settings s
    
    UNION ALL
    
    SELECT 
        'Idle Connections'::TEXT,
        cs.idle_connections::NUMERIC,
        s.max_connections::NUMERIC,
        ROUND((cs.idle_connections::NUMERIC / s.max_connections) * 100, 1),
        'INFO'::TEXT
    FROM connection_stats cs, settings s;
END;
$$;

-- ============================================
-- 6. Create Function Indexes
-- ============================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_nearby_pharmacies_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_pharmacy_details_batch TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_search_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION monitor_query_performance TO service_role;
GRANT EXECUTE ON FUNCTION check_connection_health TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION get_pharmacy_details_batch IS 'Efficiently fetch details for multiple pharmacies with stats';
COMMENT ON FUNCTION aggregate_search_analytics IS 'Aggregate search data for analytics dashboards';
COMMENT ON FUNCTION monitor_query_performance IS 'Monitor and analyze query performance metrics';
COMMENT ON FUNCTION check_connection_health IS 'Check database connection pool health';
-- Function to get daily pharmacy views
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

-- Function to get pharmacy search analytics
CREATE OR REPLACE FUNCTION get_pharmacy_search_analytics(
  pharmacy_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  search_term TEXT,
  search_count BIGINT,
  conversion_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sl.search_address as search_term,
    COUNT(DISTINCT sl.id)::BIGINT as search_count,
    COUNT(DISTINCT i.id)::BIGINT as conversion_count
  FROM search_logs sl
  LEFT JOIN inquiries i ON i.created_at BETWEEN sl.created_at AND sl.created_at + INTERVAL '1 hour'
    AND i.pharmacy_id = pharmacy_id
  WHERE 
    sl.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY sl.search_address
  ORDER BY search_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pharmacy performance metrics
CREATE OR REPLACE FUNCTION get_pharmacy_performance_metrics(
  pharmacy_id UUID,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  total_inquiries BIGINT,
  conversion_rate NUMERIC,
  avg_daily_views NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH view_stats AS (
    SELECT
      COUNT(*)::BIGINT as total_views,
      COUNT(DISTINCT COALESCE(viewer_user_id::TEXT, viewer_session_id))::BIGINT as unique_visitors,
      COUNT(*)::NUMERIC / GREATEST(EXTRACT(DAY FROM end_date - start_date), 1) as avg_daily_views
    FROM pharmacy_views
    WHERE 
      pharmacy_id = get_pharmacy_performance_metrics.pharmacy_id
      AND created_at BETWEEN start_date AND end_date
  ),
  inquiry_stats AS (
    SELECT COUNT(*)::BIGINT as total_inquiries
    FROM inquiries
    WHERE 
      pharmacy_id = get_pharmacy_performance_metrics.pharmacy_id
      AND created_at BETWEEN start_date AND end_date
  )
  SELECT
    vs.total_views,
    vs.unique_visitors,
    ins.total_inquiries,
    CASE 
      WHEN vs.total_views > 0 
      THEN ROUND((ins.total_inquiries::NUMERIC / vs.total_views) * 100, 2)
      ELSE 0
    END as conversion_rate,
    ROUND(vs.avg_daily_views, 2) as avg_daily_views
  FROM view_stats vs, inquiry_stats ins;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_daily_pharmacy_views TO authenticated;
GRANT EXECUTE ON FUNCTION get_pharmacy_search_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_pharmacy_performance_metrics TO authenticated;
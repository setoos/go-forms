/*
  # Fix Analytics Function

  1. Changes
    - Fix GROUP BY clause in campaigns query
    - Ensure proper aggregation of campaign metrics
    - Maintain existing analytics functionality

  2. Security
    - Keep security definer setting
    - Maintain existing access controls
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_platform_analytics(text);

-- Create fixed function
CREATE OR REPLACE FUNCTION get_platform_analytics(p_date_range text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date timestamptz;
  result json;
BEGIN
  -- Set date range
  v_start_date := CASE p_date_range
    WHEN '7d' THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    ELSE now() - interval '30 days'
  END;

  WITH 
    -- Calculate user stats first
    user_stats AS (
      SELECT
        COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '1 day') as daily_active_users,
        COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '30 days') as monthly_active_users
      FROM analytics_events
    ),
    -- Calculate retention separately
    user_periods AS (
      SELECT
        COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '7 days') as recent_users,
        COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days') as previous_users
      FROM analytics_events
    ),
    -- Calculate session stats
    session_metrics AS (
      SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE bounce = true) as bounce_sessions,
        SUM(EXTRACT(EPOCH FROM duration)) as total_duration
      FROM analytics_sessions
      WHERE start_time >= v_start_date
    ),
    -- Get traffic sources
    traffic_data AS (
      SELECT
        SUM(visitors) FILTER (WHERE source = 'organic') as organic_visitors,
        SUM(visitors) FILTER (WHERE source = 'paid') as paid_visitors,
        SUM(visitors) FILTER (WHERE source = 'referral') as referral_visitors,
        SUM(visitors) FILTER (WHERE source = 'direct') as direct_visitors
      FROM analytics_traffic
      WHERE date >= v_start_date::date
    ),
    -- Get page views
    page_metrics AS (
      SELECT 
        page_url,
        COUNT(*) as views,
        COUNT(DISTINCT user_id) as unique_visitors
      FROM analytics_events
      WHERE 
        created_at >= v_start_date
        AND event_type = 'page_view'
      GROUP BY page_url
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ),
    -- Get campaign metrics with proper grouping
    campaign_metrics AS (
      SELECT 
        name,
        SUM(clicks) as total_clicks,
        SUM(conversions) as total_conversions,
        SUM(cost) as total_cost
      FROM analytics_campaigns
      WHERE start_date >= v_start_date
      GROUP BY name
      ORDER BY SUM(conversions) DESC
      LIMIT 5
    )
  SELECT json_build_object(
    'dailyActiveUsers', COALESCE((SELECT daily_active_users FROM user_stats), 0),
    'monthlyActiveUsers', COALESCE((SELECT monthly_active_users FROM user_stats), 0),
    'retentionRate', CASE 
      WHEN (SELECT previous_users FROM user_periods) > 0 
      THEN ROUND((SELECT recent_users::numeric / NULLIF(previous_users, 0) * 100 FROM user_periods), 1)
      ELSE 0 
    END,
    'averageSessionDuration', CASE 
      WHEN (SELECT total_sessions FROM session_metrics) > 0 
      THEN ROUND((SELECT total_duration::numeric / NULLIF(total_sessions, 0) FROM session_metrics), 0)
      ELSE 0 
    END,
    'bounceRate', CASE 
      WHEN (SELECT total_sessions FROM session_metrics) > 0 
      THEN ROUND((SELECT bounce_sessions::numeric / NULLIF(total_sessions, 0) * 100 FROM session_metrics), 1)
      ELSE 0 
    END,
    'trafficSources', (
      SELECT json_build_object(
        'organic', COALESCE(organic_visitors, 0),
        'paid', COALESCE(paid_visitors, 0),
        'referral', COALESCE(referral_visitors, 0),
        'direct', COALESCE(direct_visitors, 0)
      )
      FROM traffic_data
    ),
    'pageViews', COALESCE((
      SELECT json_agg(
        json_build_object(
          'page', page_url,
          'views', views,
          'uniqueVisitors', unique_visitors
        )
      )
      FROM page_metrics
    ), '[]'::json),
    'campaigns', COALESCE((
      SELECT json_agg(
        json_build_object(
          'name', name,
          'clicks', total_clicks,
          'conversions', total_conversions,
          'cost', total_cost
        )
      )
      FROM campaign_metrics
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
/*
  # Platform Analytics System

  1. New Tables
    - `analytics_events` - Track user interactions and page views
    - `analytics_sessions` - Track user sessions
    - `analytics_campaigns` - Track marketing campaigns
    - `analytics_traffic` - Track traffic sources

  2. Functions
    - `get_platform_analytics` - Calculate platform-wide analytics
    - `track_user_session` - Record user session data
    - `track_page_view` - Record page views
*/

-- Create analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  event_data jsonb,
  page_url text,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create analytics sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration interval,
  pages_viewed integer DEFAULT 0,
  bounce boolean,
  traffic_source text,
  campaign_id text,
  device_type text,
  browser text,
  country text
);

-- Create analytics campaigns table
CREATE TABLE IF NOT EXISTS analytics_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL,
  medium text NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  budget numeric(10,2),
  cost numeric(10,2) DEFAULT 0,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create analytics traffic table
CREATE TABLE IF NOT EXISTS analytics_traffic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  visitors integer DEFAULT 0,
  page_views integer DEFAULT 0,
  bounce_rate numeric(5,2),
  avg_session_duration interval,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_traffic ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@vidoora.com'
  ));

CREATE POLICY "Admins can view analytics sessions"
  ON analytics_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@vidoora.com'
  ));

-- Create function to get platform analytics
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

  WITH user_stats AS (
    SELECT
      COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '1 day') as daily_active_users,
      COUNT(DISTINCT user_id) FILTER (WHERE created_at >= now() - interval '30 days') as monthly_active_users
    FROM analytics_events
  ),
  retention AS (
    SELECT
      ROUND(
        COUNT(DISTINCT CASE WHEN created_at >= now() - interval '7 days' THEN user_id END)::numeric /
        NULLIF(COUNT(DISTINCT CASE WHEN created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days' THEN user_id END), 0) * 100,
        1
      ) as retention_rate
    FROM analytics_events
  ),
  session_stats AS (
    SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM duration))::numeric, 0) as avg_session_duration,
      ROUND(COUNT(*) FILTER (WHERE bounce = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as bounce_rate
    FROM analytics_sessions
    WHERE start_time >= v_start_date
  ),
  traffic_sources AS (
    SELECT json_build_object(
      'organic', SUM(CASE WHEN source = 'organic' THEN visitors ELSE 0 END),
      'paid', SUM(CASE WHEN source = 'paid' THEN visitors ELSE 0 END),
      'referral', SUM(CASE WHEN source = 'referral' THEN visitors ELSE 0 END),
      'direct', SUM(CASE WHEN source = 'direct' THEN visitors ELSE 0 END)
    ) as sources
    FROM analytics_traffic
    WHERE date >= v_start_date::date
  ),
  page_views AS (
    SELECT json_agg(
      json_build_object(
        'page', page_url,
        'views', COUNT(*),
        'uniqueVisitors', COUNT(DISTINCT user_id)
      )
    ) as pages
    FROM analytics_events
    WHERE 
      created_at >= v_start_date
      AND event_type = 'page_view'
    GROUP BY page_url
    ORDER BY COUNT(*) DESC
    LIMIT 5
  ),
  campaigns AS (
    SELECT json_agg(
      json_build_object(
        'name', name,
        'clicks', clicks,
        'conversions', conversions,
        'cost', cost
      )
    ) as campaign_data
    FROM analytics_campaigns
    WHERE start_date >= v_start_date
    ORDER BY conversions DESC
    LIMIT 5
  )
  SELECT json_build_object(
    'dailyActiveUsers', COALESCE((SELECT daily_active_users FROM user_stats), 0),
    'monthlyActiveUsers', COALESCE((SELECT monthly_active_users FROM user_stats), 0),
    'retentionRate', COALESCE((SELECT retention_rate FROM retention), 0),
    'averageSessionDuration', COALESCE((SELECT avg_session_duration FROM session_stats), 0),
    'bounceRate', COALESCE((SELECT bounce_rate FROM session_stats), 0),
    'trafficSources', COALESCE((SELECT sources FROM traffic_sources), '{}'::json),
    'pageViews', COALESCE((SELECT pages FROM page_views), '[]'::json),
    'campaigns', COALESCE((SELECT campaign_data FROM campaigns), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

-- Create function to track user session
CREATE OR REPLACE FUNCTION track_user_session()
RETURNS trigger AS $$
BEGIN
  -- Update session duration and end time
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.duration := NEW.end_time - NEW.start_time;
    NEW.bounce := NEW.pages_viewed <= 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session tracking
CREATE TRIGGER track_session_trigger
  BEFORE UPDATE ON analytics_sessions
  FOR EACH ROW
  EXECUTE FUNCTION track_user_session();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON analytics_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_traffic_date ON analytics_traffic(date);
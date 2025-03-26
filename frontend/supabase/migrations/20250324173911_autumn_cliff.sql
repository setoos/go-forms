-- Drop existing functions first
DROP FUNCTION IF EXISTS get_platform_analytics(text);
DROP FUNCTION IF EXISTS get_quiz_analytics(uuid);

-- Create platform analytics function without nested aggregates
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
          'clicks', clicks,
          'conversions', conversions,
          'cost', cost
        )
      )
      FROM analytics_campaigns
      WHERE start_date >= v_start_date
      ORDER BY conversions DESC
      LIMIT 5
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

-- Create quiz analytics function without nested aggregates
CREATE OR REPLACE FUNCTION get_quiz_analytics(quiz_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quiz_owner uuid;
  result json;
BEGIN
  -- Check if user owns the quiz
  SELECT created_by INTO quiz_owner
  FROM quizzes q
  WHERE q.id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH 
    -- Calculate attempt statistics first
    attempt_stats AS (
      SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_attempts,
        COUNT(CASE WHEN score >= 70 THEN 1 END) as passing_attempts,
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts,
        SUM(COALESCE(score, 0)) as total_score,
        SUM(
          CASE 
            WHEN completed_at IS NOT NULL THEN 
              EXTRACT(EPOCH FROM (completed_at - started_at))
            ELSE 0 
          END
        ) as total_time
      FROM quiz_attempts qa
      WHERE qa.quiz_id = get_quiz_analytics.quiz_id
    ),
    -- Calculate question statistics separately
    question_responses AS (
      SELECT
        q.id,
        q.text,
        COUNT(qs.*) as total_responses,
        COUNT(CASE WHEN qs.final_answer->>'correct' = 'true' THEN 1 END) as correct_responses,
        SUM(COALESCE(qs.time_spent, 0)) as total_time_spent
      FROM questions q
      LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
      WHERE q.quiz_id = get_quiz_analytics.quiz_id
      GROUP BY q.id, q.text
    ),
    -- Calculate answer distribution separately
    answer_counts AS (
      SELECT
        q.id as question_id,
        qs.final_answer->>'optionId' as option_id,
        COUNT(*) as answer_count
      FROM questions q
      LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
      WHERE 
        q.quiz_id = get_quiz_analytics.quiz_id
        AND qs.final_answer->>'optionId' IS NOT NULL
      GROUP BY q.id, qs.final_answer->>'optionId'
    ),
    -- Build distribution objects
    answer_distribution AS (
      SELECT
        question_id,
        jsonb_object_agg(
          COALESCE(option_id, 'unanswered'),
          answer_count
        ) as distribution
      FROM answer_counts
      GROUP BY question_id
    )
  SELECT json_build_object(
    'totalAttempts', COALESCE((SELECT total_attempts FROM attempt_stats), 0),
    'averageScore', CASE 
      WHEN (SELECT scored_attempts FROM attempt_stats) > 0 
      THEN (SELECT total_score::float / scored_attempts FROM attempt_stats)
      ELSE 0 
    END,
    'passRate', CASE 
      WHEN (SELECT scored_attempts FROM attempt_stats) > 0 
      THEN (SELECT passing_attempts::float / scored_attempts FROM attempt_stats)
      ELSE 0 
    END,
    'completionRate', CASE 
      WHEN (SELECT total_attempts FROM attempt_stats) > 0 
      THEN (SELECT completed_attempts::float / total_attempts FROM attempt_stats)
      ELSE 0 
    END,
    'averageTimeSpent', CASE 
      WHEN (SELECT completed_attempts FROM attempt_stats) > 0 
      THEN (SELECT total_time::float / completed_attempts FROM attempt_stats)
      ELSE 0 
    END,
    'questionAnalytics', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', qr.id,
          'text', qr.text,
          'correctRate', CASE 
            WHEN qr.total_responses > 0 THEN qr.correct_responses::float / qr.total_responses 
            ELSE 0 
          END,
          'averageTimeSpent', CASE 
            WHEN qr.total_responses > 0 THEN qr.total_time_spent::float / qr.total_responses 
            ELSE 0 
          END,
          'answerDistribution', COALESCE(ad.distribution, '{}'::jsonb)
        )
      )
      FROM question_responses qr
      LEFT JOIN answer_distribution ad ON ad.question_id = qr.id
    ), '[]'::json),
    'recentAttempts', COALESCE((
      SELECT json_agg(a.*)
      FROM (
        SELECT
          qa.id,
          qa.participant_name,
          qa.participant_email,
          qa.score,
          qa.started_at,
          qa.completed_at
        FROM quiz_attempts qa
        WHERE qa.quiz_id = get_quiz_analytics.quiz_id
        ORDER BY qa.started_at DESC
        LIMIT 10
      ) a
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
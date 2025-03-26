-- Drop existing function first
DROP FUNCTION IF EXISTS get_quiz_analytics(uuid);

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

  -- Use CTEs to break down calculations and avoid nested aggregates
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
    question_stats AS (
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
    answer_distribution AS (
      SELECT
        q.id,
        jsonb_object_agg(
          COALESCE(qs.final_answer->>'optionId', 'unanswered'),
          COUNT(*)
        ) FILTER (WHERE qs.final_answer->>'optionId' IS NOT NULL) as distribution
      FROM questions q
      LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
      WHERE q.quiz_id = get_quiz_analytics.quiz_id
      GROUP BY q.id
    ),
    -- Combine question stats with distribution
    question_analytics AS (
      SELECT
        qs.id,
        qs.text,
        CASE 
          WHEN qs.total_responses > 0 THEN qs.correct_responses::float / qs.total_responses 
          ELSE 0 
        END as correct_rate,
        CASE 
          WHEN qs.total_responses > 0 THEN qs.total_time_spent::float / qs.total_responses 
          ELSE 0 
        END as average_time_spent,
        COALESCE(ad.distribution, '{}'::jsonb) as answer_distribution
      FROM question_stats qs
      LEFT JOIN answer_distribution ad ON ad.id = qs.id
    ),
    -- Format question analytics as JSON array
    question_analytics_json AS (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'text', text,
          'correctRate', correct_rate,
          'averageTimeSpent', average_time_spent,
          'answerDistribution', answer_distribution
        )
      ) as analytics
      FROM question_analytics
    ),
    -- Get recent attempts
    recent_attempts AS (
      SELECT json_agg(a.*) as attempts
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
    )
  -- Build final result combining all statistics
  SELECT json_build_object(
    'totalAttempts', a.total_attempts,
    'averageScore', CASE 
      WHEN a.scored_attempts > 0 THEN a.total_score::float / a.scored_attempts 
      ELSE 0 
    END,
    'passRate', CASE 
      WHEN a.scored_attempts > 0 THEN a.passing_attempts::float / a.scored_attempts 
      ELSE 0 
    END,
    'completionRate', CASE 
      WHEN a.total_attempts > 0 THEN a.completed_attempts::float / a.total_attempts 
      ELSE 0 
    END,
    'averageTimeSpent', CASE 
      WHEN a.completed_attempts > 0 THEN a.total_time::float / a.completed_attempts 
      ELSE 0 
    END,
    'questionAnalytics', COALESCE(q.analytics, '[]'::json),
    'recentAttempts', COALESCE(r.attempts, '[]'::json)
  ) INTO result
  FROM attempt_stats a
  CROSS JOIN question_analytics_json q
  CROSS JOIN recent_attempts r;

  RETURN result;
END;
$$;
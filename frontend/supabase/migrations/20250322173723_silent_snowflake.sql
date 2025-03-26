/*
  # Fix Quiz Analytics Function Parameter

  1. Changes
    - Update function parameter name to match frontend expectations
    - Keep all existing functionality intact

  2. Security
    - Maintain security definer and search path settings
    - Keep existing access controls
*/

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
  v_question_analytics json;
  v_recent_attempts json;
  v_quiz_stats record;
BEGIN
  -- Check if user owns the quiz
  SELECT created_by INTO quiz_owner
  FROM quizzes
  WHERE id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get quiz stats
  SELECT
    COUNT(*) as total_attempts,
    COALESCE(AVG(NULLIF(score, 0)), 0) as average_score,
    COALESCE(
      (SUM(CASE WHEN score >= 70 THEN 1 ELSE 0 END)::float / 
      NULLIF(SUM(CASE WHEN score IS NOT NULL THEN 1 ELSE 0 END), 0)),
      0
    ) as pass_rate,
    COALESCE(
      (SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END)::float / 
      NULLIF(COUNT(*), 0)),
      0
    ) as completion_rate,
    COALESCE(
      AVG(
        CASE 
          WHEN completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (completed_at - started_at))
          ELSE NULL 
        END
      ),
      0
    ) as average_time_spent
  INTO v_quiz_stats
  FROM quiz_attempts
  WHERE quiz_id = get_quiz_analytics.quiz_id;

  -- Get question analytics
  SELECT json_agg(q.*)
  INTO v_question_analytics
  FROM (
    SELECT
      q.id,
      q.text,
      COALESCE(
        (SUM(CASE WHEN qs.final_answer->>'correct' = 'true' THEN 1 ELSE 0 END)::float / 
        NULLIF(COUNT(qs.*), 0)),
        0
      ) as correct_rate,
      COALESCE(AVG(qs.time_spent), 0) as average_time_spent,
      COALESCE(
        jsonb_object_agg(
          COALESCE(qs.final_answer->>'optionId', 'unanswered'),
          COUNT(*)
        ) FILTER (WHERE qs.final_answer->>'optionId' IS NOT NULL),
        '{}'::jsonb
      ) as answer_distribution
    FROM questions q
    LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
    WHERE q.quiz_id = get_quiz_analytics.quiz_id
    GROUP BY q.id, q.text
    ORDER BY q.order
  ) q;

  -- Get recent attempts
  SELECT json_agg(a.*)
  INTO v_recent_attempts
  FROM (
    SELECT
      id,
      participant_name,
      participant_email,
      score,
      started_at,
      completed_at
    FROM quiz_attempts
    WHERE quiz_id = get_quiz_analytics.quiz_id
    ORDER BY started_at DESC
    LIMIT 10
  ) a;

  -- Build final result
  result := json_build_object(
    'totalAttempts', COALESCE(v_quiz_stats.total_attempts, 0),
    'averageScore', COALESCE(v_quiz_stats.average_score, 0),
    'passRate', COALESCE(v_quiz_stats.pass_rate, 0),
    'completionRate', COALESCE(v_quiz_stats.completion_rate, 0),
    'averageTimeSpent', COALESCE(v_quiz_stats.average_time_spent, 0),
    'questionAnalytics', COALESCE(v_question_analytics, '[]'::json),
    'recentAttempts', COALESCE(v_recent_attempts, '[]'::json)
  );

  RETURN result;
END;
$$;
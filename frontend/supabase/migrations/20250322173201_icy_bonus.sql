/*
  # Fix Quiz Analytics Function

  1. Changes
    - Remove nested aggregates by pre-computing values
    - Fix JSON construction to avoid nesting aggregates
    - Maintain all existing functionality

  2. Security
    - Function remains security definer
    - Access control checks are preserved
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
  v_total_attempts integer;
  v_average_score numeric;
  v_pass_rate numeric;
  v_completion_rate numeric;
  v_average_time_spent numeric;
BEGIN
  -- Check if user owns the quiz
  SELECT created_by INTO quiz_owner
  FROM quizzes
  WHERE quizzes.id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get quiz stats
  SELECT
    COUNT(*),
    AVG(COALESCE(score, 0)),
    COUNT(CASE WHEN score >= 70 THEN 1 END)::float / NULLIF(COUNT(CASE WHEN score IS NOT NULL THEN 1 END), 0),
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0),
    AVG(
      CASE 
        WHEN completed_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (completed_at - started_at))
        ELSE NULL 
      END
    )
  INTO
    v_total_attempts,
    v_average_score,
    v_pass_rate,
    v_completion_rate,
    v_average_time_spent
  FROM quiz_attempts qa
  WHERE qa.quiz_id = get_quiz_analytics.quiz_id;

  -- Get question analytics
  WITH question_stats AS (
    SELECT
      q.id,
      q.text,
      COUNT(CASE WHEN qs.final_answer->>'correct' = 'true' THEN 1 END)::float / NULLIF(COUNT(*), 0) as correct_rate,
      AVG(COALESCE(qs.time_spent, 0)) as average_time_spent,
      jsonb_object_agg(
        COALESCE(qs.final_answer->>'optionId', 'unanswered'),
        COUNT(*)
      ) as answer_distribution
    FROM questions q
    LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
    WHERE q.quiz_id = get_quiz_analytics.quiz_id
    GROUP BY q.id, q.text
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'text', text,
      'correctRate', correct_rate,
      'averageTimeSpent', average_time_spent,
      'answerDistribution', answer_distribution
    )
  )
  INTO v_question_analytics
  FROM question_stats;

  -- Get recent attempts
  SELECT json_agg(q.*)
  INTO v_recent_attempts
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
  ) q;

  -- Build final result
  SELECT json_build_object(
    'totalAttempts', COALESCE(v_total_attempts, 0),
    'averageScore', COALESCE(v_average_score, 0),
    'passRate', COALESCE(v_pass_rate, 0),
    'completionRate', COALESCE(v_completion_rate, 0),
    'averageTimeSpent', COALESCE(v_average_time_spent, 0),
    'questionAnalytics', COALESCE(v_question_analytics, '[]'::json),
    'recentAttempts', COALESCE(v_recent_attempts, '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;
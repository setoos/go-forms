/*
  # Add Quiz Analytics Function

  1. New Functions
    - `get_quiz_analytics` - Retrieves comprehensive analytics for a quiz
      - Total attempts
      - Average score
      - Pass rate
      - Completion rate
      - Average time spent
      - Question-level analytics
      - Recent attempts

  2. Security
    - Function is accessible only to authenticated users
    - Users can only view analytics for their own quizzes
*/

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
  FROM quizzes
  WHERE id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  WITH quiz_stats AS (
    SELECT
      COUNT(*) as total_attempts,
      AVG(COALESCE(score, 0)) as average_score,
      COUNT(CASE WHEN score >= 70 THEN 1 END)::float / NULLIF(COUNT(CASE WHEN score IS NOT NULL THEN 1 END), 0) as pass_rate,
      COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0) as completion_rate,
      AVG(
        CASE 
          WHEN completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (completed_at - started_at))
          ELSE NULL 
        END
      ) as average_time_spent
    FROM quiz_attempts
    WHERE quiz_id = get_quiz_analytics.quiz_id
  ),
  question_stats AS (
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
  ),
  recent_attempts AS (
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
  )
  SELECT json_build_object(
    'totalAttempts', COALESCE((SELECT total_attempts FROM quiz_stats), 0),
    'averageScore', COALESCE((SELECT average_score FROM quiz_stats), 0),
    'passRate', COALESCE((SELECT pass_rate FROM quiz_stats), 0),
    'completionRate', COALESCE((SELECT completion_rate FROM quiz_stats), 0),
    'averageTimeSpent', COALESCE((SELECT average_time_spent FROM quiz_stats), 0),
    'questionAnalytics', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'text', text,
          'correctRate', correct_rate,
          'averageTimeSpent', average_time_spent,
          'answerDistribution', answer_distribution
        )
      )
      FROM question_stats
    ),
    'recentAttempts', (
      SELECT json_agg(recent_attempts.*)
      FROM recent_attempts
    )
  ) INTO result;

  RETURN result;
END;
$$;
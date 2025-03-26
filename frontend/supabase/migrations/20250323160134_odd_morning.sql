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
  v_quiz_stats record;
  v_question_analytics json;
  v_recent_attempts json;
BEGIN
  -- Check if user owns the quiz
  SELECT created_by INTO quiz_owner
  FROM quizzes q
  WHERE q.id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get quiz stats first
  SELECT
    COUNT(*) as total_attempts,
    COALESCE(AVG(NULLIF(score, 0)), 0) as average_score,
    COALESCE(
      COUNT(CASE WHEN score >= 70 THEN 1 END)::float / 
      NULLIF(COUNT(CASE WHEN score IS NOT NULL THEN 1 END), 0),
      0
    ) as pass_rate,
    COALESCE(
      COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END)::float / 
      NULLIF(COUNT(*), 0),
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
  FROM quiz_attempts qa
  WHERE qa.quiz_id = get_quiz_analytics.quiz_id;

  -- Get question analytics
  WITH question_responses AS (
    SELECT
      q.id,
      q.text,
      COUNT(qs.*) as total_responses,
      COUNT(CASE WHEN qs.final_answer->>'correct' = 'true' THEN 1 END) as correct_responses,
      SUM(COALESCE(qs.time_spent, 0)) as total_time_spent,
      jsonb_object_agg(
        COALESCE(qs.final_answer->>'optionId', 'unanswered'),
        COUNT(*)
      ) FILTER (WHERE qs.final_answer->>'optionId' IS NOT NULL) as answer_distribution
    FROM questions q
    LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
    WHERE q.quiz_id = get_quiz_analytics.quiz_id
    GROUP BY q.id, q.text
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'text', text,
      'correctRate', CASE 
        WHEN total_responses > 0 THEN correct_responses::float / total_responses 
        ELSE 0 
      END,
      'averageTimeSpent', CASE 
        WHEN total_responses > 0 THEN total_time_spent::float / total_responses 
        ELSE 0 
      END,
      'answerDistribution', COALESCE(answer_distribution, '{}'::jsonb)
    )
  )
  INTO v_question_analytics
  FROM question_responses;

  -- Get recent attempts
  SELECT json_agg(a.*)
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
  ) a;

  -- Build final result
  result := json_build_object(
    'totalAttempts', v_quiz_stats.total_attempts,
    'averageScore', v_quiz_stats.average_score,
    'passRate', v_quiz_stats.pass_rate,
    'completionRate', v_quiz_stats.completion_rate,
    'averageTimeSpent', v_quiz_stats.average_time_spent,
    'questionAnalytics', COALESCE(v_question_analytics, '[]'::json),
    'recentAttempts', COALESCE(v_recent_attempts, '[]'::json)
  );

  RETURN result;
END;
$$;
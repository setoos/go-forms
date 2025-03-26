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
  FROM quizzes q
  WHERE q.id = get_quiz_analytics.quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get quiz stats using a CTE to avoid nested aggregates
  WITH attempt_stats AS (
    SELECT
      COUNT(*) as total_attempts,
      COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as scored_attempts,
      COUNT(CASE WHEN score >= 70 THEN 1 END) as passing_attempts,
      COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts,
      SUM(CASE WHEN score IS NOT NULL THEN score ELSE 0 END) as total_score,
      SUM(
        CASE 
          WHEN completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (completed_at - started_at))
          ELSE 0
        END
      ) as total_time
    FROM quiz_attempts qa
    WHERE qa.quiz_id = get_quiz_analytics.quiz_id
  )
  SELECT
    total_attempts,
    CASE 
      WHEN scored_attempts > 0 THEN total_score::float / scored_attempts 
      ELSE 0 
    END as average_score,
    CASE 
      WHEN scored_attempts > 0 THEN passing_attempts::float / scored_attempts 
      ELSE 0 
    END as pass_rate,
    CASE 
      WHEN total_attempts > 0 THEN completed_attempts::float / total_attempts 
      ELSE 0 
    END as completion_rate,
    CASE 
      WHEN completed_attempts > 0 THEN total_time::float / completed_attempts 
      ELSE 0 
    END as average_time_spent
  INTO v_quiz_stats
  FROM attempt_stats;

  -- Get question analytics using CTEs to avoid nested aggregates
  WITH question_attempts AS (
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
  )
  SELECT json_agg(
    json_build_object(
      'id', qa.id,
      'text', qa.text,
      'correctRate', CASE 
        WHEN qa.total_responses > 0 THEN qa.correct_responses::float / qa.total_responses 
        ELSE 0 
      END,
      'averageTimeSpent', CASE 
        WHEN qa.total_responses > 0 THEN qa.total_time_spent::float / qa.total_responses 
        ELSE 0 
      END,
      'answerDistribution', COALESCE(ad.distribution, '{}'::jsonb)
    )
  )
  INTO v_question_analytics
  FROM question_attempts qa
  LEFT JOIN answer_distribution ad ON ad.id = qa.id
  ORDER BY qa.id;

  -- Get recent attempts
  SELECT json_agg(ra.*)
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
  ) ra;

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
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
BEGIN
  -- Check if user owns the quiz
  SELECT created_by INTO quiz_owner
  FROM quizzes q
  WHERE q.id = quiz_id;

  IF quiz_owner IS NULL OR quiz_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Calculate attempt statistics
  WITH attempt_stats AS (
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
  )
  SELECT
    json_build_object(
      'totalAttempts', total_attempts,
      'averageScore', CASE 
        WHEN scored_attempts > 0 THEN total_score::float / scored_attempts 
        ELSE 0 
      END,
      'passRate', CASE 
        WHEN scored_attempts > 0 THEN passing_attempts::float / scored_attempts 
        ELSE 0 
      END,
      'completionRate', CASE 
        WHEN total_attempts > 0 THEN completed_attempts::float / total_attempts 
        ELSE 0 
      END,
      'averageTimeSpent', CASE 
        WHEN completed_attempts > 0 THEN total_time::float / completed_attempts 
        ELSE 0 
      END
    )
  INTO result
  FROM attempt_stats;

  -- Calculate question analytics
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

  -- Combine all results
  result := result || json_build_object(
    'questionAnalytics', COALESCE(v_question_analytics, '[]'::json),
    'recentAttempts', COALESCE(v_recent_attempts, '[]'::json)
  );

  RETURN result;
END;
$$;
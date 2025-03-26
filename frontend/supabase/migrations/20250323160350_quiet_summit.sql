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

  -- Get quiz stats first (no nested aggregates)
  SELECT
    total_attempts,
    CASE 
      WHEN total_score_count > 0 THEN total_score::float / total_score_count 
      ELSE 0 
    END as average_score,
    CASE 
      WHEN total_score_count > 0 THEN passing_count::float / total_score_count 
      ELSE 0 
    END as pass_rate,
    CASE 
      WHEN total_attempts > 0 THEN completed_count::float / total_attempts 
      ELSE 0 
    END as completion_rate,
    CASE 
      WHEN completed_count > 0 THEN total_time::float / completed_count 
      ELSE 0 
    END as average_time_spent
  INTO v_quiz_stats
  FROM (
    SELECT
      COUNT(*) as total_attempts,
      COUNT(CASE WHEN score IS NOT NULL THEN 1 END) as total_score_count,
      COUNT(CASE WHEN score >= 70 THEN 1 END) as passing_count,
      COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_count,
      SUM(score) as total_score,
      SUM(
        CASE 
          WHEN completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (completed_at - started_at))
          ELSE 0 
        END
      ) as total_time
    FROM quiz_attempts qa
    WHERE qa.quiz_id = get_quiz_analytics.quiz_id
  ) stats;

  -- Get question analytics (flattened aggregates)
  WITH base_responses AS (
    -- First get base response counts
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
  answer_counts AS (
    -- Then get answer distributions separately
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
  answer_distribution AS (
    -- Build distribution objects
    SELECT
      question_id,
      jsonb_object_agg(
        COALESCE(option_id, 'unanswered'),
        answer_count
      ) as distribution
    FROM answer_counts
    GROUP BY question_id
  )
  SELECT json_agg(
    json_build_object(
      'id', br.id,
      'text', br.text,
      'correctRate', CASE 
        WHEN br.total_responses > 0 THEN br.correct_responses::float / br.total_responses 
        ELSE 0 
      END,
      'averageTimeSpent', CASE 
        WHEN br.total_responses > 0 THEN br.total_time_spent::float / br.total_responses 
        ELSE 0 
      END,
      'answerDistribution', COALESCE(ad.distribution, '{}'::jsonb)
    )
  )
  INTO v_question_analytics
  FROM base_responses br
  LEFT JOIN answer_distribution ad ON ad.question_id = br.id;

  -- Get recent attempts (simple aggregation)
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
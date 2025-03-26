-- Drop existing triggers and functions first
DO $$ 
BEGIN
  -- Drop triggers if they exist
  DROP TRIGGER IF EXISTS update_quiz_analytics_trigger ON quiz_attempts;
  DROP TRIGGER IF EXISTS update_user_progress_trigger ON quiz_attempts;
  
  -- Drop functions if they exist
  DROP FUNCTION IF EXISTS update_quiz_analytics();
  DROP FUNCTION IF EXISTS update_user_progress();
  DROP FUNCTION IF EXISTS calculate_quiz_analytics(uuid);
END $$;

-- Create function to calculate quiz analytics
CREATE OR REPLACE FUNCTION calculate_quiz_analytics(p_quiz_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_attempts integer;
  v_completions integer;
  v_total_score numeric;
  v_total_time interval;
BEGIN
  -- Calculate attempt statistics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    COALESCE(AVG(score) FILTER (WHERE score IS NOT NULL), 0),
    COALESCE(AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL), '0'::interval)
  INTO
    v_total_attempts,
    v_completions,
    v_total_score,
    v_total_time
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id;

  -- Update quiz analytics
  INSERT INTO quiz_analytics (
    quiz_id,
    total_attempts,
    completion_rate,
    average_score,
    average_time,
    last_calculated_at
  ) VALUES (
    p_quiz_id,
    v_total_attempts,
    CASE WHEN v_total_attempts > 0 THEN (v_completions::numeric / v_total_attempts) * 100 ELSE 0 END,
    v_total_score,
    v_total_time,
    now()
  )
  ON CONFLICT (quiz_id) DO UPDATE SET
    total_attempts = EXCLUDED.total_attempts,
    completion_rate = EXCLUDED.completion_rate,
    average_score = EXCLUDED.average_score,
    average_time = EXCLUDED.average_time,
    last_calculated_at = EXCLUDED.last_calculated_at;

  -- Calculate question statistics
  INSERT INTO question_analytics (
    question_id,
    total_responses,
    correct_responses,
    average_time,
    last_calculated_at
  )
  SELECT
    q.id,
    COUNT(qs.*),
    COUNT(*) FILTER (WHERE qs.final_answer->>'correct' = 'true'),
    COALESCE(AVG(qs.time_spent * interval '1 second'), '0'::interval),
    now()
  FROM questions q
  LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
  WHERE q.quiz_id = p_quiz_id
  GROUP BY q.id
  ON CONFLICT (question_id) DO UPDATE SET
    total_responses = EXCLUDED.total_responses,
    correct_responses = EXCLUDED.correct_responses,
    average_time = EXCLUDED.average_time,
    last_calculated_at = EXCLUDED.last_calculated_at;

  -- Update quiz trends
  INSERT INTO quiz_trends (
    quiz_id,
    date,
    attempts,
    completions,
    average_score,
    average_time
  )
  SELECT
    quiz_id,
    date_trunc('day', started_at)::date,
    COUNT(*),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    COALESCE(AVG(score) FILTER (WHERE score IS NOT NULL), 0),
    COALESCE(AVG(completed_at - started_at) FILTER (WHERE completed_at IS NOT NULL), '0'::interval)
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id
  AND started_at >= date_trunc('day', now())
  GROUP BY quiz_id, date_trunc('day', started_at)::date
  ON CONFLICT (quiz_id, date) DO UPDATE SET
    attempts = EXCLUDED.attempts,
    completions = EXCLUDED.completions,
    average_score = EXCLUDED.average_score,
    average_time = EXCLUDED.average_time;
END;
$$;

-- Create trigger to update analytics after quiz attempts
CREATE OR REPLACE FUNCTION update_quiz_analytics()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_quiz_analytics(NEW.quiz_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz analytics
CREATE TRIGGER update_quiz_analytics_trigger
AFTER INSERT OR UPDATE ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_quiz_analytics();

-- Create trigger to update user progress
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_progress (
    user_id,
    quiz_id,
    attempts,
    best_score,
    average_score,
    total_time,
    last_attempt_at,
    mastery_level
  )
  SELECT
    NEW.user_id,
    NEW.quiz_id,
    COUNT(*),
    MAX(score),
    AVG(score),
    SUM(completed_at - started_at),
    MAX(completed_at),
    CASE
      WHEN AVG(score) >= 90 THEN 'expert'
      WHEN AVG(score) >= 75 THEN 'advanced'
      WHEN AVG(score) >= 60 THEN 'intermediate'
      ELSE 'novice'
    END
  FROM quiz_attempts
  WHERE user_id = NEW.user_id AND quiz_id = NEW.quiz_id
  GROUP BY user_id, quiz_id
  ON CONFLICT (user_id, quiz_id) DO UPDATE SET
    attempts = EXCLUDED.attempts,
    best_score = EXCLUDED.best_score,
    average_score = EXCLUDED.average_score,
    total_time = EXCLUDED.total_time,
    last_attempt_at = EXCLUDED.last_attempt_at,
    mastery_level = EXCLUDED.mastery_level;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user progress
CREATE TRIGGER update_user_progress_trigger
AFTER INSERT OR UPDATE ON quiz_attempts
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION update_user_progress();
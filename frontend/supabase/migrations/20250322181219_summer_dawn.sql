/*
  # Fix Analytics Implementation

  1. Changes
    - Remove materialized view dependency
    - Update quiz statistics tracking
    - Fix RLS policies for analytics access

  2. Security
    - Enable RLS on all tables
    - Add proper access policies
*/

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS quiz_analytics_cache;

-- Add analytics tracking columns to quiz_attempts if they don't exist
ALTER TABLE quiz_attempts
ADD COLUMN IF NOT EXISTS time_per_question jsonb,
ADD COLUMN IF NOT EXISTS answer_changes jsonb;

-- Create function to update quiz statistics
CREATE OR REPLACE FUNCTION update_quiz_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completion count and average score
  UPDATE quizzes
  SET 
    completion_count = (
      SELECT COUNT(*) 
      FROM quiz_attempts 
      WHERE quiz_id = NEW.quiz_id
    ),
    average_score = (
      SELECT AVG(score)::numeric(5,2)
      FROM quiz_attempts 
      WHERE quiz_id = NEW.quiz_id
    )
  WHERE id = NEW.quiz_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz statistics
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_quiz_stats_trigger'
  ) THEN
    CREATE TRIGGER update_quiz_stats_trigger
    AFTER INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_statistics();
  END IF;
END $$;

-- Create function to track question performance
CREATE OR REPLACE FUNCTION track_question_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Record answer changes and time spent
  IF NEW.final_answer IS NOT NULL THEN
    UPDATE quiz_attempts
    SET 
      time_per_question = COALESCE(time_per_question, '{}'::jsonb) || 
        jsonb_build_object(NEW.question_id, NEW.time_spent),
      answer_changes = COALESCE(answer_changes, '{}'::jsonb) || 
        jsonb_build_object(NEW.question_id, NEW.answer_history)
    WHERE id = NEW.attempt_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS track_question_performance_trigger ON quiz_sessions;

-- Create trigger for question performance tracking
CREATE TRIGGER track_question_performance_trigger
AFTER INSERT OR UPDATE ON quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION track_question_performance();

-- Enable RLS
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view their own sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can submit attempts" ON quiz_attempts;

-- Add RLS policies
CREATE POLICY "Users can view their own attempts"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Anyone can submit attempts"
  ON quiz_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
  ON quiz_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_sessions.attempt_id
      AND (
        quiz_attempts.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM quizzes
          WHERE quizzes.id = quiz_attempts.quiz_id
          AND quizzes.created_by = auth.uid()
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_attempt_id ON quiz_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_question_id ON quiz_sessions(question_id);

-- Drop existing analytics function if it exists
DROP FUNCTION IF EXISTS get_quiz_analytics(uuid);

-- Create new analytics function with proper security
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
    -- Calculate attempt statistics
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
    -- Calculate question statistics
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
    -- Calculate answer distribution
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
      SELECT json_agg(
        json_build_object(
          'id', qs.id,
          'text', qs.text,
          'correctRate', CASE 
            WHEN qs.total_responses > 0 THEN qs.correct_responses::float / qs.total_responses 
            ELSE 0 
          END,
          'averageTimeSpent', CASE 
            WHEN qs.total_responses > 0 THEN qs.total_time_spent::float / qs.total_responses 
            ELSE 0 
          END,
          'answerDistribution', COALESCE(ad.distribution, '{}'::jsonb)
        )
      ) as analytics
      FROM question_stats qs
      LEFT JOIN answer_distribution ad ON ad.id = qs.id
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
  -- Build final result
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
  CROSS JOIN question_analytics q
  CROSS JOIN recent_attempts r;

  RETURN result;
END;
$$;
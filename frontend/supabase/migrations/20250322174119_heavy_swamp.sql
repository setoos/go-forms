/*
  # Quiz Analytics Tracking System

  1. New Tables
    - `quiz_sessions` - Track detailed user interaction data
    - `quiz_attempts` - Store quiz attempt data and scores
    - `quiz_analytics` - Cache aggregated analytics data

  2. Changes
    - Add analytics tracking columns to existing tables
    - Create functions for analytics calculations
    - Set up triggers for real-time analytics updates

  3. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Add analytics tracking columns to quiz_attempts
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

-- Create trigger for question performance tracking
CREATE TRIGGER track_question_performance_trigger
AFTER INSERT OR UPDATE ON quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION track_question_performance();

-- Create analytics view for caching
CREATE MATERIALIZED VIEW IF NOT EXISTS quiz_analytics_cache AS
WITH quiz_stats AS (
  SELECT
    q.id as quiz_id,
    COUNT(qa.*) as total_attempts,
    AVG(COALESCE(qa.score, 0)) as average_score,
    COUNT(CASE WHEN qa.score >= 70 THEN 1 END)::float / 
      NULLIF(COUNT(CASE WHEN qa.score IS NOT NULL THEN 1 END), 0) as pass_rate,
    COUNT(CASE WHEN qa.completed_at IS NOT NULL THEN 1 END)::float / 
      NULLIF(COUNT(qa.*), 0) as completion_rate
  FROM quizzes q
  LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
  GROUP BY q.id
)
SELECT * FROM quiz_stats;

-- Create index for better performance
CREATE UNIQUE INDEX IF NOT EXISTS quiz_analytics_cache_quiz_id_idx 
ON quiz_analytics_cache (quiz_id);

-- Create function to refresh analytics cache
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY quiz_analytics_cache;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh cache
CREATE TRIGGER refresh_analytics_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON quiz_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_analytics_cache();

-- Enable RLS
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

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
-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS quiz_analytics_cache;

-- Drop existing refresh function and trigger
DROP FUNCTION IF EXISTS refresh_analytics_cache() CASCADE;

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
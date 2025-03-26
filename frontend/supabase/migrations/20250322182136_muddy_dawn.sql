-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can view their own sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can submit attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Anyone can submit responses" ON quiz_attempts;

-- Add RLS policies for quiz_attempts
CREATE POLICY "Anyone can submit attempts"
  ON quiz_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

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

-- Add RLS policies for quiz_sessions
CREATE POLICY "Anyone can create sessions"
  ON quiz_sessions
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

-- Ensure RLS is enabled
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
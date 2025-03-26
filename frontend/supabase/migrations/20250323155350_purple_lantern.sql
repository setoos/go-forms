-- Drop existing policies
DO $$ 
BEGIN
  -- Drop quiz_attempts policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_attempts' AND policyname = 'Users can view their own attempts'
  ) THEN
    DROP POLICY "Users can view their own attempts" ON quiz_attempts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_attempts' AND policyname = 'Anyone can submit attempts'
  ) THEN
    DROP POLICY "Anyone can submit attempts" ON quiz_attempts;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_attempts' AND policyname = 'Anyone can submit responses'
  ) THEN
    DROP POLICY "Anyone can submit responses" ON quiz_attempts;
  END IF;

  -- Drop quiz_sessions policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_sessions' AND policyname = 'Users can view their own sessions'
  ) THEN
    DROP POLICY "Users can view their own sessions" ON quiz_sessions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_sessions' AND policyname = 'Anyone can create sessions'
  ) THEN
    DROP POLICY "Anyone can create sessions" ON quiz_sessions;
  END IF;
END $$;

-- Add RLS policies for quiz_attempts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_attempts' AND policyname = 'Anyone can submit attempts'
  ) THEN
    CREATE POLICY "Anyone can submit attempts"
      ON quiz_attempts
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_attempts' AND policyname = 'Users can view their own attempts'
  ) THEN
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
  END IF;
END $$;

-- Add RLS policies for quiz_sessions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_sessions' AND policyname = 'Anyone can create sessions'
  ) THEN
    CREATE POLICY "Anyone can create sessions"
      ON quiz_sessions
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_sessions' AND policyname = 'Users can view their own sessions'
  ) THEN
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
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop quiz_analytics policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_analytics' AND policyname = 'Anyone can view quiz analytics'
  ) THEN
    DROP POLICY "Anyone can view quiz analytics" ON quiz_analytics;
  END IF;

  -- Drop question_analytics policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'question_analytics' AND policyname = 'Anyone can view question analytics'
  ) THEN
    DROP POLICY "Anyone can view question analytics" ON question_analytics;
  END IF;

  -- Drop quiz_trends policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_trends' AND policyname = 'Anyone can view quiz trends'
  ) THEN
    DROP POLICY "Anyone can view quiz trends" ON quiz_trends;
  END IF;

  -- Drop user_progress policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_progress' AND policyname = 'Users can view their own progress'
  ) THEN
    DROP POLICY "Users can view their own progress" ON user_progress;
  END IF;
END $$;

-- Create RLS policies
CREATE POLICY "Anyone can view quiz analytics"
  ON quiz_analytics
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_analytics.quiz_id
    AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
  ));

CREATE POLICY "Anyone can view question analytics"
  ON question_analytics
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM questions q
    JOIN quizzes ON quizzes.id = q.quiz_id
    WHERE q.id = question_analytics.question_id
    AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
  ));

CREATE POLICY "Anyone can view quiz trends"
  ON quiz_trends
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_trends.quiz_id
    AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
  ));

CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
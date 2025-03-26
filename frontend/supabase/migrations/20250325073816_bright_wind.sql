/*
  # Quiz Analytics System

  1. New Tables
    - `quiz_analytics` - Stores aggregated quiz statistics
    - `question_analytics` - Stores question-level performance data
    - `user_progress` - Tracks individual user progress
    - `quiz_trends` - Stores historical quiz performance data

  2. Functions
    - `calculate_quiz_analytics` - Aggregates quiz statistics
    - `update_quiz_trends` - Updates historical trend data
    - `get_quiz_insights` - Retrieves comprehensive quiz analytics
*/

-- Create quiz analytics table
CREATE TABLE IF NOT EXISTS quiz_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  total_attempts integer DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0,
  average_score numeric(5,2) DEFAULT 0,
  average_time interval,
  difficulty_rating numeric(3,2) DEFAULT 0,
  engagement_score numeric(5,2) DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id)
);

-- Create question analytics table
CREATE TABLE IF NOT EXISTS question_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  total_responses integer DEFAULT 0,
  correct_responses integer DEFAULT 0,
  average_time interval,
  difficulty_score numeric(3,2) DEFAULT 0,
  discrimination_index numeric(3,2) DEFAULT 0,
  last_calculated_at timestamptz DEFAULT now(),
  UNIQUE(question_id)
);

-- Create quiz trends table
CREATE TABLE IF NOT EXISTS quiz_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  date date NOT NULL,
  attempts integer DEFAULT 0,
  completions integer DEFAULT 0,
  average_score numeric(5,2) DEFAULT 0,
  average_time interval,
  UNIQUE(quiz_id, date)
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  attempts integer DEFAULT 0,
  best_score numeric(5,2) DEFAULT 0,
  average_score numeric(5,2) DEFAULT 0,
  total_time interval DEFAULT '0'::interval,
  last_attempt_at timestamptz,
  mastery_level text CHECK (mastery_level IN ('novice', 'intermediate', 'advanced', 'expert')),
  UNIQUE(user_id, quiz_id)
);

-- Enable RLS
ALTER TABLE quiz_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_quiz_id ON quiz_analytics(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_analytics_question_id ON question_analytics(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_trends_quiz_date ON quiz_trends(quiz_id, date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_quiz ON user_progress(user_id, quiz_id);

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

-- Create function to get quiz insights
CREATE OR REPLACE FUNCTION get_quiz_insights()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH 
    -- Calculate overall quiz statistics
    quiz_stats AS (
      SELECT
        COUNT(DISTINCT q.id) as total_quizzes,
        COUNT(DISTINCT qa.id) as total_attempts,
        COALESCE(AVG(qa.score) FILTER (WHERE qa.score IS NOT NULL), 0) as overall_average_score,
        COUNT(DISTINCT qa.id) FILTER (WHERE qa.completed_at IS NOT NULL)::numeric / 
          NULLIF(COUNT(DISTINCT qa.id), 0) * 100 as overall_completion_rate
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.is_published = true
    ),
    -- Get quiz difficulty distribution
    difficulty_stats AS (
      SELECT
        q.difficulty_level,
        COUNT(*) as count
      FROM questions q
      GROUP BY q.difficulty_level
    ),
    -- Get category distribution
    category_stats AS (
      SELECT
        q.category,
        COUNT(*) as quiz_count,
        COALESCE(AVG(qa.score) FILTER (WHERE qa.score IS NOT NULL), 0) as avg_score
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.category IS NOT NULL
      GROUP BY q.category
    ),
    -- Get recent trends
    recent_trends AS (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'attempts', attempts,
          'average_score', average_score
        )
      ) as trends
      FROM quiz_trends
      WHERE date >= now() - interval '30 days'
      ORDER BY date
    ),
    -- Get top performing quizzes
    top_quizzes AS (
      SELECT json_agg(
        json_build_object(
          'id', q.id,
          'title', q.title,
          'attempts', qa.total_attempts,
          'average_score', qa.average_score,
          'completion_rate', qa.completion_rate
        )
      ) as top_quizzes
      FROM quizzes q
      JOIN quiz_analytics qa ON qa.quiz_id = q.id
      WHERE q.is_published = true
      ORDER BY qa.total_attempts DESC
      LIMIT 5
    )
  SELECT json_build_object(
    'totalQuizzes', COALESCE((SELECT total_quizzes FROM quiz_stats), 0),
    'totalAttempts', COALESCE((SELECT total_attempts FROM quiz_stats), 0),
    'overallAverageScore', COALESCE((SELECT overall_average_score FROM quiz_stats), 0),
    'overallCompletionRate', COALESCE((SELECT overall_completion_rate FROM quiz_stats), 0),
    'difficultyDistribution', (
      SELECT json_object_agg(
        difficulty_level,
        count
      )
      FROM difficulty_stats
    ),
    'categoryDistribution', (
      SELECT json_agg(
        json_build_object(
          'category', category,
          'quizCount', quiz_count,
          'averageScore', avg_score
        )
      )
      FROM category_stats
    ),
    'recentTrends', COALESCE((SELECT trends FROM recent_trends), '[]'::json),
    'topQuizzes', COALESCE((SELECT top_quizzes FROM top_quizzes), '[]'::json)
  ) INTO result;

  RETURN result;
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

CREATE TRIGGER update_user_progress_trigger
AFTER INSERT OR UPDATE ON quiz_attempts
FOR EACH ROW
WHEN (NEW.user_id IS NOT NULL)
EXECUTE FUNCTION update_user_progress();
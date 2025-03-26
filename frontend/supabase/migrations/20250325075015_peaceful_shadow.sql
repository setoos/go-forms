-- Drop existing function
DROP FUNCTION IF EXISTS get_quiz_insights();

-- Create fixed function with proper grouping
CREATE OR REPLACE FUNCTION get_quiz_insights()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH 
    -- Calculate overall quiz statistics with proper grouping
    quiz_stats AS (
      SELECT
        COUNT(DISTINCT q.id) as total_quizzes,
        COUNT(DISTINCT qa.id) as total_attempts,
        COALESCE(
          SUM(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE 0 END)::float / 
          NULLIF(COUNT(CASE WHEN qa.score IS NOT NULL THEN 1 END), 0),
          0
        ) as overall_average_score,
        COALESCE(
          COUNT(CASE WHEN qa.completed_at IS NOT NULL THEN 1 END)::float / 
          NULLIF(COUNT(qa.id), 0) * 100,
          0
        ) as overall_completion_rate
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
      WHERE q.difficulty_level IS NOT NULL
      GROUP BY q.difficulty_level
    ),
    -- Get category distribution with proper grouping
    category_stats AS (
      SELECT
        q.category,
        COUNT(DISTINCT q.id) as quiz_count,
        COALESCE(
          SUM(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE 0 END)::float / 
          NULLIF(COUNT(CASE WHEN qa.score IS NOT NULL THEN 1 END), 0),
          0
        ) as avg_score
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.category IS NOT NULL
      GROUP BY q.category
    ),
    -- Get recent trends with proper grouping
    recent_trends AS (
      SELECT
        date,
        SUM(attempts) as total_attempts,
        COALESCE(
          SUM(average_score * attempts)::float / NULLIF(SUM(attempts), 0),
          0
        ) as avg_score
      FROM quiz_trends
      WHERE date >= now() - interval '30 days'
      GROUP BY date
      ORDER BY date
    ),
    -- Get top performing quizzes
    top_quizzes AS (
      SELECT
        q.id,
        q.title,
        COUNT(qa.id) as total_attempts,
        COALESCE(
          SUM(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE 0 END)::float / 
          NULLIF(COUNT(CASE WHEN qa.score IS NOT NULL THEN 1 END), 0),
          0
        ) as average_score,
        COALESCE(
          COUNT(CASE WHEN qa.completed_at IS NOT NULL THEN 1 END)::float / 
          NULLIF(COUNT(qa.id), 0) * 100,
          0
        ) as completion_rate
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.is_published = true
      GROUP BY q.id, q.title
      ORDER BY COUNT(qa.id) DESC
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
    'recentTrends', (
      SELECT json_agg(
        json_build_object(
          'date', date,
          'attempts', total_attempts,
          'averageScore', avg_score
        )
        ORDER BY date
      )
      FROM recent_trends
    ),
    'topQuizzes', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'attempts', total_attempts,
          'averageScore', average_score,
          'completionRate', completion_rate
        )
      )
      FROM top_quizzes
    )
  ) INTO result;

  RETURN result;
END;
$$;
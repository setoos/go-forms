-- Drop existing function
DROP FUNCTION IF EXISTS get_quiz_insights();

-- Create fixed function with proper analytics aggregation
CREATE OR REPLACE FUNCTION get_quiz_insights()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH 
    -- Calculate overall quiz statistics with proper aggregation
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
        AND q.deleted_at IS NULL
    ),
    -- Get quiz difficulty distribution with proper counts
    difficulty_stats AS (
      SELECT
        COALESCE(q.difficulty_level, 'unspecified') as difficulty_level,
        COUNT(DISTINCT q.id) as count,
        COALESCE(
          AVG(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE NULL END),
          0
        ) as avg_score
      FROM questions q
      LEFT JOIN quiz_sessions qs ON qs.question_id = q.id
      LEFT JOIN quiz_attempts qa ON qa.id = qs.attempt_id
      GROUP BY q.difficulty_level
    ),
    -- Get category distribution with proper aggregation
    category_stats AS (
      SELECT
        COALESCE(q.category, 'uncategorized') as category,
        COUNT(DISTINCT q.id) as quiz_count,
        COALESCE(
          AVG(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE NULL END),
          0
        ) as avg_score,
        COUNT(DISTINCT qa.id) as attempt_count
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.deleted_at IS NULL
      GROUP BY q.category
    ),
    -- Get recent trends with proper date handling
    recent_trends AS (
      SELECT
        date_trunc('day', qa.started_at)::date as date,
        COUNT(DISTINCT qa.id) as attempts,
        COALESCE(
          AVG(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE NULL END),
          0
        ) as avg_score
      FROM quiz_attempts qa
      WHERE qa.started_at >= now() - interval '30 days'
      GROUP BY date_trunc('day', qa.started_at)::date
      ORDER BY date_trunc('day', qa.started_at)::date
    ),
    -- Get top performing quizzes with comprehensive metrics
    top_quizzes AS (
      SELECT
        q.id,
        q.title,
        COUNT(DISTINCT qa.id) as attempts,
        COALESCE(
          AVG(CASE WHEN qa.score IS NOT NULL THEN qa.score ELSE NULL END),
          0
        ) as average_score,
        COALESCE(
          COUNT(CASE WHEN qa.completed_at IS NOT NULL THEN 1 END)::float / 
          NULLIF(COUNT(qa.id), 0) * 100,
          0
        ) as completion_rate,
        MAX(qa.started_at) as last_attempt_at
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      WHERE q.is_published = true
        AND q.deleted_at IS NULL
      GROUP BY q.id, q.title
      HAVING COUNT(DISTINCT qa.id) > 0
      ORDER BY COUNT(DISTINCT qa.id) DESC
      LIMIT 5
    )
  SELECT json_build_object(
    'totalQuizzes', COALESCE((SELECT total_quizzes FROM quiz_stats), 0),
    'totalAttempts', COALESCE((SELECT total_attempts FROM quiz_stats), 0),
    'overallAverageScore', ROUND(COALESCE((SELECT overall_average_score FROM quiz_stats), 0)::numeric, 2),
    'overallCompletionRate', ROUND(COALESCE((SELECT overall_completion_rate FROM quiz_stats), 0)::numeric, 2),
    'difficultyDistribution', (
      SELECT json_object_agg(
        difficulty_level,
        json_build_object(
          'count', count,
          'averageScore', ROUND(avg_score::numeric, 2)
        )
      )
      FROM difficulty_stats
    ),
    'categoryDistribution', (
      SELECT json_agg(
        json_build_object(
          'category', category,
          'quizCount', quiz_count,
          'averageScore', ROUND(avg_score::numeric, 2),
          'attemptCount', attempt_count
        )
      )
      FROM category_stats
    ),
    'recentTrends', (
      SELECT json_agg(
        json_build_object(
          'date', to_char(date, 'YYYY-MM-DD'),
          'attempts', attempts,
          'averageScore', ROUND(avg_score::numeric, 2)
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
          'attempts', attempts,
          'averageScore', ROUND(average_score::numeric, 2),
          'completionRate', ROUND(completion_rate::numeric, 2),
          'lastAttemptAt', to_char(last_attempt_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )
      )
      FROM top_quizzes
    )
  ) INTO result;

  RETURN result;
END;
$$;
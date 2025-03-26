/*
  # Create Sample Quiz

  1. Changes
    - Creates a sample quiz with a fixed UUID
    - Adds sample questions and options
    - Sets the quiz as published

  2. Security
    - Quiz is publicly accessible
    - No authentication required to view
*/

-- Create sample quiz with a fixed UUID
INSERT INTO quizzes (id, title, description, is_published, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Marketing Awareness Quiz',
  'Test your marketing knowledge with our comprehensive assessment',
  true,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create sample questions
INSERT INTO questions (quiz_id, text, "order")
VALUES
  ('00000000-0000-0000-0000-000000000000', 'What is your primary method for measuring marketing success?', 0),
  ('00000000-0000-0000-0000-000000000000', 'How often do you update your marketing strategy?', 1),
  ('00000000-0000-0000-0000-000000000000', 'What is your approach to content marketing?', 2)
ON CONFLICT DO NOTHING;

-- Add options for each question
WITH q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000000'
  ORDER BY "order"
  LIMIT 1
)
INSERT INTO options (question_id, text, score, feedback, "order")
SELECT 
  q.id,
  unnest(ARRAY[
    'Comprehensive analytics tracking ROI and conversions',
    'Regular tracking of sales and website traffic',
    'Basic social media engagement metrics',
    'No specific measurement method'
  ]),
  unnest(ARRAY[10, 7, 4, 0]),
  unnest(ARRAY[
    'Excellent! Using multiple metrics provides a complete view.',
    'Good start! Consider expanding your metrics.',
    'Consider tracking more detailed metrics.',
    'Implementing measurement is crucial for success.'
  ]),
  generate_series(0, 3)
FROM q
ON CONFLICT DO NOTHING;

WITH q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000000'
  ORDER BY "order"
  LIMIT 1 OFFSET 1
)
INSERT INTO options (question_id, text, score, feedback, "order")
SELECT 
  q.id,
  unnest(ARRAY[
    'Quarterly reviews with data-driven adjustments',
    'Annual planning with occasional updates',
    'When sales decline',
    'Rarely or never'
  ]),
  unnest(ARRAY[10, 7, 4, 0]),
  unnest(ARRAY[
    'Perfect! Regular strategy reviews ensure optimal performance.',
    'Consider more frequent reviews to stay agile.',
    'Proactive updates can prevent sales declines.',
    'Regular updates are essential in today''s market.'
  ]),
  generate_series(0, 3)
FROM q
ON CONFLICT DO NOTHING;

WITH q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000000'
  ORDER BY "order"
  LIMIT 1 OFFSET 2
)
INSERT INTO options (question_id, text, score, feedback, "order")
SELECT 
  q.id,
  unnest(ARRAY[
    'Strategic content calendar aligned with buyer journey',
    'Regular blog posts and social media updates',
    'Occasional content when time permits',
    'No content marketing strategy'
  ]),
  unnest(ARRAY[10, 7, 4, 0]),
  unnest(ARRAY[
    'Perfect! Your content strategy is well-planned.',
    'Good start. Consider mapping content to the customer journey.',
    'A more consistent content strategy would improve results.',
    'Content marketing is essential for digital presence.'
  ]),
  generate_series(0, 3)
FROM q
ON CONFLICT DO NOTHING;
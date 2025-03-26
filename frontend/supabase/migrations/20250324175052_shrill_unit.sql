/*
  # Comprehensive Quiz System

  1. New Tables
    - Add question_type enum
    - Add support for various question formats
    - Add scoring rubrics
    - Add question metadata

  2. Changes
    - Update questions table with new fields
    - Add support for different answer types
    - Add validation rules
*/

-- Create question type enum
CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'fill_blank',
  'short_answer',
  'matching',
  'ordering',
  'essay',
  'picture_based',
  'complete_statement',
  'definition'
);

-- Add metadata type for question configuration
CREATE TYPE question_metadata AS (
  instructions text,
  points integer,
  cognitive_level text,
  difficulty_level text,
  time_limit integer,
  required boolean
);

-- Update questions table with new fields
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS type question_type DEFAULT 'multiple_choice',
ADD COLUMN IF NOT EXISTS instructions text,
ADD COLUMN IF NOT EXISTS points integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS metadata jsonb,
ADD COLUMN IF NOT EXISTS correct_answer text,
ADD COLUMN IF NOT EXISTS answer_key jsonb,
ADD COLUMN IF NOT EXISTS rubric jsonb,
ADD COLUMN IF NOT EXISTS validation_rules jsonb,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS cognitive_level text CHECK (cognitive_level IN ('recall', 'understanding', 'application', 'analysis')),
ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS time_limit integer,
ADD COLUMN IF NOT EXISTS required boolean DEFAULT true;

-- Create matching pairs table
CREATE TABLE IF NOT EXISTS matching_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  left_item text NOT NULL,
  right_item text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ordering items table
CREATE TABLE IF NOT EXISTS ordering_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  item text NOT NULL,
  correct_position integer NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create essay rubric table
CREATE TABLE IF NOT EXISTS essay_rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  criteria text NOT NULL,
  description text,
  max_points integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE matching_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordering_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_rubrics ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Questions inherit quiz access for matching pairs"
  ON matching_pairs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes ON quizzes.id = q.quiz_id
      WHERE q.id = matching_pairs.question_id
      AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
    )
  );

CREATE POLICY "Questions inherit quiz access for ordering items"
  ON ordering_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes ON quizzes.id = q.quiz_id
      WHERE q.id = ordering_items.question_id
      AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
    )
  );

CREATE POLICY "Questions inherit quiz access for essay rubrics"
  ON essay_rubrics
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN quizzes ON quizzes.id = q.quiz_id
      WHERE q.id = essay_rubrics.question_id
      AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matching_pairs_question ON matching_pairs(question_id);
CREATE INDEX IF NOT EXISTS idx_ordering_items_question ON ordering_items(question_id);
CREATE INDEX IF NOT EXISTS idx_essay_rubrics_question ON essay_rubrics(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);

-- Create sample marketing assessment quiz
INSERT INTO quizzes (
  id,
  title,
  description,
  category,
  is_published,
  created_by,
  status,
  passing_score
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Comprehensive Marketing Assessment',
  'A detailed assessment of your marketing knowledge and strategy',
  'Marketing',
  true,
  NULL,
  'published',
  70
) ON CONFLICT (id) DO NOTHING;

-- Insert sample questions
WITH quiz_id AS (SELECT '00000000-0000-0000-0000-000000000001'::uuid as id)
INSERT INTO questions (
  quiz_id,
  type,
  text,
  instructions,
  points,
  cognitive_level,
  difficulty_level,
  "order"
) VALUES
-- Multiple Choice
(
  (SELECT id FROM quiz_id),
  'multiple_choice',
  'Which of the following best describes content marketing?',
  'Select the most comprehensive and accurate definition.',
  10,
  'understanding',
  'medium',
  1
),
-- True/False
(
  (SELECT id FROM quiz_id),
  'true_false',
  'A high bounce rate always indicates poor website performance.',
  'Determine whether this statement is true or false.',
  5,
  'analysis',
  'medium',
  2
),
-- Fill in the Blank
(
  (SELECT id FROM quiz_id),
  'fill_blank',
  'The process of gradually nurturing potential customers through the sales funnel is called ________ marketing.',
  'Fill in the blank with the appropriate marketing term.',
  8,
  'recall',
  'easy',
  3
),
-- Short Answer
(
  (SELECT id FROM quiz_id),
  'short_answer',
  'Explain the concept of market segmentation and provide two examples.',
  'Answer in 2-3 sentences, providing specific examples.',
  15,
  'application',
  'medium',
  4
),
-- Matching
(
  (SELECT id FROM quiz_id),
  'matching',
  'Match the marketing terms with their correct definitions.',
  'Connect each term on the left with its corresponding definition on the right.',
  20,
  'understanding',
  'medium',
  5
),
-- Ordering
(
  (SELECT id FROM quiz_id),
  'ordering',
  'Arrange the following steps of the marketing funnel in the correct order.',
  'Order the steps from top of funnel to bottom.',
  15,
  'analysis',
  'hard',
  6
),
-- Essay
(
  (SELECT id FROM quiz_id),
  'essay',
  'Develop a comprehensive social media marketing strategy for a new fitness app.',
  'Write a detailed essay (minimum 250 words) outlining your strategy. Include target audience, platform selection, content strategy, and success metrics.',
  25,
  'analysis',
  'hard',
  7
),
-- Picture Based
(
  (SELECT id FROM quiz_id),
  'picture_based',
  'Analyze the following marketing campaign image and identify its key elements.',
  'Study the image and identify the marketing techniques used.',
  15,
  'analysis',
  'medium',
  8
),
-- Complete Statement
(
  (SELECT id FROM quiz_id),
  'complete_statement',
  'A unique selling proposition (USP) should be: \n1. ____ \n2. ____ \n3. ____',
  'Complete each part of the statement with appropriate characteristics of a USP.',
  12,
  'understanding',
  'medium',
  9
),
-- Definition
(
  (SELECT id FROM quiz_id),
  'definition',
  'Define "customer lifetime value" (CLV) and explain its importance in marketing.',
  'Provide a comprehensive definition and explain why this metric matters.',
  10,
  'understanding',
  'medium',
  10
);

-- Insert matching pairs for the matching question
WITH matching_q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
  AND type = 'matching'
  LIMIT 1
)
INSERT INTO matching_pairs (question_id, left_item, right_item, "order") 
SELECT 
  (SELECT id FROM matching_q),
  left_item,
  right_item,
  "order"
FROM (VALUES
  ('ROI', 'Return on investment measured in marketing campaigns', 1),
  ('CTA', 'Call-to-action element encouraging user response', 2),
  ('KPI', 'Key performance indicator measuring success', 3),
  ('CPC', 'Cost per click in digital advertising', 4),
  ('SEO', 'Search engine optimization for better visibility', 5)
) AS pairs(left_item, right_item, "order");

-- Insert ordering items for the ordering question
WITH ordering_q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
  AND type = 'ordering'
  LIMIT 1
)
INSERT INTO ordering_items (question_id, item, correct_position, "order")
SELECT 
  (SELECT id FROM ordering_q),
  item,
  position,
  position
FROM (VALUES
  ('Awareness', 1),
  ('Interest', 2),
  ('Consideration', 3),
  ('Intent', 4),
  ('Evaluation', 5),
  ('Purchase', 6)
) AS items(item, position);

-- Insert essay rubric
WITH essay_q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
  AND type = 'essay'
  LIMIT 1
)
INSERT INTO essay_rubrics (question_id, criteria, description, max_points)
SELECT 
  (SELECT id FROM essay_q),
  criteria,
  description,
  points
FROM (VALUES
  ('Strategy Comprehensiveness', 'Includes all required components: target audience, platform selection, content strategy, and metrics', 7),
  ('Target Audience Analysis', 'Demonstrates thorough understanding of target audience and their needs', 5),
  ('Platform Selection', 'Justifies platform choices with clear reasoning', 5),
  ('Content Strategy', 'Presents a detailed and feasible content plan', 5),
  ('Success Metrics', 'Defines clear and measurable success metrics', 3)
) AS rubric(criteria, description, points);

-- Add options for multiple choice question
WITH mc_q AS (
  SELECT id FROM questions 
  WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
  AND type = 'multiple_choice'
  LIMIT 1
)
INSERT INTO options (question_id, text, score, feedback, "order", is_correct)
SELECT 
  (SELECT id FROM mc_q),
  text,
  score,
  feedback,
  "order",
  is_correct
FROM (VALUES
  (
    'Creating and distributing valuable content to attract and retain customers',
    10,
    'Correct! This is the most comprehensive definition of content marketing.',
    1,
    true
  ),
  (
    'Writing blog posts for a company website',
    0,
    'This is just one aspect of content marketing.',
    2,
    false
  ),
  (
    'Posting regularly on social media',
    0,
    'This is only one channel of content marketing.',
    3,
    false
  ),
  (
    'Sending promotional emails to customers',
    0,
    'This is a marketing tactic but not content marketing specifically.',
    4,
    false
  )
) AS options(text, score, feedback, "order", is_correct);

-- Add answer key for true/false question
UPDATE questions 
SET answer_key = '{"correct_answer": false, "explanation": "A high bounce rate may be normal for certain types of pages or content."}'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'true_false';

-- Add answer key for fill in the blank
UPDATE questions 
SET answer_key = '{"correct_answer": "drip", "alternative_answers": ["nurture", "lead nurturing"]}'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'fill_blank';

-- Add rubric for short answer
UPDATE questions 
SET rubric = '{
  "key_points": [
    "Clear definition of market segmentation",
    "Two relevant examples",
    "Proper use of marketing terminology"
  ],
  "scoring": {
    "definition": 5,
    "examples": 8,
    "terminology": 2
  }
}'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'short_answer';

-- Add media URL for picture-based question
UPDATE questions 
SET media_url = 'https://images.unsplash.com/photo-1432888622747-4eb9a8f1fafd?q=80&w=1744'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'picture_based';

-- Add answer key for complete statement
UPDATE questions 
SET answer_key = '{
  "answers": [
    "unique and distinctive",
    "clear and specific",
    "valuable to customers"
  ],
  "scoring": {
    "per_correct": 4,
    "partial_credit": true
  }
}'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'complete_statement';

-- Add rubric for definition question
UPDATE questions 
SET rubric = '{
  "key_components": [
    "Accurate definition of CLV",
    "Explanation of importance",
    "Use of business context"
  ],
  "scoring": {
    "definition": 4,
    "importance": 4,
    "context": 2
  }
}'
WHERE quiz_id = '00000000-0000-0000-0000-000000000001' 
AND type = 'definition';
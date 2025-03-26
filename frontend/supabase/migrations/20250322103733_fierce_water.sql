/*
  # Quiz Management System Schema Update

  1. New Columns
    - Add category to quizzes
    - Add time_limit to quizzes
    - Add passing_score to quizzes
    - Add status to quizzes
    - Add soft delete support
    - Add metadata columns

  2. Indexes
    - Add indexes for improved query performance

  3. Security
    - Update RLS policies for new functionality
*/

-- Add new columns to quizzes table
DO $$ 
BEGIN
  -- Add category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'category'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN category text;
  END IF;

  -- Add time limit (in minutes)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'time_limit'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN time_limit integer;
  END IF;

  -- Add passing score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'passing_score'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN passing_score integer;
  END IF;

  -- Add status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'status'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
  END IF;

  -- Add soft delete
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN deleted_at timestamptz;
  END IF;

  -- Add metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'completion_count'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN completion_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'average_score'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN average_score numeric(5,2) DEFAULT 0;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_deleted_at ON quizzes(deleted_at);

-- Update quiz responses to track completion time
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_responses' AND column_name = 'completion_time'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN completion_time integer;
  END IF;
END $$;

-- Create function to update quiz statistics
CREATE OR REPLACE FUNCTION update_quiz_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update completion count and average score
  UPDATE quizzes
  SET 
    completion_count = (
      SELECT COUNT(*) 
      FROM quiz_responses 
      WHERE quiz_id = NEW.quiz_id
    ),
    average_score = (
      SELECT AVG(score)::numeric(5,2)
      FROM quiz_responses 
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
    AFTER INSERT OR UPDATE ON quiz_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_quiz_statistics();
  END IF;
END $$;

-- Update RLS policies
CREATE POLICY "Users can view non-deleted quizzes"
ON quizzes FOR SELECT
USING (
  deleted_at IS NULL AND 
  (is_published = true OR auth.uid() = created_by)
);

-- Function to soft delete quizzes
CREATE OR REPLACE FUNCTION soft_delete_quiz(quiz_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE quizzes
  SET 
    deleted_at = CURRENT_TIMESTAMP,
    status = 'archived'
  WHERE id = quiz_id
  AND created_by = auth.uid();
END;
$$ LANGUAGE plpgsql;
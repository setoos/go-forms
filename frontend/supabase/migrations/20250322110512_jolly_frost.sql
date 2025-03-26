/*
  # Fix Quiz Policies

  1. Changes
    - Drop and recreate quiz policies to handle soft deletes properly
    - Add index for quiz creator lookup
    - Update quiz listing to exclude soft-deleted quizzes

  2. Security
    - Ensure proper RLS policies for quiz access
    - Add policies for handling soft-deleted quizzes
*/

-- Drop all existing policies for quizzes to avoid conflicts
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Users can view non-deleted quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Anyone can view published non-deleted quizzes" ON quizzes;
END $$;

-- Create new unified policies with proper soft delete handling
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' AND policyname = 'View published or owned quizzes'
  ) THEN
    CREATE POLICY "View published or owned quizzes"
    ON quizzes FOR SELECT
    USING (
      deleted_at IS NULL AND 
      (is_published = true OR auth.uid() = created_by)
    );
  END IF;
END $$;

-- Add index for faster creator lookup if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_quizzes_created_by ON quizzes(created_by);

-- Ensure RLS is enabled
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
/*
  # Fix Soft Delete Function

  1. Changes
    - Update soft_delete_quiz function to be security definer
    - Add proper RLS checks within the function
    - Add policy for soft deletes

  2. Security
    - Ensure only quiz owners can delete their quizzes
    - Maintain RLS policies while executing function
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS soft_delete_quiz(quiz_id uuid);

-- Recreate function with security definer and proper checks
CREATE OR REPLACE FUNCTION soft_delete_quiz(quiz_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the user owns the quiz
  IF NOT EXISTS (
    SELECT 1 FROM quizzes
    WHERE id = quiz_id
    AND created_by = auth.uid()
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Access denied or quiz not found';
  END IF;

  -- Perform the soft delete
  UPDATE quizzes
  SET 
    deleted_at = CURRENT_TIMESTAMP,
    status = 'archived',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = quiz_id
  AND created_by = auth.uid();
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Add policy for soft deletes if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' 
    AND policyname = 'Users can soft delete their own quizzes'
  ) THEN
    CREATE POLICY "Users can soft delete their own quizzes"
    ON quizzes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
  END IF;
END $$;
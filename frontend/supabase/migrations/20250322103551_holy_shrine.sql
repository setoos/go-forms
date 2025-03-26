/*
  # Quiz System Schema Update

  1. Changes
    - Add quiz_id to quiz_responses table
    - Add cascade deletes for questions and options
    - Add indexes for better query performance
    - Update RLS policies for better security

  2. Security
    - Enable RLS on all tables
    - Add policies for quiz access and responses
*/

-- Add quiz_id to quiz_responses first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_responses' 
    AND column_name = 'quiz_id'
  ) THEN
    ALTER TABLE quiz_responses 
    ADD COLUMN quiz_id uuid REFERENCES quizzes(id);
  END IF;
END $$;

-- Update foreign key constraints with cascade delete
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_quiz_id_fkey'
  ) THEN
    ALTER TABLE questions
    DROP CONSTRAINT questions_quiz_id_fkey;
  END IF;

  ALTER TABLE questions
  ADD CONSTRAINT questions_quiz_id_fkey
    FOREIGN KEY (quiz_id)
    REFERENCES quizzes(id)
    ON DELETE CASCADE;
END $$;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'options_question_id_fkey'
  ) THEN
    ALTER TABLE options
    DROP CONSTRAINT options_question_id_fkey;
  END IF;

  ALTER TABLE options
  ADD CONSTRAINT options_question_id_fkey
    FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email ON quiz_responses(email);

-- Update RLS policies for quizzes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' AND policyname = 'Users can update their own quizzes'
  ) THEN
    CREATE POLICY "Users can update their own quizzes"
    ON quizzes FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' AND policyname = 'Users can delete their own quizzes'
  ) THEN
    CREATE POLICY "Users can delete their own quizzes"
    ON quizzes FOR DELETE TO authenticated
    USING (auth.uid() = created_by);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quizzes' AND policyname = 'Anyone can view published quizzes'
  ) THEN
    CREATE POLICY "Anyone can view published quizzes"
    ON quizzes FOR SELECT
    USING (is_published = true OR auth.uid() = created_by);
  END IF;
END $$;

-- Update RLS policies for questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'questions' AND policyname = 'Questions inherit quiz access'
  ) THEN
    CREATE POLICY "Questions inherit quiz access"
    ON questions FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM quizzes
        WHERE quizzes.id = questions.quiz_id
        AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
      )
    );
  END IF;
END $$;

-- Update RLS policies for options
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'options' AND policyname = 'Options inherit question access'
  ) THEN
    CREATE POLICY "Options inherit question access"
    ON options FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM questions
        JOIN quizzes ON quizzes.id = questions.quiz_id
        WHERE questions.id = options.question_id
        AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
      )
    );
  END IF;
END $$;

-- Update RLS policies for quiz responses
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_responses' AND policyname = 'Anyone can submit responses'
  ) THEN
    CREATE POLICY "Anyone can submit responses"
    ON quiz_responses FOR INSERT TO anon, authenticated
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_responses' AND policyname = 'Quiz creators can view responses'
  ) THEN
    CREATE POLICY "Quiz creators can view responses"
    ON quiz_responses FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM quizzes
        WHERE quizzes.created_by = auth.uid()
        AND quiz_responses.quiz_id = quizzes.id
      )
    );
  END IF;
END $$;
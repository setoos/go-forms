/*
  # Quiz Management System Schema

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `is_published` (boolean)
      
    - `questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, references quizzes)
      - `text` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      
    - `options`
      - `id` (uuid, primary key)
      - `question_id` (uuid, references questions)
      - `text` (text)
      - `score` (integer)
      - `feedback` (text)
      - `order` (integer)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their quizzes
    - Add policies for public access to published quizzes
*/

-- Create tables
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_published boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  text text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  text text NOT NULL,
  score integer NOT NULL,
  feedback text,
  "order" integer NOT NULL
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Policies for quizzes
CREATE POLICY "Users can create quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own quizzes"
  ON quizzes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR is_published = true);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Policies for questions
CREATE POLICY "Users can manage questions for their quizzes"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view questions for published quizzes"
  ON questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = questions.quiz_id
      AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
    )
  );

-- Policies for options
CREATE POLICY "Users can manage options for their questions"
  ON options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "Public can view options for published quizzes"
  ON options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = options.question_id
      AND (quizzes.is_published = true OR quizzes.created_by = auth.uid())
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
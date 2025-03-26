/*
  # Fix Quiz Share Policies

  1. Changes
    - Drop existing policies before recreating them
    - Add publishing controls to quizzes
    - Create quiz sharing tables with proper constraints
    - Set up RLS policies for secure access

  2. Security
    - Enable RLS on all tables
    - Add policies for quiz access
    - Add policies for attempt tracking
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can manage their quiz shares" ON quiz_shares;
  DROP POLICY IF EXISTS "Anyone can view public shares" ON quiz_shares;
  DROP POLICY IF EXISTS "Quiz creators can view attempts" ON quiz_attempts;
  DROP POLICY IF EXISTS "Users can view their own attempts" ON quiz_attempts;
  DROP POLICY IF EXISTS "Anyone can create attempts" ON quiz_attempts;
  DROP POLICY IF EXISTS "Quiz creators can view sessions" ON quiz_sessions;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- Add publishing controls to quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS share_id text UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
ADD COLUMN IF NOT EXISTS start_date timestamptz,
ADD COLUMN IF NOT EXISTS end_date timestamptz,
ADD COLUMN IF NOT EXISTS max_attempts integer,
ADD COLUMN IF NOT EXISTS access_type text DEFAULT 'public' CHECK (access_type IN ('public', 'private', 'invite')),
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS requires_auth boolean DEFAULT false;

-- Create quiz shares table
CREATE TABLE IF NOT EXISTS quiz_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  share_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  access_type text DEFAULT 'public',
  password_hash text,
  max_attempts integer,
  created_by uuid REFERENCES auth.users(id)
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  participant_email text,
  participant_name text,
  ip_address text,
  user_agent text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score integer,
  answers jsonb,
  time_per_question jsonb,
  answer_changes jsonb,
  share_id text REFERENCES quiz_shares(share_id) ON DELETE SET NULL
);

-- Create quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  time_spent integer,
  answer_history jsonb,
  final_answer jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_shares_share_id ON quiz_shares(share_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_share_id ON quiz_attempts(share_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_attempt_id ON quiz_sessions(attempt_id);

-- Enable RLS
ALTER TABLE quiz_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_shares
CREATE POLICY "quiz_shares_manage_own"
  ON quiz_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_shares.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "quiz_shares_view_public"
  ON quiz_shares
  FOR SELECT
  TO public
  USING (access_type = 'public' AND (expires_at IS NULL OR expires_at > now()));

-- RLS Policies for quiz_attempts
CREATE POLICY "quiz_attempts_view_own_quiz"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_attempts.quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

CREATE POLICY "quiz_attempts_view_own"
  ON quiz_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "quiz_attempts_create"
  ON quiz_attempts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for quiz_sessions
CREATE POLICY "quiz_sessions_view_own_quiz"
  ON quiz_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      JOIN quizzes ON quizzes.id = quiz_attempts.quiz_id
      WHERE quiz_attempts.id = quiz_sessions.attempt_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Functions for quiz publishing
CREATE OR REPLACE FUNCTION generate_quiz_share(
  p_quiz_id uuid,
  p_access_type text DEFAULT 'public',
  p_expires_at timestamptz DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_max_attempts integer DEFAULT NULL
)
RETURNS quiz_shares AS $$
DECLARE
  v_share quiz_shares;
BEGIN
  -- Verify quiz ownership
  IF NOT EXISTS (
    SELECT 1 FROM quizzes
    WHERE id = p_quiz_id
    AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Create share
  INSERT INTO quiz_shares (
    quiz_id,
    share_id,
    access_type,
    expires_at,
    password_hash,
    max_attempts,
    created_by
  ) VALUES (
    p_quiz_id,
    encode(gen_random_bytes(9), 'base64'),
    p_access_type,
    p_expires_at,
    CASE WHEN p_password IS NOT NULL THEN crypt(p_password, gen_salt('bf')) ELSE NULL END,
    p_max_attempts,
    auth.uid()
  )
  RETURNING * INTO v_share;

  RETURN v_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
/*
  # Fix Analytics Policies

  1. Changes
    - Drop and recreate analytics policies safely
    - Add sharing fields to quizzes
    - Create quiz shares table with proper constraints

  2. Security
    - Enable RLS on all tables
    - Add proper access policies
*/

-- Add sharing fields to quizzes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quizzes' AND column_name = 'share_id'
  ) THEN
    ALTER TABLE quizzes 
    ADD COLUMN share_id text UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
    ADD COLUMN access_type text DEFAULT 'public' CHECK (access_type IN ('public', 'private', 'invite')),
    ADD COLUMN password_hash text,
    ADD COLUMN requires_auth boolean DEFAULT false;
  END IF;
END $$;

-- Create quiz shares table if it doesn't exist
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

-- Enable RLS
ALTER TABLE quiz_shares ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_shares' AND policyname = 'quiz_shares_manage_own'
  ) THEN
    DROP POLICY "quiz_shares_manage_own" ON quiz_shares;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quiz_shares' AND policyname = 'quiz_shares_view_public'
  ) THEN
    DROP POLICY "quiz_shares_view_public" ON quiz_shares;
  END IF;
END $$;

-- Create new policies for quiz shares
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
  USING (
    access_type = 'public' 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Create function to generate quiz share if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'generate_quiz_share'
  ) THEN
    CREATE FUNCTION generate_quiz_share(
      p_quiz_id uuid,
      p_access_type text DEFAULT 'public',
      p_expires_at timestamptz DEFAULT NULL,
      p_password text DEFAULT NULL,
      p_max_attempts integer DEFAULT NULL
    )
    RETURNS quiz_shares
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
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
    $func$;
  END IF;
END $$;
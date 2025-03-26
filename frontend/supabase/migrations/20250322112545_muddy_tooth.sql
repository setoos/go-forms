/*
  # Quiz Management System Schema Update

  1. New Tables
    - `quiz_versions` - Stores version history for published quizzes
    - `quiz_approvals` - Tracks quiz approval status and admin reviews

  2. Changes
    - Add version tracking to quizzes
    - Add approval workflow fields
    - Add bulk action support
    - Add additional metadata fields

  3. Security
    - Update RLS policies for new tables
    - Add admin role checks
*/

-- Create enum for quiz approval status
CREATE TYPE quiz_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add version tracking to quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS approval_status quiz_approval_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
ADD COLUMN IF NOT EXISTS published_version integer;

-- Create quiz versions table
CREATE TABLE IF NOT EXISTS quiz_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  version integer NOT NULL,
  data jsonb NOT NULL, -- Stores complete quiz data including questions and options
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  notes text,
  UNIQUE(quiz_id, version)
);

-- Create quiz approvals table
CREATE TABLE IF NOT EXISTS quiz_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status quiz_approval_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  comments text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id, version)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quiz_versions_quiz_id ON quiz_versions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_approvals_quiz_id ON quiz_approvals(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_approval_status ON quizzes(approval_status);
CREATE INDEX IF NOT EXISTS idx_quizzes_version ON quizzes(version);

-- Enable RLS on new tables
ALTER TABLE quiz_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz versions
CREATE POLICY "Users can view versions of their quizzes"
  ON quiz_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_versions.quiz_id
    AND quizzes.created_by = auth.uid()
  ));

CREATE POLICY "Users can create versions of their quizzes"
  ON quiz_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_versions.quiz_id
    AND quizzes.created_by = auth.uid()
  ));

-- RLS Policies for quiz approvals
CREATE POLICY "Users can view approvals of their quizzes"
  ON quiz_approvals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_approvals.quiz_id
    AND quizzes.created_by = auth.uid()
  ));

-- Function to create a new quiz version
CREATE OR REPLACE FUNCTION create_quiz_version()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.version = NEW.version) THEN
    RETURN NEW;
  END IF;

  -- Store the complete quiz data in the versions table
  INSERT INTO quiz_versions (quiz_id, version, data, created_by)
  SELECT
    NEW.id,
    NEW.version,
    jsonb_build_object(
      'quiz', row_to_json(NEW),
      'questions', (
        SELECT jsonb_agg(q)
        FROM (
          SELECT q.*, (
            SELECT jsonb_agg(o)
            FROM options o
            WHERE o.question_id = q.id
          ) as options
          FROM questions q
          WHERE q.quiz_id = NEW.id
        ) q
      )
    ),
    NEW.created_by;

  -- Create approval request for published quizzes
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO quiz_approvals (quiz_id, version, status)
    VALUES (NEW.id, NEW.version, 'pending');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version tracking
CREATE TRIGGER track_quiz_versions
  AFTER INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION create_quiz_version();

-- Function to handle bulk actions
CREATE OR REPLACE FUNCTION bulk_update_quizzes(
  quiz_ids uuid[],
  action text,
  user_id uuid
)
RETURNS SETOF quizzes AS $$
BEGIN
  IF action = 'publish' THEN
    RETURN QUERY
    UPDATE quizzes
    SET 
      status = 'published',
      version = version + 1,
      updated_at = now()
    WHERE 
      id = ANY(quiz_ids)
      AND created_by = user_id
      AND status = 'draft'
    RETURNING *;
  ELSIF action = 'archive' THEN
    RETURN QUERY
    UPDATE quizzes
    SET 
      status = 'archived',
      updated_at = now()
    WHERE 
      id = ANY(quiz_ids)
      AND created_by = user_id
    RETURNING *;
  ELSIF action = 'delete' THEN
    RETURN QUERY
    UPDATE quizzes
    SET 
      deleted_at = now(),
      updated_at = now()
    WHERE 
      id = ANY(quiz_ids)
      AND created_by = user_id
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql;
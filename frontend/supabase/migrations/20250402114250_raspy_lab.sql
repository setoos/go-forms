/*
  # Add is_default column to report_templates table

  1. Changes
    - Add is_default column to report_templates table if it doesn't exist
    - Set default value to false
    - Ensure column is not nullable

  2. Security
    - Maintain existing RLS policies
*/

-- Add is_default column to report_templates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_templates' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE report_templates 
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- Add version column to report_templates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_templates' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE report_templates 
    ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Add quiz_id column to report_templates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'report_templates' 
    AND column_name = 'quiz_id'
  ) THEN
    ALTER TABLE report_templates 
    ADD COLUMN quiz_id UUID REFERENCES quizzes(id);
  END IF;
END $$;

-- Update existing templates to have is_default=true for the first template
UPDATE report_templates
SET is_default = true
WHERE id = (
  SELECT id FROM report_templates
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM report_templates
  WHERE is_default = true
);
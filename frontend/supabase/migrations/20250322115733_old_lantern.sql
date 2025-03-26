/*
  # Add is_correct column to options table

  1. Changes
    - Add is_correct boolean column to options table
    - Set default value to false
    - Update existing records based on score

  2. Security
    - Maintain existing RLS policies
*/

-- Add is_correct column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'options' 
    AND column_name = 'is_correct'
  ) THEN
    ALTER TABLE options 
    ADD COLUMN is_correct boolean DEFAULT false;

    -- Update existing records
    UPDATE options 
    SET is_correct = (score > 0);
  END IF;
END $$;
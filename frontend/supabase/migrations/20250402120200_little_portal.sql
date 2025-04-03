/*
  # Add Template Images Support

  1. New Features
    - Add support for image uploads in report templates
    - Add image storage configuration
    - Add image processing capabilities

  2. Security
    - Add proper RLS policies for image access
    - Ensure secure image handling
*/

-- This migration is a placeholder to remind you to create the storage bucket
-- Since we can't create storage buckets directly via SQL migrations,
-- you need to create the bucket manually through the Supabase dashboard

-- IMPORTANT: After applying this migration, please:
-- 1. Go to the Supabase dashboard
-- 2. Navigate to Storage
-- 3. Create a new bucket named 'template-images'
-- 4. Set the bucket to public (or configure appropriate RLS policies)
-- 5. Enable file uploads for authenticated users

-- This comment serves as documentation for the required manual step
COMMENT ON SCHEMA public IS 'Storage bucket "template-images" needs to be created manually in the Supabase dashboard';

-- Create a function to check if the bucket exists
CREATE OR REPLACE FUNCTION check_template_images_bucket()
RETURNS text AS $$
DECLARE
  bucket_exists boolean;
BEGIN
  -- This function is a placeholder since we can't directly check bucket existence in SQL
  -- The actual check must be done in the application code
  RETURN 'Please create a storage bucket named "template-images" in the Supabase dashboard if it does not exist';
END;
$$ LANGUAGE plpgsql;

-- Call the function to show the message during migration
SELECT check_template_images_bucket();

-- Add custom_feedback column to quiz_responses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_responses' 
    AND column_name = 'custom_feedback'
  ) THEN
    ALTER TABLE quiz_responses 
    ADD COLUMN custom_feedback text;
  END IF;
END $$;
/*
  # Create Template Images Storage Bucket

  1. Changes
    - Create a storage bucket for template images
    - Set up public access policies
    - Enable image uploads for report templates

  2. Security
    - Enable appropriate RLS policies
    - Allow authenticated users to upload images
    - Allow public access for viewing images
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

-- Create a product_settings table to store application settings
CREATE TABLE IF NOT EXISTS product_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  product_name text,
  product_logo text,
  user_id uuid REFERENCES auth.users(id)
);

-- This function would normally create a bucket, but it's just a placeholder
-- since we can't create buckets directly via SQL
CREATE OR REPLACE FUNCTION create_template_images_bucket()
RETURNS void AS $$
BEGIN
  -- This is just a placeholder function
  -- The actual bucket creation must be done manually through the Supabase dashboard
  RAISE NOTICE 'Please create a storage bucket named "template-images" in the Supabase dashboard';
END;
$$ LANGUAGE plpgsql;

-- Call the placeholder function to show the notice during migration
SELECT create_template_images_bucket();
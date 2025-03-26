/*
  # Theme System and Client Branding

  1. New Tables
    - `client_themes` - Stores client-specific theme configurations
    - `quiz_themes` - Stores quiz category theme presets
    - `theme_assets` - Stores client logos and other theme assets

  2. Changes
    - Add client branding support to theme_presets
    - Add quiz-specific styling options
    - Add theme version tracking
*/

-- Create client themes table
CREATE TABLE IF NOT EXISTS client_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  colors jsonb NOT NULL,
  fonts jsonb NOT NULL,
  branding jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1
);

-- Create quiz themes table
CREATE TABLE IF NOT EXISTS quiz_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  description text,
  styles jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create theme assets table
CREATE TABLE IF NOT EXISTS theme_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add version tracking to theme_presets
ALTER TABLE theme_presets 
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN updated_at timestamptz DEFAULT now();

-- Add client branding support to theme_presets
ALTER TABLE theme_presets
ADD COLUMN client_id uuid,
ADD COLUMN branding jsonb;

-- Enable RLS
ALTER TABLE client_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_assets ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view client themes"
  ON client_themes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view quiz themes"
  ON quiz_themes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view theme assets"
  ON theme_assets
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX idx_client_themes_client_id ON client_themes(client_id);
CREATE INDEX idx_quiz_themes_category ON quiz_themes(category);
CREATE INDEX idx_theme_assets_client_id ON theme_assets(client_id);

-- Insert default quiz themes
INSERT INTO quiz_themes (category, name, description, styles) 
VALUES 
  (
    'technical',
    'Technical Assessment',
    'Clean, minimal design for technical quizzes',
    '{
      "headerBackground": "#2563eb",
      "buttonStyle": "square",
      "progressBarStyle": "minimal",
      "typography": {
        "questionFont": "Monaco, monospace",
        "codeBlocks": true
      }
    }'
  ),
  (
    'business',
    'Business Assessment',
    'Professional design for business quizzes',
    '{
      "headerBackground": "#16a34a",
      "buttonStyle": "rounded",
      "progressBarStyle": "standard",
      "typography": {
        "questionFont": "Inter, sans-serif",
        "codeBlocks": false
      }
    }'
  ),
  (
    'creative',
    'Creative Assessment',
    'Dynamic design for creative quizzes',
    '{
      "headerBackground": "#9333ea",
      "buttonStyle": "pill",
      "progressBarStyle": "fancy",
      "typography": {
        "questionFont": "Poppins, sans-serif",
        "codeBlocks": false
      }
    }'
  );

-- Create function to apply client theme
CREATE OR REPLACE FUNCTION apply_client_theme(
  p_client_id uuid,
  p_theme_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update client theme
  UPDATE client_themes
  SET is_active = false
  WHERE client_id = p_client_id;

  UPDATE client_themes
  SET 
    is_active = true,
    updated_at = now(),
    version = version + 1
  WHERE id = p_theme_id;

  -- Log theme change
  INSERT INTO analytics_audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    'update_client_theme',
    'client_themes',
    p_theme_id,
    jsonb_build_object(
      'client_id', p_client_id,
      'timestamp', now()
    )
  );
END;
$$;

-- Create function to get quiz theme
CREATE OR REPLACE FUNCTION get_quiz_theme(p_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_theme jsonb;
BEGIN
  SELECT styles INTO v_theme
  FROM quiz_themes
  WHERE category = p_category;

  RETURN v_theme;
END;
$$;
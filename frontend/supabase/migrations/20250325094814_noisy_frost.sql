/*
  # Theme System Implementation

  1. Changes
    - Add theme_presets table for storing predefined themes
    - Add theme field to user_preferences
    - Add functions for theme management
    - Add RLS policies for theme access

  2. Security
    - Enable RLS on all tables
    - Add proper access policies
*/

-- Create theme presets table
CREATE TABLE IF NOT EXISTS theme_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  colors jsonb NOT NULL,
  fonts jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view all theme presets"
  ON theme_presets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create custom theme presets"
  ON theme_presets
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Insert default theme presets
INSERT INTO theme_presets (name, description, colors, fonts, is_default)
VALUES
  (
    'Default Light',
    'Default light theme with purple accent',
    '{
      "primary": "#9333ea",
      "secondary": "#c084fc",
      "accent": "#e9d5ff",
      "background": "#ffffff",
      "text": "#1f2937",
      "border": "#e5e7eb"
    }',
    '{
      "heading": "Inter, system-ui, sans-serif",
      "body": "Inter, system-ui, sans-serif"
    }',
    true
  ),
  (
    'Default Dark',
    'Default dark theme with purple accent',
    '{
      "primary": "#9333ea",
      "secondary": "#c084fc",
      "accent": "#e9d5ff",
      "background": "#1f2937",
      "text": "#f9fafb",
      "border": "#374151"
    }',
    '{
      "heading": "Inter, system-ui, sans-serif",
      "body": "Inter, system-ui, sans-serif"
    }',
    false
  );

-- Create function to apply theme
CREATE OR REPLACE FUNCTION apply_theme(p_user_id uuid, p_theme jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user preferences with new theme
  INSERT INTO user_preferences (
    user_id,
    preferences
  )
  VALUES (
    p_user_id,
    jsonb_build_object('theme', p_theme)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    preferences = jsonb_set(
      COALESCE(user_preferences.preferences, '{}'::jsonb),
      '{theme}',
      p_theme
    ),
    updated_at = now();

  -- Log theme change in history
  INSERT INTO user_preferences_history (
    user_id,
    preferences,
    reason
  )
  VALUES (
    p_user_id,
    jsonb_build_object('theme', p_theme),
    'Theme updated'
  );
END;
$$;
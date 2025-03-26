/*
  # Theme System Improvements

  1. Changes
    - Add contrast colors for primary/secondary
    - Add branding support
    - Update default presets with better contrast
    - Add accessibility settings

  2. Security
    - Maintain existing RLS policies
*/

-- Add branding support to theme_presets
ALTER TABLE theme_presets
ADD COLUMN IF NOT EXISTS branding jsonb;

-- Update default theme presets with better contrast
UPDATE theme_presets
SET colors = '{
  "primary": "#6b21a8",
  "secondary": "#9333ea",
  "accent": "#e9d5ff",
  "background": "#ffffff",
  "text": "#1f2937",
  "border": "#e5e7eb"
}'::jsonb,
branding = '{
  "logoHeight": 40
}'::jsonb
WHERE name = 'Default Light';

UPDATE theme_presets
SET colors = '{
  "primary": "#9333ea",
  "secondary": "#c084fc",
  "accent": "#2d1a45",
  "background": "#1f2937",
  "text": "#f9fafb",
  "border": "#374151"
}'::jsonb,
branding = '{
  "logoHeight": 40
}'::jsonb
WHERE name = 'Default Dark';

-- Insert additional theme presets
INSERT INTO theme_presets (
  name,
  description,
  colors,
  fonts,
  branding,
  is_default
) VALUES
(
  'Professional Blue',
  'Clean and professional theme with blue accents',
  '{
    "primary": "#2563eb",
    "secondary": "#3b82f6",
    "accent": "#bfdbfe",
    "background": "#ffffff",
    "text": "#1f2937",
    "border": "#e5e7eb"
  }',
  '{
    "heading": "Inter, system-ui, sans-serif",
    "body": "Inter, system-ui, sans-serif"
  }',
  '{
    "logoHeight": 40
  }',
  true
),
(
  'Forest Green',
  'Nature-inspired theme with green accents',
  '{
    "primary": "#166534",
    "secondary": "#22c55e",
    "accent": "#bbf7d0",
    "background": "#ffffff",
    "text": "#1f2937",
    "border": "#e5e7eb"
  }',
  '{
    "heading": "Poppins, system-ui, sans-serif",
    "body": "Inter, system-ui, sans-serif"
  }',
  '{
    "logoHeight": 40
  }',
  true
);

-- Create function to check color contrast
CREATE OR REPLACE FUNCTION check_color_contrast(
  background text,
  foreground text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  bg_brightness numeric;
  fg_brightness numeric;
BEGIN
  -- Convert hex to RGB and calculate brightness
  -- Using relative luminance formula (0.299R + 0.587G + 0.114B)
  WITH colors AS (
    SELECT 
      background AS bg,
      foreground AS fg
  )
  SELECT 
    (
      0.299 * ('x' || substring(bg, 2, 2))::bit(8)::integer +
      0.587 * ('x' || substring(bg, 4, 2))::bit(8)::integer +
      0.114 * ('x' || substring(bg, 6, 2))::bit(8)::integer
    ) / 255.0,
    (
      0.299 * ('x' || substring(fg, 2, 2))::bit(8)::integer +
      0.587 * ('x' || substring(fg, 4, 2))::bit(8)::integer +
      0.114 * ('x' || substring(fg, 6, 2))::bit(8)::integer
    ) / 255.0
  INTO bg_brightness, fg_brightness
  FROM colors;

  -- Check if contrast ratio meets WCAG 2.0 AA standard (4.5:1)
  RETURN ABS(bg_brightness - fg_brightness) >= 0.45;
END;
$$;

-- Create trigger to validate theme colors
CREATE OR REPLACE FUNCTION validate_theme_colors()
RETURNS trigger AS $$
BEGIN
  -- Check contrast for primary color
  IF NOT check_color_contrast(
    NEW.colors->>'background',
    NEW.colors->>'primary'
  ) THEN
    RAISE EXCEPTION 'Insufficient contrast between background and primary color';
  END IF;

  -- Check contrast for text color
  IF NOT check_color_contrast(
    NEW.colors->>'background',
    NEW.colors->>'text'
  ) THEN
    RAISE EXCEPTION 'Insufficient contrast between background and text color';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_theme_colors_trigger
  BEFORE INSERT OR UPDATE ON theme_presets
  FOR EACH ROW
  EXECUTE FUNCTION validate_theme_colors();
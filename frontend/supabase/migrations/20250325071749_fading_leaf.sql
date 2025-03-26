-- Drop existing trigger and function
DROP TRIGGER IF EXISTS log_preference_changes_trigger ON user_preferences;
DROP FUNCTION IF EXISTS log_preference_changes();

-- Create new function with proper RLS handling
CREATE OR REPLACE FUNCTION log_preference_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Insert with explicit user_id check
    INSERT INTO user_preferences_history (
      user_id,
      preferences,
      timestamp,
      reason
    ) VALUES (
      NEW.user_id, -- Use NEW instead of OLD to match the current user
      OLD.preferences,
      now(),
      'update'
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate trigger
CREATE TRIGGER log_preference_changes_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_preference_changes();

-- Update RLS policy for preferences history
DROP POLICY IF EXISTS "Users can view their own preferences history" ON user_preferences_history;

CREATE POLICY "Users can manage their own preferences history"
  ON user_preferences_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
/*
  # User Settings System Schema

  1. New Tables
    - `user_preferences` - Stores user preferences and settings
    - `user_sessions` - Tracks active user sessions
    - `login_history` - Records login activity
    - `security_events` - Logs security-related events
    - `user_preferences_history` - Maintains settings history

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type text NOT NULL,
  browser text,
  ip_address text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create login history table
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  ip_address text,
  device text,
  browser text,
  location text,
  success boolean DEFAULT true
);

-- Create security events table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  details jsonb,
  ip_address text,
  user_agent text
);

-- Create preferences history table
CREATE TABLE IF NOT EXISTS user_preferences_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb NOT NULL,
  timestamp timestamptz DEFAULT now(),
  reason text
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for user_sessions
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create policies for login_history
CREATE POLICY "Users can view their own login history"
  ON login_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for security_events
CREATE POLICY "Users can view their own security events"
  ON security_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for preferences_history
CREATE POLICY "Users can view their own preferences history"
  ON user_preferences_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_history_user_id ON user_preferences_history(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log preference changes
CREATE OR REPLACE FUNCTION log_preference_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO user_preferences_history (
      user_id,
      preferences,
      timestamp,
      reason
    ) VALUES (
      OLD.user_id,
      OLD.preferences,
      now(),
      'update'
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for logging preference changes
CREATE TRIGGER log_preference_changes_trigger
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_preference_changes();

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE expires_at < now();
END;
$$ language 'plpgsql';
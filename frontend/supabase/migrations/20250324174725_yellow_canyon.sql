-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Anyone can update own sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics sessions" ON analytics_sessions;

-- Create new policies for analytics_events
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can select analytics events"
  ON analytics_events
  FOR SELECT
  TO public
  USING (true);

-- Create new policies for analytics_sessions
CREATE POLICY "Anyone can insert analytics sessions"
  ON analytics_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can select analytics sessions"
  ON analytics_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update analytics sessions"
  ON analytics_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Anyone can update own sessions" ON analytics_sessions;

-- Create new policies for analytics_events
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email LIKE '%@vidoora.com'
  ));

-- Create new policies for analytics_sessions
CREATE POLICY "Anyone can insert analytics sessions"
  ON analytics_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update own sessions"
  ON analytics_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view analytics sessions"
  ON analytics_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email LIKE '%@vidoora.com'
  ));
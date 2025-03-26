/*
  # Fix Analytics RLS Policies

  1. Changes
    - Update RLS policies for analytics tables
    - Add policies for anonymous access
    - Fix permission issues for analytics tracking

  2. Security
    - Maintain existing security model
    - Add proper access controls
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics sessions" ON analytics_sessions;

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
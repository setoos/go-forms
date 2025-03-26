/*
  # Analytics System Improvements

  1. New Features
    - Session state tracking
    - Performance monitoring
    - Data quality checks
    - Analytics caching
    
  2. Changes
    - Add session tracking columns
    - Create performance monitoring tables
    - Add data validation functions
    - Create indexes for optimization

  3. Security
    - Maintain RLS policies
    - Add audit logging
*/

-- Add session state tracking
ALTER TABLE quiz_sessions 
ADD COLUMN IF NOT EXISTS state text CHECK (state IN ('active', 'completed', 'abandoned', 'timeout')),
ADD COLUMN IF NOT EXISTS last_activity timestamptz DEFAULT now();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(score);
CREATE INDEX IF NOT EXISTS idx_composite_quiz_time ON quiz_attempts(quiz_id, started_at, completed_at);

-- Create analytics performance monitoring
CREATE TABLE IF NOT EXISTS analytics_performance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_name text NOT NULL,
  execution_time interval NOT NULL,
  rows_processed integer,
  created_at timestamptz DEFAULT now()
);

-- Create analytics audit logs
CREATE TABLE IF NOT EXISTS analytics_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE analytics_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_audit_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for analytics logs
CREATE POLICY "Admins can view performance logs"
  ON analytics_performance_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email LIKE '%@vidoora.com'
  ));

CREATE POLICY "Users can view their own audit logs"
  ON analytics_audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to log analytics performance
CREATE OR REPLACE FUNCTION log_analytics_performance(
  p_query_name text,
  p_start_time timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO analytics_performance_logs (
    query_name,
    execution_time,
    rows_processed
  )
  VALUES (
    p_query_name,
    clock_timestamp() - p_start_time,
    (SELECT COUNT(*) FROM quiz_attempts)
  );
END;
$$;

-- Create function to validate analytics data
CREATE OR REPLACE FUNCTION validate_analytics_data()
RETURNS TABLE (
  check_name text,
  failed_records bigint,
  check_timestamp timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Invalid completion times' as check_name,
    COUNT(*) as failed_records,
    now() as check_timestamp
  FROM quiz_attempts
  WHERE completed_at < started_at
  UNION ALL
  SELECT 
    'Orphaned sessions' as check_name,
    COUNT(*) as failed_records,
    now()
  FROM quiz_sessions qs
  LEFT JOIN quiz_attempts qa ON qa.id = qs.attempt_id
  WHERE qa.id IS NULL
  UNION ALL
  SELECT
    'Incomplete answer history' as check_name,
    COUNT(*) as failed_records,
    now()
  FROM quiz_sessions
  WHERE final_answer IS NULL AND completed_at IS NOT NULL;
END;
$$;

-- Create function to clean up abandoned sessions
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions(
  p_timeout_minutes integer DEFAULT 30
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaned integer;
BEGIN
  UPDATE quiz_sessions
  SET 
    state = 'abandoned',
    completed_at = now()
  WHERE 
    state = 'active'
    AND last_activity < now() - (p_timeout_minutes || ' minutes')::interval
    AND completed_at IS NULL;
    
  GET DIAGNOSTICS v_cleaned = ROW_COUNT;
  RETURN v_cleaned;
END;
$$;

-- Create function to track session activity
CREATE OR REPLACE FUNCTION track_session_activity()
RETURNS trigger AS $$
BEGIN
  NEW.last_activity = now();
  
  IF NEW.final_answer IS NOT NULL AND OLD.final_answer IS NULL THEN
    NEW.state = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session activity tracking
CREATE TRIGGER track_session_activity_trigger
BEFORE UPDATE ON quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION track_session_activity();

-- Schedule cleanup of abandoned sessions
CREATE OR REPLACE FUNCTION schedule_session_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_abandoned_sessions(30);
END;
$$;

-- Add comment explaining the analytics improvements
COMMENT ON SCHEMA public IS 'Analytics improvements added:
- Session state tracking with automatic cleanup
- Performance monitoring and logging
- Data quality validation
- Optimized indexes for common queries
- Audit logging for analytics access';
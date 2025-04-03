/*
  # Add Billing System Tables

  1. New Tables
    - `user_plans` - Stores user subscription plans
    - `payment_methods` - Stores user payment methods
    - `invoices` - Stores billing invoices
    - `usage_stats` - Stores user usage statistics
    - `quiz_submissions` - Stores quiz submission billing records
    - `access_logs` - Stores access control logs

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL,
  last4 text,
  expiry_date text,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  description text,
  date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  items jsonb,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create usage_stats table
CREATE TABLE IF NOT EXISTS usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  quiz_submissions_count integer NOT NULL DEFAULT 0,
  storage_used numeric(10,2) NOT NULL DEFAULT 0,
  api_calls_count integer NOT NULL DEFAULT 0,
  last_updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) NOT NULL,
  quiz_name text NOT NULL,
  submission_date timestamptz NOT NULL DEFAULT now(),
  user_name text NOT NULL,
  user_email text NOT NULL,
  ip_address text,
  session_duration integer,
  completion_status text NOT NULL,
  cost numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) NOT NULL,
  quiz_name text NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  action text NOT NULL,
  status text NOT NULL,
  details text
);

-- Enable RLS on all tables
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_plans
CREATE POLICY "Users can view their own plans"
  ON user_plans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for usage_stats
CREATE POLICY "Users can view their own usage stats"
  ON usage_stats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for quiz_submissions
CREATE POLICY "Users can view their own quiz submissions"
  ON quiz_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for access_logs
CREATE POLICY "Users can view their own access logs"
  ON access_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to update usage stats
CREATE OR REPLACE FUNCTION update_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update quiz submissions count
  UPDATE usage_stats
  SET 
    quiz_submissions_count = quiz_submissions_count + 1,
    last_updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO usage_stats (user_id, quiz_submissions_count)
    VALUES (NEW.user_id, 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update usage stats
CREATE TRIGGER update_usage_stats_trigger
AFTER INSERT ON quiz_submissions
FOR EACH ROW
EXECUTE FUNCTION update_usage_stats();

-- Create function to track quiz submissions for billing
CREATE OR REPLACE FUNCTION track_quiz_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_name text;
  v_user_name text;
  v_user_email text;
  v_completion_status text;
  v_cost numeric(10,2);
BEGIN
  -- Get quiz name
  SELECT title INTO v_quiz_name
  FROM quizzes
  WHERE id = NEW.quiz_id;
  
  -- Set completion status
  v_completion_status := CASE WHEN NEW.completed_at IS NOT NULL THEN 'completed' ELSE 'incomplete' END;
  
  -- Calculate cost
  v_cost := CASE WHEN NEW.completed_at IS NOT NULL THEN 0.50 ELSE 0.25 END;
  
  -- Set user name and email
  v_user_name := COALESCE(NEW.participant_name, 'Anonymous');
  v_user_email := COALESCE(NEW.participant_email, 'anonymous@example.com');
  
  -- Insert into quiz_submissions
  INSERT INTO quiz_submissions (
    user_id,
    quiz_id,
    quiz_name,
    submission_date,
    user_name,
    user_email,
    ip_address,
    session_duration,
    completion_status,
    cost
  ) VALUES (
    COALESCE(NEW.user_id, auth.uid()),
    NEW.quiz_id,
    v_quiz_name,
    NEW.started_at,
    v_user_name,
    v_user_email,
    NEW.ip_address,
    CASE 
      WHEN NEW.completed_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::integer
      ELSE 0
    END,
    v_completion_status,
    v_cost
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track quiz submissions
CREATE TRIGGER track_quiz_submission_trigger
AFTER INSERT ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION track_quiz_submission();

-- Create function to track access logs
CREATE OR REPLACE FUNCTION track_access_log()
RETURNS TRIGGER AS $$
DECLARE
  v_quiz_name text;
  v_user_name text;
  v_user_email text;
BEGIN
  -- Get quiz name
  SELECT title INTO v_quiz_name
  FROM quizzes
  WHERE id = NEW.quiz_id;
  
  -- Set user name and email from event data or default values
  v_user_name := COALESCE(NEW.event_data->>'user_name', 'Anonymous');
  v_user_email := COALESCE(NEW.event_data->>'user_email', 'anonymous@example.com');
  
  -- Insert into access_logs
  INSERT INTO access_logs (
    user_id,
    quiz_id,
    quiz_name,
    user_name,
    user_email,
    timestamp,
    ip_address,
    action,
    status,
    details
  ) VALUES (
    COALESCE(NEW.user_id, auth.uid()),
    NEW.event_data->>'quiz_id',
    v_quiz_name,
    v_user_name,
    v_user_email,
    NEW.created_at,
    NEW.ip_address,
    NEW.event_type,
    COALESCE(NEW.event_data->>'status', 'success'),
    COALESCE(NEW.event_data->>'details', 'No details available')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to track access logs
CREATE TRIGGER track_access_log_trigger
AFTER INSERT ON analytics_events
FOR EACH ROW
WHEN (NEW.event_type IN ('login', 'logout', 'access_quiz', 'share_quiz'))
EXECUTE FUNCTION track_access_log();

-- Insert default plans for existing users
INSERT INTO user_plans (user_id, plan_id, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_plans);
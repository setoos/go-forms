/*
  # Fix RLS policies for quiz submissions

  1. Security
    - Enable RLS on quiz_submissions, quiz_attempts, and quiz_responses tables
    - Add policies to allow anonymous and authenticated users to insert submissions
    - Add policies to allow quiz creators to view submissions
    - Fix RLS policies for usage_stats table
    - Add policies to allow public access to quizzes
*/

-- First, check if the quiz_submissions table exists and enable RLS if needed
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_submissions') THEN
    ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policy for quiz_submissions to allow anonymous users to insert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_submissions') THEN
    DROP POLICY IF EXISTS "Allow anonymous users to insert submissions" ON public.quiz_submissions;
    
    CREATE POLICY "Allow anonymous users to insert submissions"
      ON public.quiz_submissions
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END
$$;

-- Create policy for quiz_submissions to allow authenticated users to insert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_submissions') THEN
    DROP POLICY IF EXISTS "Allow authenticated users to insert submissions" ON public.quiz_submissions;
    
    CREATE POLICY "Allow authenticated users to insert submissions"
      ON public.quiz_submissions
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END
$$;

-- Create policy for quiz_submissions to allow quiz creators to view submissions
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_submissions') THEN
    DROP POLICY IF EXISTS "Quiz creators can view submissions" ON public.quiz_submissions;
    
    CREATE POLICY "Quiz creators can view submissions"
      ON public.quiz_submissions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM quizzes
          WHERE quizzes.id = quiz_submissions.quiz_id
          AND quizzes.created_by = auth.uid()
        )
      );
  END IF;
END
$$;

-- Now handle the quiz_attempts table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_attempts') THEN
    ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Create policy for quiz_attempts to allow anonymous users to insert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_attempts') THEN
    DROP POLICY IF EXISTS "Allow anonymous users to insert attempts" ON public.quiz_attempts;
    
    CREATE POLICY "Allow anonymous users to insert attempts"
      ON public.quiz_attempts
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END
$$;

-- Create policy for quiz_attempts to allow authenticated users to insert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_attempts') THEN
    DROP POLICY IF EXISTS "Allow authenticated users to insert attempts" ON public.quiz_attempts;
    
    CREATE POLICY "Allow authenticated users to insert attempts"
      ON public.quiz_attempts
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END
$$;

-- Create policy for quiz_attempts to allow quiz creators to view attempts
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_attempts') THEN
    DROP POLICY IF EXISTS "Quiz creators can view attempts" ON public.quiz_attempts;
    
    CREATE POLICY "Quiz creators can view attempts"
      ON public.quiz_attempts
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM quizzes
          WHERE quizzes.id = quiz_attempts.quiz_id
          AND quizzes.created_by = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create policy for quiz_responses to allow anonymous users to insert
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_responses') THEN
    ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Anyone can insert responses" ON public.quiz_responses;
    
    CREATE POLICY "Anyone can insert responses"
      ON public.quiz_responses
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END
$$;

-- Create policy for quiz_responses to allow quiz creators to view responses
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quiz_responses') THEN
    DROP POLICY IF EXISTS "Quiz creators can view responses" ON public.quiz_responses;
    
    CREATE POLICY "Quiz creators can view responses"
      ON public.quiz_responses
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM quizzes
          WHERE quizzes.id = quiz_responses.quiz_id
          AND quizzes.created_by = auth.uid()
        )
      );
  END IF;
END
$$;

-- Fix RLS for usage_stats table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_stats') THEN
    -- Disable the trigger that updates usage_stats
    DROP TRIGGER IF EXISTS update_usage_stats_trigger ON public.quiz_submissions;
    
    -- Create a policy to allow service role to update usage_stats
    DROP POLICY IF EXISTS "Service role can update usage stats" ON public.usage_stats;
    
    CREATE POLICY "Service role can update usage stats"
      ON public.usage_stats
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    -- Create a policy to allow users to view their own usage stats
    DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.usage_stats;
    
    CREATE POLICY "Users can view their own usage stats"
      ON public.usage_stats
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Add policies to allow public access to quizzes
DO $$
BEGIN
  -- Update the policy for quizzes to allow public access to published quizzes
  DROP POLICY IF EXISTS "View published or owned quizzes" ON public.quizzes;
  
  CREATE POLICY "View published or owned quizzes"
    ON public.quizzes
    FOR SELECT
    TO public
    USING (
      (deleted_at IS NULL) AND 
      (
        (is_published = true) OR 
        (auth.uid() = created_by) OR
        (access_type = 'public')
      )
    );
END
$$;

-- Add policies to allow public access to questions for published quizzes
DO $$
BEGIN
  -- Update the policy for questions to allow public access to questions for published quizzes
  DROP POLICY IF EXISTS "Public can view questions for published quizzes" ON public.questions;
  
  CREATE POLICY "Public can view questions for published quizzes"
    ON public.questions
    FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM quizzes
        WHERE quizzes.id = questions.quiz_id AND 
        (
          quizzes.is_published = true OR
          quizzes.access_type = 'public'
        )
      )
    );
END
$$;

-- Add policies to allow public access to options for published quizzes
DO $$
BEGIN
  -- Update the policy for options to allow public access to options for published quizzes
  DROP POLICY IF EXISTS "Public can view options for published quizzes" ON public.options;
  
  CREATE POLICY "Public can view options for published quizzes"
    ON public.options
    FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM questions
        JOIN quizzes ON quizzes.id = questions.quiz_id
        WHERE questions.id = options.question_id AND 
        (
          quizzes.is_published = true OR
          quizzes.access_type = 'public'
        )
      )
    );
END
$$;
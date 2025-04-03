/*
  # Fix Quiz Submissions RLS Policies

  1. Security
    - Update RLS policies for quiz_submissions table
    - Add policies for quiz_attempts table
    - Ensure anonymous users can submit quiz responses

  This migration addresses the error: "new row violates row-level security policy for table quiz_submissions"
  by creating appropriate RLS policies that allow both authenticated and anonymous users to submit quiz responses.
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
/*
  # Create quiz responses table

  1. New Tables
    - `quiz_responses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text)
      - `answers` (jsonb)
      - `score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `quiz_responses` table
    - Add policy for authenticated users to read their own responses
    - Add policy for inserting new responses
*/

CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  answers jsonb NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own responses"
  ON quiz_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT auth.uid()
    FROM auth.users
    WHERE users.email = quiz_responses.email
  ));

CREATE POLICY "Anyone can insert responses"
  ON quiz_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);
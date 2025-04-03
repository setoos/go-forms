/*
  # Add Report Templates Table

  1. New Tables
    - `report_templates` - Stores customizable report templates for quiz results
      - `id` (uuid, primary key)
      - `name` (text)
      - `content` (text)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on the table
    - Add policies for template management
*/

-- Create report templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all templates"
  ON report_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON report_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON report_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON report_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();

-- Insert default templates - Using dollar-quoted string literals to avoid escaping issues
INSERT INTO report_templates (name, content, created_by)
VALUES 
  (
    'Standard Report',
    $TEMPLATE1$<h2>Performance Summary</h2><p>Thank you for completing the assessment. Your score indicates your current level of understanding in this subject area.</p><h3>Key Strengths</h3><ul><li>You demonstrated good knowledge in several key areas</li><li>Your responses showed critical thinking abilities</li><li>You were able to apply concepts to practical scenarios</li></ul><h3>Areas for Improvement</h3><ul><li>Consider reviewing fundamental concepts in areas where you scored lower</li><li>Practice applying knowledge in different contexts</li><li>Explore additional resources to deepen your understanding</li></ul><h3>Next Steps</h3><p>Based on your results, we recommend focusing on strengthening your knowledge in the identified areas. Consider revisiting the material and taking the assessment again in a few weeks to track your progress.</p>$TEMPLATE1$,
    NULL
  ),
  (
    'Detailed Analysis Report',
    $TEMPLATE2$<h2>Comprehensive Performance Analysis</h2><p>This report provides a detailed breakdown of your assessment results, highlighting your strengths and areas for improvement.</p><h3>Performance Metrics</h3><p>Your overall score places you in the {{performance_category}} category compared to other participants. Here's how your performance breaks down by knowledge area:</p><ul><li><strong>Conceptual Understanding:</strong> {{conceptual_score}}%</li><li><strong>Practical Application:</strong> {{practical_score}}%</li><li><strong>Problem-Solving:</strong> {{problem_solving_score}}%</li></ul><h3>Question-by-Question Analysis</h3><p>Below is a detailed analysis of each question, including explanations for correct answers and learning resources for areas where you may need additional study.</p><div class="question-analysis">{{question_analysis}}</div><h3>Personalized Learning Path</h3><p>Based on your results, we recommend the following personalized learning path:</p><ol><li>Start with strengthening your understanding of {{weak_area_1}}</li><li>Then focus on improving your skills in {{weak_area_2}}</li><li>Finally, advance to mastering {{advanced_topic}}</li></ol><h3>Additional Resources</h3><p>We recommend the following resources to help you improve:</p><ul><li>{{resource_1}}</li><li>{{resource_2}}</li><li>{{resource_3}}</li></ul>$TEMPLATE2$,
    NULL
  );

-- Add custom_feedback column to quiz_responses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quiz_responses' 
    AND column_name = 'custom_feedback'
  ) THEN
    ALTER TABLE quiz_responses 
    ADD COLUMN custom_feedback text;
  END IF;
END $$;
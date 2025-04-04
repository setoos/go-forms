# Analytics Troubleshooting Guide

## 1. Analytics Implementation Routes

### Quiz Taking Analytics
- **Route**: `/quiz/:id`
- **Component**: `Quiz.tsx`
- **Tracking Points**:
  - Quiz start
  - Question answers
  - Completion time
  - Score calculation

```typescript
// Implementation in Quiz.tsx
const handleAnswer = async (score: number) => {
  // Track answer and time
  const newAnswers = { ...answers, [questions[currentQuestion].id]: score };
  const completionTime = Math.floor((Date.now() - startTime) / 1000);
  
  // Save analytics
  if (!isSampleQuiz) {
    await supabase.from('quiz_attempts').insert({
      quiz_id: id,
      answers: newAnswers,
      score,
      completion_time: completionTime
    });
  }
};
```

### Results Analytics
- **Route**: `quiz/:id/results`
- **Component**: `Results.tsx`
- **Tracking Points**:
  - Final score
  - User information
  - PDF generation
  - Response saving

```typescript
// Implementation in Results.tsx
const handleSubmit = async () => {
  if (!isSampleQuiz) {
    await supabase.from('quiz_responses').insert({
      quiz_id: quizId,
      name: userInfo.name,
      email: userInfo.email,
      answers,
      score,
      completion_time: completionTime
    });
  }
};
```

### Quiz Analytics Dashboard
- **Route**: `/admin/quizzes/:id/analytics`
- **Component**: `QuizAnalytics.tsx`
- **Tracking Points**:
  - Overall statistics
  - Question performance
  - User attempts
  - Time analysis

```typescript
// Implementation in QuizAnalytics.tsx
async function loadAnalytics() {
  const { data, error } = await supabase
    .rpc('get_quiz_analytics', { quiz_id: id });
  
  if (error) throw error;
  setAnalytics(data);
}
```

## 2. Common Issues and Solutions

### 1. Analytics Not Loading

**Symptoms**:
- Empty analytics dashboard
- Error: "Failed to load analytics"
- Console errors about aggregate functions

**Solutions**:

a) Database Function Issues:
```sql
-- Fix nested aggregates by using CTEs
WITH attempt_stats AS (
  SELECT COUNT(*) as total_attempts,
         SUM(score) as total_score
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id
)
SELECT 
  total_attempts,
  CASE 
    WHEN total_attempts > 0 THEN total_score::float / total_attempts 
    ELSE 0 
  END as average_score
FROM attempt_stats;
```

b) Permission Issues:
```sql
-- Ensure proper RLS policies
CREATE POLICY "Quiz creators can view analytics"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_attempts.quiz_id
    AND quizzes.created_by = auth.uid()
  ));
```

### 2. Missing Data Points

**Symptoms**:
- Incomplete analytics
- Missing question statistics
- Zero values where data should exist

**Solutions**:

a) Track All Required Data:
```typescript
// In Quiz.tsx
const trackQuestionResponse = async (questionId: string, answer: any) => {
  await supabase.from('quiz_sessions').insert({
    attempt_id: attemptId,
    question_id: questionId,
    final_answer: answer,
    time_spent: getTimeSpent(),
    answer_history: answerHistory
  });
};
```

b) Handle Null Values:
```sql
-- In analytics query
COALESCE(AVG(NULLIF(score, 0)), 0) as average_score,
COALESCE(jsonb_object_agg(
  COALESCE(final_answer->>'optionId', 'unanswered'),
  COUNT(*)
) FILTER (WHERE final_answer->>'optionId' IS NOT NULL), '{}'::jsonb) as distribution
```

### 3. Performance Issues

**Symptoms**:
- Slow analytics loading
- Timeout errors
- High database load

**Solutions**:

a) Implement Materialized View:
```sql
CREATE MATERIALIZED VIEW quiz_analytics_cache AS
WITH quiz_stats AS (
  SELECT
    quiz_id,
    COUNT(*) as total_attempts,
    AVG(score) as average_score
  FROM quiz_attempts
  GROUP BY quiz_id
)
SELECT * FROM quiz_stats;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY quiz_analytics_cache;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

b) Add Proper Indexes:
```sql
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_sessions_attempt_id ON quiz_sessions(attempt_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
```

## 3. Validation Steps

### 1. Analytics Data Flow
1. Quiz attempt creation
2. Question response tracking
3. Session completion
4. Analytics calculation
5. Dashboard display

### 2. Testing Procedures
1. Complete a quiz and verify attempt record
2. Check question-level statistics
3. Validate score calculations
4. Test analytics export functions
5. Verify real-time updates

### 3. Success Criteria
- All analytics endpoints return 200 OK
- Data matches expected calculations
- No console errors
- Performance within acceptable range (<2s load time)
- Proper error handling and user feedback

### 4. Monitoring
1. Set up error tracking
2. Monitor database performance
3. Track analytics usage patterns
4. Set up alerts for failures
5. Regular data integrity checks

## 4. Best Practices

1. **Data Collection**:
   - Track all relevant user interactions
   - Use consistent timestamp formats
   - Include user context when available
   - Maintain data privacy compliance

2. **Performance**:
   - Cache frequently accessed data
   - Use materialized views for complex calculations
   - Implement pagination for large datasets
   - Optimize database queries

3. **Security**:
   - Implement proper RLS policies
   - Validate user permissions
   - Sanitize user inputs
   - Protect sensitive information

4. **Maintenance**:
   - Regular cache refresh
   - Data cleanup procedures
   - Performance monitoring
   - Error logging and alerts
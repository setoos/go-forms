import { supabase } from './supabase';
import type {
  Quiz,
  QuizFilters,
  Question,
  Option,
  MatchingPair,
  OrderingItem,
  EssayRubric,
  QuizShare
} from '../types/quiz';
import { showToast } from './toast';

export async function getQuizzes(filters: QuizFilters = {}) {
  let query = supabase
    .from('quizzes')
    .select('*', { count: 'exact' });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.sortBy) {
    query = query.order(filters.sortBy, {
      ascending: filters.sortOrder === 'asc'
    });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (filters.page && filters.perPage) {
    const from = (filters.page - 1) * filters.perPage;
    const to = from + filters.perPage - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    quizzes: data || [],
    total: count || 0
  };
}

export async function getQuiz(id: string) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select()
    .eq('id', id)
    .single();

  if (quizError) throw quizError;

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      *,
      options (*),
      matching_pairs (*),
      ordering_items (*),
      essay_rubrics (*)
    `)
    .eq('quiz_id', id)
    .order('order', { ascending: true });

  if (questionsError) throw questionsError;

  return {
    quiz,
    questions: questions || []
  };
}

export async function saveQuiz(quiz: Quiz, questions: Question[]) {
  let quizId = quiz.id;
  let isNew = !quizId;

  try {
    if (isNew) {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          time_limit: quiz.time_limit,
          passing_score: quiz.passing_score,
          status: quiz.status || 'draft',
          approval_status: quiz.approval_status || 'pending',
          is_published: quiz.is_published || false,
          created_by: quiz.created_by,
          version: 1,
          quiz_score: quiz.quiz_score,
          quiz_type: quiz.quiz_type,
          quiz_question_type: quiz.quiz_question_type,
          question_count: quiz.question_count,
        })
        .select()
        .single();

      if (error) throw error;
      quizId = data.id;
    } else {
      const { error } = await supabase
        .from('quizzes')
        .update({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          time_limit: quiz.time_limit,
          passing_score: quiz.passing_score,
          status: quiz.status,
          is_published: quiz.is_published,
          updated_at: new Date().toISOString(),
          version: quiz?.version + 1,
          last_published_at: quiz.is_published ? new Date().toISOString() : quiz.last_published_at,
          published_version: quiz.is_published ? quiz?.version + 1 : quiz.published_version
        })
        .eq('id', quizId);

      if (error) throw error;
    }

    // Delete existing questions and related data
    if (!isNew) {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteError) throw deleteError;
    }

    // Save questions and related data
    for (const question of questions) {
      const {
        data: newQuestion,
        error: questionError,
      } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          text: question.text,
          type: question.type,
          order: question.order,
          instructions: question.instructions,
          points: question.points,
          cognitive_level: question.cognitive_level,
          difficulty_level: question.difficulty_level,
          time_limit: question.time_limit,
          required: question.required,
          media_url: question.media_url,
          answer_key: question.answer_key,
          rubric: 'rubric' in question ? question.rubric : undefined,
          tf_feedback: 'tf_feedback' in question ? question.tf_feedback || {} : undefined,
          is_hide: question.is_hide,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Multiple Choice Options
      if (question.type === 'multiple_choice' && question.options?.length) {
        const optionsToCreate = question.options.map((option) => ({
          question_id: newQuestion.id,
          text: option.text,
          score: option.score,
          feedback: option.feedback || '',
          order: option.order,
          is_correct: option.score > 0,
        }));

        const { error: optionsError } = await supabase.from('options').insert(optionsToCreate);
        if (optionsError) throw optionsError;
      }

      // Matching Pairs
      if (question.type === 'matching' && question.matching_pairs?.length) {
        const pairsToCreate = question.matching_pairs.map((pair) => ({
          question_id: newQuestion.id,
          left_item: pair.left_item,
          right_item: pair.right_item,
          order: pair.order,
        }));

        const { error: pairsError } = await supabase.from('matching_pairs').insert(pairsToCreate);
        if (pairsError) throw pairsError;
      }

      // Ordering Items
      if (question.type === 'ordering' && question.ordering_items?.length) {
        const itemsToCreate = question.ordering_items.map((item) => ({
          question_id: newQuestion.id,
          item: item.item,
          correct_position: item.correct_position,
          order: item.order,
        }));

        const { error: itemsError } = await supabase.from('ordering_items').insert(itemsToCreate);
        if (itemsError) throw itemsError;
      }

      // Essay Rubrics
      if (question.type === 'essay' && question.essay_rubrics?.length) {
        const rubricsToCreate = question.essay_rubrics.map((rubric) => ({
          question_id: newQuestion.id,
          criteria: rubric.criteria,
          description: rubric.description,
          max_points: rubric.max_points,
        }));

        const { error: rubricsError } = await supabase.from('essay_rubrics').insert(rubricsToCreate);
        if (rubricsError) throw rubricsError;
      }
    }


    return quizId;
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

export async function validateQuiz(quiz: Quiz) {
  const errors: string[] = [];

  if (!quiz.title?.trim()) {
    errors.push('Quiz title is required');
  }
  if (quiz.time_limit !== null && quiz.time_limit <= 0) {
    errors.push('Time limit must be greater than 0');
  }
  if (quiz.passing_score !== null && (quiz.passing_score < 0 || quiz.passing_score > 100)) {
    errors.push('Passing score must be between 0 and 100');
  }

  return errors;
}

export async function generateQuizShare(
  quizId: string,
  options: {
    accessType?: 'public' | 'private' | 'invite';
    expiresAt?: Date;
    password?: string;
    maxAttempts?: number;
  }
): Promise<QuizShare> {
  const { data, error } = await supabase.rpc('generate_quiz_share', {
    p_quiz_id: quizId,
    p_access_type: options.accessType || 'public',
    p_expires_at: options.expiresAt?.toISOString(),
    p_password: options.password,
    p_max_attempts: options.maxAttempts
  });

  if (error) throw error;
  return data as QuizShare;
}

export function shuffleQuestions(questions: Question[]): Question[] {
  // Create a copy of the questions array
  const shuffled = [...questions];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Update order property to match new positions
  return shuffled.map((question, index) => ({
    ...question,
    order: index
  }));
}

export function shuffleOptions(options: Option[]): Option[] {
  // Create a copy of the options array
  const shuffled = [...options];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Update order property to match new positions
  return shuffled.map((option, index) => ({
    ...option,
    order: index
  }));
}

// Get a template by ID
export async function getQuizTemplate(templateId: string) {
  try {
    // In a real application, this would fetch from a templates table
    // For this demo, we'll use the sample quiz data
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select()
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (quizError) throw quizError;

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*),
        matching_pairs (*),
        ordering_items (*),
        essay_rubrics (*)
      `)
      .eq('quiz_id', '00000000-0000-0000-0000-000000000000')
      .order('order', { ascending: true });

    if (questionsError) throw questionsError;

    // Modify the quiz to be a template
    const templateQuiz = {
      ...quiz,
      id: undefined, // Remove ID so a new one will be generated
      title: `${quiz.title} (Copy)`,
      is_published: false,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Modify questions to remove IDs
    const templateQuestions = questions?.map(question => ({
      ...question,
      id: undefined,
      quiz_id: undefined,
      options: question.options?.map((option: Option) => ({
        ...option,
        id: undefined,
        question_id: undefined
      })),
      matching_pairs: question.matching_pairs?.map((pair: MatchingPair) => ({
        ...pair,
        id: undefined,
        question_id: undefined
      })),
      ordering_items: question.ordering_items?.map((item: OrderingItem) => ({
        ...item,
        id: undefined,
        question_id: undefined
      })),
      essay_rubrics: question.essay_rubrics?.map((rubric: EssayRubric) => ({
        ...rubric,
        id: undefined,
        question_id: undefined
      }))
    })) || [];

    return {
      quiz: templateQuiz,
      questions: templateQuestions
    };
  } catch (error) {
    console.error('Error getting quiz template:', error);
    throw error;
  }
}

export async function validateQuizAccess(quizId: string, password?: string) {
  // This would normally check if the quiz is accessible
  // For this demo, we'll just return true
  return true;
}
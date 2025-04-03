import { GetServerSideProps } from 'next';
import QuizView from '../../../components/QuizView';
import { supabase } from '../../../lib/supabase';

export default function QuizViewPage({ quiz, questions }) {
  return <QuizView initialQuiz={quiz} initialQuestions={questions} />;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  
  try {
    // Get the quiz data
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (quizError) {
      return {
        notFound: true
      };
    }

    // Get questions with related data
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('quiz_id', id)
      .order('order', { ascending: true });

    if (questionsError) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        quiz,
        questions: questions || []
      }
    };
  } catch (error) {
    console.error('Error loading quiz:', error);
    return {
      notFound: true
    };
  }
};
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Quiz from '../../components/Quiz';
import { supabase } from '../../lib/supabase';
import { questions as sampleQuestions } from '../../data/questions';

export default function QuizPage({ quiz, questions, isSampleQuiz }) {
  const router = useRouter();
  
  // If the page is still generating via SSR, show loading
  if (router.isFallback) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return <Quiz initialQuiz={quiz} initialQuestions={questions} isSampleQuiz={isSampleQuiz} />;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  
  // Check if this is the sample quiz
  if (id === 'sample') {
    return {
      props: {
        quiz: {
          id: 'sample',
          title: 'Marketing Awareness Sample Quiz',
          description: 'Test your marketing knowledge with our sample quiz',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system',
          is_published: true,
          share_id: 'sample'
        },
        questions: sampleQuestions,
        isSampleQuiz: true
      }
    };
  }
  
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
      .select('*, options(*), matching_pairs(*), ordering_items(*), essay_rubrics(*)')
      .eq('quiz_id', id)
      .order('order');

    if (questionsError) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        quiz,
        questions: questions || [],
        isSampleQuiz: false
      }
    };
  } catch (error) {
    console.error('Error loading quiz:', error);
    return {
      notFound: true
    };
  }
};
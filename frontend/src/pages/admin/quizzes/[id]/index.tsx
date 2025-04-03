import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import QuizEditor from '../../../../components/admin/QuizEditor';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { supabase } from '../../../../lib/supabase';

export default function EditQuizPage({ quiz, questions }) {
  return (
    <>
      <Breadcrumbs />
      <QuizEditor initialQuiz={quiz} initialQuestions={questions} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const id = params?.id as string;
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth',
        permanent: false,
      },
    };
  }
  
  try {
    // Get the quiz data
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .eq('created_by', session.user.id)
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
        options (*),
        matching_pairs (*),
        ordering_items (*),
        essay_rubrics (*)
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
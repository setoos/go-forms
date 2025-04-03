import { GetServerSideProps } from 'next';
import QuizList from '../../../components/admin/QuizList';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function QuizzesPage({ quizzes }) {
  return (
    <>
      <Breadcrumbs />
      <QuizList initialQuizzes={quizzes} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
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
    // Get user's quizzes
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('created_by', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return {
      props: {
        quizzes: quizzes || []
      }
    };
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return {
      props: {
        quizzes: []
      }
    };
  }
};
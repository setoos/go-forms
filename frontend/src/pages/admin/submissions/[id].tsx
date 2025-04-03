import { GetServerSideProps } from 'next';
import QuizResponseDetail from '../../../components/admin/QuizResponseDetail';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function ResponseDetailPage({ responseId }) {
  return (
    <>
      <Breadcrumbs />
      <QuizResponseDetail />
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
    // Check if the response exists and belongs to a quiz created by the user
    const { data, error } = await supabase
      .from('quiz_responses')
      .select(`
        id,
        quiz_id,
        quizzes (
          created_by
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return {
        notFound: true
      };
    }

    // Verify that the quiz belongs to the current user
    if (data.quizzes?.created_by !== session.user.id) {
      return {
        notFound: true
      };
    }

    return {
      props: {
        responseId: id
      }
    };
  } catch (error) {
    console.error('Error checking response access:', error);
    return {
      notFound: true
    };
  }
};
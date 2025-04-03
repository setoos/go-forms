import { GetServerSideProps } from 'next';
import QuizAnalytics from '../../../../components/admin/QuizAnalytics';
import Breadcrumbs from '../../../../components/Breadcrumbs';
import { supabase } from '../../../../lib/supabase';

export default function QuizAnalyticsPage({ analytics, quizId }) {
  return (
    <>
      <Breadcrumbs />
      <QuizAnalytics initialAnalytics={analytics} quizId={quizId} />
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
    // Check if the quiz exists and belongs to the user
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id', id)
      .eq('created_by', session.user.id)
      .single();

    if (quizError) {
      return {
        notFound: true
      };
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('get_quiz_analytics', { quiz_id: id });

    if (analyticsError) {
      console.error('Error loading analytics:', analyticsError);
      // Return empty analytics instead of 404
      return {
        props: {
          analytics: null,
          quizId: id
        }
      };
    }

    return {
      props: {
        analytics,
        quizId: id
      }
    };
  } catch (error) {
    console.error('Error loading quiz analytics:', error);
    return {
      props: {
        analytics: null,
        quizId: id
      }
    };
  }
};
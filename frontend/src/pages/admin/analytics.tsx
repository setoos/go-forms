import { GetServerSideProps } from 'next';
import AnalyticsDashboard from '../../components/admin/AnalyticsDashboard';
import Breadcrumbs from '../../components/Breadcrumbs';
import { supabase } from '../../lib/supabase';

export default function AnalyticsDashboardPage({ platformData, quizData }) {
  return (
    <>
      <Breadcrumbs />
      <AnalyticsDashboard initialPlatformData={platformData} initialQuizData={quizData} />
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
    // Get platform analytics data
    const [platformData, quizData] = await Promise.all([
      supabase.rpc('get_platform_analytics', { p_date_range: '30d' }),
      supabase.rpc('get_quiz_insights')
    ]);

    return {
      props: {
        platformData: platformData.data || null,
        quizData: quizData.data || null
      }
    };
  } catch (error) {
    console.error('Error loading analytics data:', error);
    return {
      props: {
        platformData: null,
        quizData: null
      }
    };
  }
};
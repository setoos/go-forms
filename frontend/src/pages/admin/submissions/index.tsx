import { GetServerSideProps } from 'next';
import QuizSubmissions from '../../../components/admin/QuizSubmissions';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function SubmissionsPage() {
  return (
    <>
      <Breadcrumbs />
      <QuizSubmissions />
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
  
  return {
    props: {}
  };
};
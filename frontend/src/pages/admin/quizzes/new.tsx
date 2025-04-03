import { GetServerSideProps } from 'next';
import QuizEditor from '../../../components/admin/QuizEditor';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function NewQuizPage() {
  return (
    <>
      <Breadcrumbs />
      <QuizEditor />
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
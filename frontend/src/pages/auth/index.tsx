import { GetServerSideProps } from 'next';
import AuthForm from '../../components/auth/AuthForm';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  return <AuthForm />;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Check if user is already authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is authenticated, redirect to dashboard
  if (session) {
    return {
      redirect: {
        destination: '/admin/quizzes',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};
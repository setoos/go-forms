import { GetServerSideProps } from 'next';
import TemplateEditor from '../../../components/admin/TemplateEditor';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function NewTemplatePage({ quizzes }) {
  return (
    <>
      <Breadcrumbs />
      <TemplateEditor initialQuizzes={quizzes} />
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
    // Get user's quizzes for template assignment
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('created_by', session.user.id)
      .is('deleted_at', null)
      .order('title');
      
    if (error) {
      throw error;
    }
    
    return {
      props: {
        quizzes: quizzes || []
      }
    };
  } catch (error) {
    console.error('Error loading quizzes:', error);
    return {
      props: {
        quizzes: []
      }
    };
  }
};
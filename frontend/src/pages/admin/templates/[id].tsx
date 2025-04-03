import { GetServerSideProps } from 'next';
import TemplateEditor from '../../../components/admin/TemplateEditor';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function EditTemplatePage({ template, quizzes }) {
  return (
    <>
      <Breadcrumbs />
      <TemplateEditor initialTemplate={template} initialQuizzes={quizzes} />
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
    // Get the template data
    const { data: template, error: templateError } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError) {
      return {
        notFound: true
      };
    }

    // Check if the user has permission to edit this template
    if (template.created_by && template.created_by !== session.user.id) {
      return {
        notFound: true
      };
    }

    // Get user's quizzes for template assignment
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('created_by', session.user.id)
      .is('deleted_at', null)
      .order('title');
      
    if (quizzesError) {
      throw quizzesError;
    }

    return {
      props: {
        template,
        quizzes: quizzes || []
      }
    };
  } catch (error) {
    console.error('Error loading template:', error);
    return {
      notFound: true
    };
  }
};
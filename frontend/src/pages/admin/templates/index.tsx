import { GetServerSideProps } from 'next';
import TemplateList from '../../../components/admin/TemplateList';
import Breadcrumbs from '../../../components/Breadcrumbs';
import { supabase } from '../../../lib/supabase';

export default function TemplatesPage({ templates }) {
  return (
    <>
      <Breadcrumbs />
      <TemplateList initialTemplates={templates} />
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
    // Get templates
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    // Filter templates to only show those created by the current user or system templates
    const filteredTemplates = (data || []).filter(template => 
      !template.created_by || template.created_by === session.user.id
    );
    
    return {
      props: {
        templates: filteredTemplates
      }
    };
  } catch (error) {
    console.error('Error loading templates:', error);
    return {
      props: {
        templates: []
      }
    };
  }
};
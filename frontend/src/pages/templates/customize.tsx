import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import QuizTemplateCustomizer from '../../components/templates/QuizTemplateCustomizer';
import { supabase } from '../../lib/supabase';

export default function TemplateCustomizerPage() {
  const router = useRouter();
  const { template } = router.query;
  
  return <QuizTemplateCustomizer templateId={template as string} />;
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
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
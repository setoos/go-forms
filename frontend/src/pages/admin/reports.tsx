import { GetServerSideProps } from 'next';
import ReportTemplatesPage from '../../components/admin/ReportTemplatesPage';
import Breadcrumbs from '../../components/Breadcrumbs';
import { supabase } from '../../lib/supabase';

export default function ReportsPage() {
  return (
    <>
      <Breadcrumbs />
      <ReportTemplatesPage />
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
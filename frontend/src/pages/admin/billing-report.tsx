import { GetServerSideProps } from 'next';
import BillingReport from '../../components/admin/BillingReport';
import Breadcrumbs from '../../components/Breadcrumbs';
import { supabase } from '../../lib/supabase';

export default function BillingReportPage() {
  return (
    <>
      <Breadcrumbs />
      <BillingReport />
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
import { GetServerSideProps } from 'next';
import UserSettings from '../../components/settings/UserSettings';
import { supabase } from '../../lib/supabase';

export default function SettingsPage({ activeTab }) {
  return <UserSettings initialTab={activeTab} />;
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const tab = params?.tab as string;
  
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
  
  // Validate tab
  const validTabs = ['account', 'notifications', 'privacy', 'security', 'theme', 'billing'];
  const activeTab = validTabs.includes(tab) ? tab : 'account';
  
  return {
    props: {
      activeTab
    }
  };
};
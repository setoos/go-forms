import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '../lib/theme';
import { AuthProvider } from '../lib/auth';
import { ToastContainer } from 'react-toastify';
import DashboardLayout from '../components/DashboardLayout';
import { initAnalytics } from '../lib/analytics';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';

export default function App({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    // Initialize analytics on client-side only
    if (typeof window !== 'undefined') {
      const cleanup = initAnalytics();
      return () => {
        cleanup();
      };
    }
  }, []);

  // Check if the current route should use the dashboard layout
  const useDashboardLayout = !router.pathname.includes('/auth/callback');

  return (
    <ThemeProvider>
      <AuthProvider>
        {useDashboardLayout ? (
          <DashboardLayout>
            <Component {...pageProps} />
          </DashboardLayout>
        ) : (
          <Component {...pageProps} />
        )}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </AuthProvider>
    </ThemeProvider>
  );
}
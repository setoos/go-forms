import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { QuizAnalytics as Analytics } from '../../types/quiz';
import QuizAnalyticsDashboard from './QuizAnalyticsDashboard';
import { generatePDF } from '../../lib/pdf';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../lib/auth';
import { Loader2, Lock } from 'lucide-react';

export default function QuizAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      loadAnalytics();
    }
  }, [id, user, authLoading, navigate]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: analyticsError } = await supabase
        .rpc('get_quiz_analytics', { quiz_id: id });

      if (analyticsError) throw analyticsError;
      if (!data) throw new Error('No analytics data found');

      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!analytics) return;

    try {
      if (format === 'pdf') {
        const pdfData = {
          id: id || '',
          name: 'Quiz Analytics Report',
          email: 'analytics@goforms.com',
          timestamp: new Date().toISOString(),
          score: analytics.averageScore,
          answers: analytics.questionAnalytics.reduce((acc, q) => ({
            ...acc,
            [q.id]: Math.round(q.correctRate * 100)
          }), {})
        };
        await generatePDF(pdfData);
      } else if (format === 'csv') {
        // Generate CSV
        const csvContent = [
          ['Question', 'Correct Rate', 'Average Time (s)', 'Total Responses'],
          ...analytics.questionAnalytics.map(q => [
            q.text,
            `${Math.round(q.correctRate * 100)}%`,
            Math.round(q.averageTimeSpent),
            Object.values(q.answerDistribution).reduce((a, b) => a + b, 0)
          ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-analytics-${new Date().toISOString()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      showToast('Export completed successfully', 'success');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      showToast('Failed to export analytics', 'error');
    }
  };

  // If still checking authentication status, show loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-16 w-16 text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view quiz analytics.</p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-background rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-medium text-text mb-2">Failed to load analytics</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => loadAnalytics()}
          className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <QuizAnalyticsDashboard analytics={analytics} onExport={handleExport} />;
}
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "../../lib/supabase.ts";
import type { QuizAnalytics as Analytics } from "../../types/quiz.ts";
import QuizAnalyticsDashboard from "./QuizAnalyticsDashboard.tsx";
import { generatePDF } from "../../lib/pdf.ts";
import { showToast } from "../../lib/toast.ts";

export default function QuizAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [id]);

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
          email: 'analytics@vidoora.com',
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
          className="inline-flex items-center px-4 py-2 bg-secondary text-text rounded-lg hover:bg-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <QuizAnalyticsDashboard analytics={analytics} onExport={handleExport} />;
}
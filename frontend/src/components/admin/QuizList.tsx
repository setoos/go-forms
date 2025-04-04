import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, Eye, AlertCircle, FileText, BarChart3, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { showToast } from '../../lib/toast';
import type { Quiz } from '../../types/quiz';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadQuizzes();
    }
  }, [user]);

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError(null);

      // Ensure user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching quizzes:', fetchError);
        throw new Error('Failed to load quizzes. Please try again.');
      }

      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError(error instanceof Error ? error.message : 'Failed to load quizzes');
      showToast('Failed to load quizzes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz(id: string) {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .rpc('soft_delete_quiz', { quiz_id: id });

      if (error) throw error;
      
      await loadQuizzes();
      showToast('Quiz deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      showToast('Failed to delete quiz', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load GoForms</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => loadQuizzes()}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My GoForms</h1>
          <p className="text-gray-600 mt-1">Manage your GoForm collection</p>
        </div>
        <Link
          to="/admin/quizzes/new"
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create GoForm
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FileText className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No GoForms yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first GoForm to start engaging with your audience. It's easy to get started!
          </p>
          <div className="space-y-4 max-w-xs mx-auto">
            <Link
              to="/admin/quizzes/new"
              className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create GoForm
            </Link>
            <Link
              to="/quiz/sample"
              className="w-full flex items-center justify-center px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Eye className="w-5 h-5 mr-2" />
              View Sample GoForm
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {quiz.title}
                    </div>
                    {quiz.description && (
                      <div className="text-sm text-gray-500">
                        {quiz.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      quiz.is_published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {quiz.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {quiz.completion_count} responses
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      to={`/quiz/${quiz.id}`}
                      className="inline-flex items-center p-1 text-purple-600 hover:text-purple-900 transition-colors"
                      title="Preview GoForm"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/admin/quizzes/${quiz.id}/analytics`}
                      className="inline-flex items-center p-1 text-green-600 hover:text-green-900 transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/admin/billing-report"
                      className="inline-flex items-center p-1 text-amber-600 hover:text-amber-900 transition-colors"
                      title="View Billing Report"
                    >
                      <DollarSign className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/admin/quizzes/${quiz.id}`}
                      className="inline-flex items-center p-1 text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit GoForm"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="inline-flex items-center p-1 text-red-600 hover:text-red-900 transition-colors"
                      title="Delete GoForm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  Loader, 
  AlertCircle,
  SortAsc,
  SortDesc,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';
import { generatePDF } from '../../lib/pdf';

interface QuizSubmission {
  id: string;
  quiz_id: string;
  quiz_name: string;
  participant_name: string;
  participant_email: string;
  score: number;
  submission_date: string;
  completion_time: number;
  status: 'completed' | 'incomplete';
  answers: Record<string, any>;
}

export default function QuizSubmissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [quizFilter, setQuizFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'date' | 'score' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<{id: string, title: string}[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<QuizSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubmissions();
      loadQuizzes();
    }
  }, [user, dateRange, statusFilter, quizFilter]);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('created_by', user?.id)
        .is('deleted_at', null)
        .order('title');

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      let startDate: Date | null = null;
      if (dateRange !== 'all') {
        startDate = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        startDate.setDate(startDate.getDate() - days);
      }

      // Build query
      let query = supabase
        .from('quiz_responses')
        .select(`
          id,
          quiz_id,
          name,
          email,
          score,
          created_at,
          completion_time,
          answers,
          quizzes (
            id,
            title,
            created_by
          )
        `)
        .order('created_at', { ascending: false });

      // Add date filter if applicable
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      // Add quiz filter if applicable
      if (quizFilter !== 'all') {
        query = query.eq('quiz_id', quizFilter);
      }

      // Execute query
      const { data, error } = await query;

      if (error) throw error;

      // Filter submissions to only include those from quizzes created by the current user
      const userSubmissions = (data || []).filter(submission => 
        submission.quizzes?.created_by === user?.id
      );

      // Format submissions
      const formattedSubmissions: QuizSubmission[] = userSubmissions.map(submission => ({
        id: submission.id,
        quiz_id: submission.quiz_id,
        quiz_name: submission.quizzes?.title || 'Unknown Quiz',
        participant_name: submission.name,
        participant_email: submission.email,
        score: submission.score,
        submission_date: submission.created_at,
        completion_time: submission.completion_time || 0,
        status: submission.completion_time ? 'completed' : 'incomplete',
        answers: submission.answers
      }));

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (submission: QuizSubmission) => {
    navigate(`/admin/submissions/${submission.id}`);
  };

  const handleDownloadPDF = async (submission: QuizSubmission) => {
    try {
      // Format the submission data for PDF generation
      const pdfData = {
        id: submission.id,
        name: submission.participant_name,
        email: submission.participant_email,
        quiz_id: submission.quiz_id,
        score: submission.score,
        completion_time: submission.completion_time,
        timestamp: submission.submission_date,
        answers: submission.answers
      };

      await generatePDF(pdfData);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const headers = ['Submission ID', 'Quiz', 'Participant', 'Email', 'Score', 'Date', 'Status'];
      const rows = filteredSubmissions.map(submission => [
        submission.id,
        submission.quiz_name,
        submission.participant_name,
        submission.participant_email,
        `${submission.score}%`,
        new Date(submission.submission_date).toLocaleDateString(),
        submission.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-submissions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('CSV exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Failed to export CSV', 'error');
    }
  };

  const toggleSubmissionExpand = (submissionId: string) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const toggleSort = (field: 'date' | 'score' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Apply filters and sorting
  const filteredSubmissions = submissions.filter(submission => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!submission.participant_name.toLowerCase().includes(query) && 
          !submission.participant_email.toLowerCase().includes(query) && 
          !submission.quiz_name.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Apply status filter
    if (statusFilter !== 'all' && submission.status !== statusFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime()
        : new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime();
    } else if (sortField === 'score') {
      return sortDirection === 'asc' 
        ? a.score - b.score
        : b.score - a.score;
    } else {
      return sortDirection === 'asc'
        ? a.participant_name.localeCompare(b.participant_name)
        : b.participant_name.localeCompare(a.participant_name);
    }
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to view submissions</p>
          <button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GoForm Submissions</h1>
          <p className="text-gray-600">View and analyze all GoForm submissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or GoForm..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'incomplete')}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="incomplete">Incomplete</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={quizFilter}
                onChange={(e) => setQuizFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="all">All GoForms</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-12 w-12 text-purple-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Submissions</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={loadSubmissions}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all' || quizFilter !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'No GoForm submissions have been received yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === 'date' && (
                        sortDirection === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" />
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GoForm
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      Participant
                      {sortField === 'name' && (
                        sortDirection === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" />
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('score')}
                  >
                    <div className="flex items-center">
                      Score
                      {sortField === 'score' && (
                        sortDirection === 'asc' 
                          ? <SortAsc className="ml-1 h-4 w-4" />
                          : <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(submission.submission_date), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(submission.submission_date), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.quiz_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.participant_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {submission.participant_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(submission)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(submission)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Download PDF"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => toggleSubmissionExpand(submission.id)}
                            className="text-gray-500 hover:text-gray-700"
                            title="Toggle Details"
                          >
                            {expandedSubmission === submission.id ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedSubmission === submission.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Details</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Submission ID:</span>
                                  <span className="text-sm text-gray-900">{submission.id.substring(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Completion Time:</span>
                                  <span className="text-sm text-gray-900">{formatDuration(submission.completion_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Questions Answered:</span>
                                  <span className="text-sm text-gray-900">{Object.keys(submission.answers || {}).length}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleViewDetails(submission)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                                >
                                  <span>View Full Details</span>
                                  <ArrowUpRight className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(submission)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                                >
                                  <span>Download PDF Report</span>
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Download, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Mail, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  ArrowDownToLine, 
  Printer, 
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { 
  Submission, 
  AccessLog, 
  getQuizSubmissions, 
  getAccessLogs, 
  calculateSubmissionCost 
} from '../../lib/billing';

// Financial summary type
interface FinancialSummary {
  totalBillableAmount: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  invoiceGenerationDate: string;
  paymentDueDate: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export default function BillingReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissionData, setSubmissionData] = useState<Submission[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'access' | 'financial'>('submissions');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all' | 'custom'>('30d');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'date' | 'cost' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [quizFilter, setQuizFilter] = useState<string>('all');

  // Load data
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Calculate date range
        let startDate: Date;
        let endDate = new Date();
        
        if (dateRange === 'custom') {
          startDate = new Date(customDateRange.start);
          endDate = new Date(customDateRange.end);
          endDate.setHours(23, 59, 59, 999); // End of day
        } else if (dateRange === 'all') {
          startDate = new Date(0); // Beginning of time
        } else {
          const days = dateRange === '7d' ? 7 : 30;
          startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
        }
        
        // In a real app, this would be API calls to fetch the data
        // For this demo, we'll use mock data
        
        // Get quiz submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            quiz_id,
            participant_name,
            participant_email,
            started_at,
            completed_at,
            score,
            ip_address,
            quizzes (
              title
            )
          `)
          .gte('started_at', startDate.toISOString())
          .lte('started_at', endDate.toISOString())
          .order('started_at', { ascending: false });
          
        if (submissionsError) {
          throw submissionsError;
        }
        
        // Format submissions data
        const formattedSubmissions: Submission[] = submissionsData?.map(sub => ({
          id: sub.id,
          quizId: sub.quiz_id,
          quizName: sub.quizzes?.title || 'Unknown Quiz',
          submissionDate: sub.started_at,
          user: {
            name: sub.participant_name || 'Anonymous',
            email: sub.participant_email || 'anonymous@example.com'
          },
          ipAddress: sub.ip_address || '0.0.0.0',
          sessionDuration: sub.completed_at 
            ? Math.round((new Date(sub.completed_at).getTime() - new Date(sub.started_at).getTime()) / 1000)
            : 0,
          completionStatus: sub.completed_at ? 'completed' : 'incomplete',
          cost: calculateSubmissionCost(sub.completed_at ? 'completed' : 'incomplete')
        })) || [];
        
        // Get access logs
        const { data: logsData, error: logsError } = await supabase
          .from('analytics_events')
          .select(`
            id,
            user_id,
            event_type,
            event_data,
            page_url,
            referrer,
            user_agent,
            ip_address,
            created_at
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
          
        if (logsError) {
          throw logsError;
        }
        
        // Format access logs data
        const formattedLogs: AccessLog[] = logsData?.map(log => {
          // Extract quiz info from event data
          const quizInfo = log.event_data?.quiz || { id: 'unknown', title: 'Unknown Quiz' };
          
          // Extract user info from event data
          const userInfo = log.event_data?.user || { name: 'Anonymous', email: 'anonymous@example.com' };
          
          return {
            id: log.id,
            quizId: quizInfo.id,
            quizName: quizInfo.title,
            user: {
              name: userInfo.name,
              email: userInfo.email
            },
            timestamp: log.created_at,
            ipAddress: log.ip_address || '0.0.0.0',
            action: log.event_type,
            status: log.event_data?.status || 'success',
            details: log.event_data?.details || 'No details available'
          };
        }) || [];
        
        // Calculate financial summary
        const completedSubmissions = formattedSubmissions.filter(s => s.completionStatus === 'completed');
        const incompleteSubmissions = formattedSubmissions.filter(s => s.completionStatus === 'incomplete');
        
        const completedCost = completedSubmissions.length * 0.50;
        const incompleteCost = incompleteSubmissions.length * 0.25;
        const totalCost = completedCost + incompleteCost;
        
        const financialSummaryData: FinancialSummary = {
          totalBillableAmount: totalCost,
          paymentStatus: 'pending',
          invoiceGenerationDate: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1).toISOString(),
          paymentDueDate: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 15).toISOString(),
          billingPeriod: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          lineItems: [
            {
              description: 'Completed quiz submissions',
              quantity: completedSubmissions.length,
              unitPrice: 0.50,
              amount: completedCost
            },
            {
              description: 'Incomplete quiz submissions',
              quantity: incompleteSubmissions.length,
              unitPrice: 0.25,
              amount: incompleteCost
            }
          ]
        };
        
        setSubmissionData(formattedSubmissions);
        setAccessLogs(formattedLogs);
        setFinancialSummary(financialSummaryData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load report data. Please try again later.');
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate, dateRange, customDateRange]);

  // Get unique quizzes for filter
  const uniqueQuizzes = Array.from(new Set(submissionData.map(s => s.quizId))).map(quizId => {
    const submission = submissionData.find(s => s.quizId === quizId);
    return {
      id: quizId,
      name: submission?.quizName || 'Unknown Quiz'
    };
  });

  // Filter and sort submission data
  const filteredSubmissions = submissionData.filter(submission => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        submission.quizName.toLowerCase().includes(query) ||
        submission.user.name.toLowerCase().includes(query) ||
        submission.user.email.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && submission.completionStatus !== statusFilter) {
      return false;
    }
    
    // Quiz filter
    if (quizFilter !== 'all' && submission.quizId !== quizFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime()
        : new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
    } else if (sortField === 'cost') {
      return sortDirection === 'asc' 
        ? a.cost - b.cost
        : b.cost - a.cost;
    } else {
      return sortDirection === 'asc'
        ? a.completionStatus.localeCompare(b.completionStatus)
        : b.completionStatus.localeCompare(a.completionStatus);
    }
  });

  // Filter access logs
  const filteredAccessLogs = accessLogs.filter(log => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        log.quizName.toLowerCase().includes(query) ||
        log.user.name.toLowerCase().includes(query) ||
        log.user.email.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Quiz filter
    if (quizFilter !== 'all' && log.quizId !== quizFilter) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const toggleSubmissionExpand = (submissionId: string) => {
    setExpandedSubmission(expandedSubmission === submissionId ? null : submissionId);
  };

  const toggleSort = (field: 'date' | 'cost' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDateRangeChange = (range: '7d' | '30d' | 'all' | 'custom') => {
    setDateRange(range);
  };

  const handleStatusFilterChange = (status: 'all' | 'completed' | 'incomplete') => {
    setStatusFilter(status);
  };

  const handleQuizFilterChange = (quizId: string) => {
    setQuizFilter(quizId);
  };

  const handleDownloadReport = (format: 'pdf' | 'csv' | 'excel') => {
    showToast(`Downloading report in ${format.toUpperCase()} format`, 'success');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const calculateTotalCost = () => {
    return filteredSubmissions.reduce((total, submission) => total + submission.cost, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-background rounded-lg shadow-xl p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-primary transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text">Billing Report</h1>
            <p className="text-gray-600">Detailed report of quiz submissions and associated costs</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadReport('pdf')}
            className="flex items-center px-3 py-1.5 text-sm text-secondary border border-secondary rounded-lg hover:bg-accent"
          >
            <Download className="h-4 w-4 mr-1.5" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadReport('csv')}
            className="flex items-center px-3 py-1.5 text-sm text-secondary border border-secondary rounded-lg hover:bg-accent"
          >
            <ArrowDownToLine className="h-4 w-4 mr-1.5" />
            CSV
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center px-3 py-1.5 text-sm text-secondary border border-secondary rounded-lg hover:bg-accent"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-background rounded-lg shadow-md mb-6">
        <div className="border-b border-border">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'submissions'
                  ? 'border-accent0 text-secondary'
                  : 'border-transparent text-gray-500 hover:text-text hover:border-border'
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'access'
                  ? 'border-accent0 text-secondary'
                  : 'border-transparent text-gray-500 hover:text-text hover:border-border'
              }`}
            >
              Access Control
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'financial'
                  ? 'border-accent0 text-secondary'
                  : 'border-transparent text-gray-500 hover:text-text hover:border-border'
              }`}
            >
              Financial Summary
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by quiz name, user, or email..."
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as any)}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
                <option value="custom">Custom range</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={quizFilter}
                onChange={(e) => handleQuizFilterChange(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
              >
                <option value="all">All Quizzes</option>
                {uniqueQuizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>{quiz.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {activeTab === 'submissions' && (
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value as any)}
                  className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="incomplete">Incomplete</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom date range inputs (only show if custom is selected) */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-text mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-text mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-accent0 focus:border-accent0 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-accent rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Submissions</div>
            <div className="text-xl font-bold">{filteredSubmissions.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Completed</div>
            <div className="text-xl font-bold">
              {filteredSubmissions.filter(s => s.completionStatus === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Incomplete</div>
            <div className="text-xl font-bold">
              {filteredSubmissions.filter(s => s.completionStatus === 'incomplete').length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Cost</div>
            <div className="text-xl font-bold">{formatCurrency(calculateTotalCost())}</div>
          </div>
        </div>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="bg-background rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      Date/Time
                      {sortField === 'date' && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="ml-1 h-4 w-4" />
                          : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="ml-1 h-4 w-4" />
                          : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('cost')}
                  >
                    <div className="flex items-center">
                      Cost
                      {sortField === 'cost' && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="ml-1 h-4 w-4" />
                          : <ChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <React.Fragment key={submission.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{formatDate(submission.submissionDate)}</div>
                        <div className="text-xs text-gray-500">{formatTime(submission.submissionDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text">{submission.quizName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{submission.quizId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{submission.user.name}</div>
                        <div className="text-xs text-gray-500">{submission.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{formatDuration(submission.sessionDuration)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.completionStatus === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {submission.completionStatus.charAt(0).toUpperCase() + submission.completionStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                        {formatCurrency(submission.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => toggleSubmissionExpand(submission.id)}
                          className="text-secondary hover:text-primary"
                        >
                          {expandedSubmission === submission.id ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded submission details */}
                    {expandedSubmission === submission.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">IP Address</div>
                              <div className="text-sm font-medium">{submission.ipAddress}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Cost Calculation</div>
                              <div className="text-sm font-medium">
                                {submission.completionStatus === 'completed' ? 'Completed submission: $0.50' : 'Incomplete submission: $0.25'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Quiz ID</div>
                              <div className="text-sm font-medium">{submission.quizId}</div>
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
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-text mb-1">No submissions found</h3>
              <p className="text-gray-500">
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </div>
      )}

      {/* Access Control Tab */}
      {activeTab === 'access' && (
        <div className="bg-background rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-gray-200">
                {filteredAccessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text">{formatDate(log.timestamp)}</div>
                      <div className="text-xs text-gray-500">{formatTime(log.timestamp)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text">{log.user.name}</div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text">{log.quizName}</div>
                      <div className="text-xs text-gray-500">{log.quizId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text capitalize">{log.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAccessLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-text mb-1">No access logs found</h3>
              <p className="text-gray-500">
                Try adjusting your filters to see more results
              </p>
            </div>
          )}
        </div>
      )}

      {/* Financial Summary Tab */}
      {activeTab === 'financial' && financialSummary && (
        <div className="space-y-6">
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Financial Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Total Billable Amount</div>
                <div className="text-2xl font-bold text-text">{formatCurrency(financialSummary.totalBillableAmount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                <div className="text-lg font-medium">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    financialSummary.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : financialSummary.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {financialSummary.paymentStatus.charAt(0).toUpperCase() + financialSummary.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Invoice Generation Date</div>
                <div className="text-lg font-medium">{formatDate(financialSummary.invoiceGenerationDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Payment Due Date</div>
                <div className="text-lg font-medium">{formatDate(financialSummary.paymentDueDate)}</div>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">Billing Period</div>
              <div className="text-lg font-medium">
                {formatDate(financialSummary.billingPeriod.start)} - {formatDate(financialSummary.billingPeriod.end)}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-text mb-3">Line Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-gray-200">
                    {financialSummary.lineItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text text-right">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text text-right">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text text-right">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text text-right">
                        {formatCurrency(financialSummary.totalBillableAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="bg-background rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Payment Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-text mb-3">Credit Card</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center mr-3">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium">•••• •••• •••• 4242</div>
                      <div className="text-sm text-gray-500">Expires 06/26</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => showToast('Payment processed successfully', 'success')}
                    className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-text mb-3">Bank Transfer</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Account Name</div>
                      <div className="font-medium">GoForms Inc.</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Account Number</div>
                      <div className="font-medium">XXXX-XXXX-XXXX-1234</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Routing Number</div>
                      <div className="font-medium">XXX-XXX-XXX</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('GoForms Inc. - XXXX-XXXX-XXXX-1234 - XXX-XXX-XXX');
                      showToast('Bank details copied to clipboard', 'success');
                    }}
                    className="w-full px-4 py-2 bg-background border border-border text-text rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
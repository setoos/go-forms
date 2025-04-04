import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  Users, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MousePointerClick,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  TrendingUp,
  Target,
  Brain,
  Award,
  BookOpen,
  Lightbulb,
  Loader2,
  Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../lib/auth';

// Define color constants
const COLORS = ['#9333ea', '#c084fc', '#e9d5ff', '#f3e8ff'];
const CHART_COLORS = {
  primary: '#9333ea',
  secondary: '#c084fc',
  tertiary: '#e9d5ff',
  quaternary: '#f3e8ff'
};

interface AnalyticsData {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  retentionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  trafficSources: {
    organic: number;
    paid: number;
    referral: number;
    direct: number;
  };
  pageViews: {
    page: string;
    views: number;
    uniqueVisitors: number;
  }[];
  campaigns: {
    name: string;
    clicks: number;
    conversions: number;
    cost: number;
  }[];
  quizInsights: {
    totalQuizzes: number;
    totalAttempts: number;
    overallAverageScore: number;
    overallCompletionRate: number;
    difficultyDistribution: Record<string, number>;
    categoryDistribution: {
      category: string;
      quizCount: number;
      averageScore: number;
    }[];
    recentTrends: {
      date: string;
      attempts: number;
      averageScore: number;
    }[];
    topQuizzes: {
      id: string;
      title: string;
      attempts: number;
      averageScore: number;
      completionRate: number;
    }[];
  };
}

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  format?: 'number' | 'percentage' | 'time' | 'currency';
}

function MetricCard({ title, value, change, icon, format = 'number' }: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'time':
        return `${Math.floor(val / 60)}m ${Math.round(val % 60)}s`;
      case 'currency':
        return `$${val.toFixed(2)}`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-8 w-8 text-purple-600"
        })}
        {change !== undefined && (
          <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadAnalytics();
    }
  }, [dateRange, user, authLoading, navigate]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const [platformData, quizData] = await Promise.all([
        supabase.rpc('get_platform_analytics', { p_date_range: dateRange }),
        supabase.rpc('get_quiz_insights')
      ]);

      if (platformData.error) throw platformData.error;
      if (quizData.error) throw quizData.error;

      // Ensure we have valid data before setting state
      if (!platformData.data || !quizData.data) {
        throw new Error('Failed to load analytics data');
      }

      setData({
        ...platformData.data,
        quizInsights: {
          ...quizData.data,
          recentTrends: quizData.data.recentTrends || [],
          topQuizzes: quizData.data.topQuizzes || []
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async (format: 'csv') => {
    try {
      if (!data) return;

      if (format === 'csv') {
        const csvContent = [
          ['Metric', 'Value'],
          ['Daily Active Users', data.dailyActiveUsers],
          ['Monthly Active Users', data.monthlyActiveUsers],
          ['Retention Rate', `${data.retentionRate}%`],
          ['Average Session Duration', data.averageSessionDuration],
          ['Bounce Rate', `${data.bounceRate}%`],
          ['Total GoForms', data.quizInsights.totalQuizzes],
          ['Total GoForm Attempts', data.quizInsights.totalAttempts],
          ['Overall Average Score', `${data.quizInsights.overallAverageScore}%`],
          ['Overall Completion Rate', `${data.quizInsights.overallCompletionRate}%`]
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${new Date().toISOString()}.csv`;
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
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  // If not authenticated, redirect to login (handled in useEffect)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view analytics.</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => loadAnalytics()}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Format trend data for the chart
  const trendData = (data.quizInsights.recentTrends || []).map(trend => ({
    ...trend,
    date: format(new Date(trend.date), 'MMM d'),
    attempts: trend.attempts || 0,
    averageScore: Math.round(trend.averageScore || 0)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into platform performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center px-3 py-2 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Daily Active Users"
          value={data.dailyActiveUsers}
          change={12}
          icon={<Users />}
        />
        <MetricCard
          title="Monthly Active Users"
          value={data.monthlyActiveUsers}
          change={8.5}
          icon={<Users />}
        />
        <MetricCard
          title="Avg. Session Duration"
          value={data.averageSessionDuration}
          change={5.2}
          icon={<Clock />}
          format="time"
        />
        <MetricCard
          title="Bounce Rate"
          value={data.bounceRate}
          change={-1.8}
          icon={<MousePointerClick />}
          format="percentage"
        />
      </div>

      {/* Quiz Analytics Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">GoForm Analytics Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Total GoForms</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.quizInsights.totalQuizzes}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Total Attempts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.quizInsights.totalAttempts}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(data.quizInsights.overallAverageScore)}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(data.quizInsights.overallCompletionRate)}%
            </p>
          </div>
        </div>

        {/* Quiz Performance Trends */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-900 mb-4">GoForm Performance Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" name="Attempts" />
                <YAxis yAxisId="right" orientation="right" name="Score" unit="%" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  name="Attempts"
                  dataKey="attempts"
                  stroke={CHART_COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorAttempts)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  name="Average Score"
                  dataKey="averageScore"
                  stroke={CHART_COLORS.secondary}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Quizzes */}
        <div className="mt-8">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Top Performing GoForms</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GoForm Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data.quizInsights.topQuizzes || []).map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quiz.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(quiz.averageScore)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(quiz.completionRate)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(data.trafficSources || {}).map(([key, value]) => ({
                    name: key,
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(data.trafficSources || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-8">
            {Object.entries(data.trafficSources || {}).map(([source, value], index) => (
              <div key={source} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-600 capitalize">
                  {source}: {((value / Object.values(data.trafficSources || {}).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Page Views */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Most Visited Pages</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pageViews || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill={CHART_COLORS.primary} />
                <Bar dataKey="uniqueVisitors" fill={CHART_COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
          <button className="flex items-center text-sm text-purple-600 hover:text-purple-800">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(data.campaigns || []).map((campaign) => (
                <tr key={campaign.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.conversions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${campaign.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((campaign.conversions * 100) / campaign.cost).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
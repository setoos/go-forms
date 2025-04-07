import React from 'react';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  Timer, 
  Trophy,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import type { QuizAnalytics } from '../../types/quiz';

interface Props {
  analytics: QuizAnalytics;
  onExport: (format: 'csv' | 'pdf' | 'excel') => void;
}

const COLORS = ['#9333ea', '#c084fc', '#e9d5ff', '#f3e8ff'];

export default function QuizAnalyticsDashboard({ analytics, onExport }: Props) {
  // Prepare data for charts
  const completionData = [
    { name: 'Completed', value: analytics.completionRate * 100 },
    { name: 'Incomplete', value: (1 - analytics.completionRate) * 100 }
  ];

  const scoreDistribution = analytics.recentAttempts.reduce((acc, attempt) => {
    const score = attempt.score || 0;
    const range = Math.floor(score / 10) * 10;
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const scoreDistributionData = Object.entries(scoreDistribution).map(([range, count]) => ({
    range: `${range}-${Number(range) + 9}`,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-bold text-text">
              {analytics.totalAttempts}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Total Attempts</h3>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-bold text-text">
              {Math.round(analytics.averageScore)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-bold text-text">
              {Math.round(analytics.passRate * 100)}%
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Pass Rate</h3>
        </div>

        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <Timer className="h-8 w-8 text-secondary" />
            <span className="text-3xl font-bold text-text">
              {Math.round(analytics.averageTimeSpent / 60)}m
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500">Avg. Time Spent</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate */}
        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text">Completion Rate</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-8">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-accent rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Incomplete</span>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-background rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text">Score Distribution</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#9333ea" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Question Analysis */}
      <div className="bg-background rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text">Question Analysis</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onExport('csv')}
              className="inline-flex items-center px-3 py-2 text-sm text-secondary hover:text-primary border border-secondary rounded-lg hover:bg-accent"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => onExport('pdf')}
              className="inline-flex items-center px-3 py-2 text-sm text-secondary hover:text-primary border border-secondary rounded-lg hover:bg-accent"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {analytics.questionAnalytics.map((question, index) => (
            <div key={question.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-text">Question {index + 1}</h3>
                  <p className="text-gray-600 mt-1">{question.text}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500">Correct Rate</span>
                  <p className="text-2xl font-bold text-text">
                    {Math.round(question.correctRate * 100)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>Answer Distribution</span>
                    <span>Responses</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(question.answerDistribution).map(([option, count]) => (
                      <div key={option} className="flex items-center">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-secondary rounded-full"
                            style={{ 
                              width: `${(count / Object.values(question.answerDistribution)
                                .reduce((a, b) => a + b, 0)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-2">Average Time Spent</div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-lg font-medium text-text">
                      {Math.round(question.averageTimeSpent)} seconds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="bg-background rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-text mb-6">Recent Attempts</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-gray-200">
              {analytics.recentAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text">
                      {attempt.participant_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {attempt.participant_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (attempt.score || 0) >= 70
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attempt.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attempt.completed_at && attempt.started_at ? (
                      `${Math.round((new Date(attempt.completed_at).getTime() - 
                        new Date(attempt.started_at).getTime()) / 1000 / 60)}m`
                    ) : (
                      'Incomplete'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attempt.started_at).toLocaleDateString()}
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
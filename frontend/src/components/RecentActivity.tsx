import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileQuestion, User, Calendar, ArrowRight, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Mock recent activity data
const recentActivities = [
  {
    id: '1',
    type: 'goform_created',
    title: 'Marketing Assessment',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    link: '/admin/quizzes/1'
  },
  {
    id: '2',
    type: 'template_edited',
    title: 'Quarterly Business Report',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    link: '/admin/reports'
  },
  {
    id: '3',
    type: 'goform_response',
    title: 'Product Knowledge GoForm',
    user: 'john.doe@example.com',
    score: 85,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    link: '/admin/quizzes/3/analytics'
  },
  {
    id: '4',
    type: 'form_created',
    title: 'Customer Feedback Form',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    link: '/forms/templates'
  },
  {
    id: '5',
    type: 'goform_published',
    title: 'Team Evaluation Survey',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    link: '/admin/quizzes/5'
  }
];

export default function RecentActivity() {
  return (
    <div className="bg-background rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
        <Link 
          to="/admin/analytics" 
          className="text-sm text-secondary hover:text-primary flex items-center"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentActivities.map(activity => (
          <div key={activity.id} className="flex items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex-shrink-0 mr-3">
              {activity.type.includes('goform') ? (
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <FileQuestion className="h-5 w-5 text-secondary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between">
                <h3 className="text-sm font-medium text-text truncate">
                  {activity.type === 'goform_created' && 'Created GoForm'}
                  {activity.type === 'template_edited' && 'Edited template'}
                  {activity.type === 'goform_response' && 'New GoForm response'}
                  {activity.type === 'form_created' && 'Created form'}
                  {activity.type === 'goform_published' && 'Published GoForm'}
                </h3>
                <span className="text-xs text-gray-500 flex items-center mt-1 sm:mt-0">
                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                  {formatDistanceToNow(activity.date, { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mt-1 truncate">
                <Link to={activity.link} className="font-medium hover:text-secondary">
                  {activity.title}
                </Link>
                {activity.type === 'goform_response' && (
                  <span className="ml-1">
                    by <span className="font-medium">{activity.user}</span> with score <span className="font-medium">{activity.score}%</span>
                  </span>
                )}
              </p>
              
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                {format(activity.date, 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
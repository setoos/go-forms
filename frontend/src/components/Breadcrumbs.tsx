import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, DollarSign, Inbox } from 'lucide-react';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

// Define breadcrumb configurations for different paths
const breadcrumbConfigs: Record<string, BreadcrumbConfig[]> = {
  '/admin/quizzes': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/quizzes', label: 'My Quizzes' }
  ],
  '/admin/quizzes/new': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/quizzes', label: 'My Quizzes' },
    { path: '/admin/quizzes/new', label: 'Create Quiz' }
  ],
  '/admin/analytics': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/analytics', label: 'Analytics Dashboard' }
  ],
  '/admin/reports': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/reports', label: 'Report Templates' }
  ],
  '/admin/billing-report': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/analytics', label: 'Analytics' },
    { path: '/admin/billing-report', label: 'Billing Report', icon: <DollarSign className="h-4 w-4" /> }
  ],
  '/admin/submissions': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/admin/submissions', label: 'Quiz Submissions', icon: <Inbox className="h-4 w-4" /> }
  ],
  '/forms/templates': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/forms', label: 'Forms' },
    { path: '/forms/templates', label: 'Templates Library' }
  ],
  '/forms/categories/lead-magnet': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/forms/templates', label: 'Templates Library' },
    { path: '/forms/categories/lead-magnet', label: 'Lead Magnet Templates' }
  ],
  '/forms/categories/hr': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/forms/templates', label: 'Templates Library' },
    { path: '/forms/categories/hr', label: 'HR Evaluation Forms' }
  ],
  '/forms/categories/academic': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/forms/templates', label: 'Templates Library' },
    { path: '/forms/categories/academic', label: 'Academic Quiz Formats' }
  ],
  '/forms/categories/certificate': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/forms/templates', label: 'Templates Library' },
    { path: '/forms/categories/certificate', label: 'Certificate Formats' }
  ],
  '/settings/account': [
    { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { path: '/settings/account', label: 'Account Settings' }
  ]
};

export default function Breadcrumbs() {
  const location = useLocation();
  
  // Find the matching breadcrumb configuration
  const getMatchingConfig = () => {
    // Try exact match first
    if (breadcrumbConfigs[location.pathname]) {
      return breadcrumbConfigs[location.pathname];
    }
    
    // Try to match dynamic routes
    if (location.pathname.startsWith('/admin/quizzes/') && location.pathname !== '/admin/quizzes/new') {
      return [
        { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
        { path: '/admin/quizzes', label: 'My Quizzes' },
        { path: location.pathname, label: 'Edit Quiz' }
      ];
    }
    
    if (location.pathname.startsWith('/admin/quizzes/') && location.pathname.includes('/analytics')) {
      return [
        { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
        { path: '/admin/quizzes', label: 'My Quizzes' },
        { path: location.pathname, label: 'Quiz Analytics' }
      ];
    }
    
    if (location.pathname.startsWith('/admin/submissions/')) {
      return [
        { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
        { path: '/admin/submissions', label: 'Quiz Submissions' },
        { path: location.pathname, label: 'Submission Details' }
      ];
    }
    
    if (location.pathname.startsWith('/forms/templates/')) {
      return [
        { path: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
        { path: '/forms/templates', label: 'Templates Library' },
        { path: location.pathname, label: 'Template Details' }
      ];
    }
    
    // Return null if no match found
    return null;
  };
  
  const breadcrumbs = getMatchingConfig();
  
  // Don't render breadcrumbs if no configuration is found or on the home page
  if (!breadcrumbs || location.pathname === '/') {
    return null;
  }
  
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={crumb.path} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-1 h-4 w-4 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="text-sm font-medium text-gray-500">
                  {crumb.icon && (
                    <span className="mr-1.5 inline-flex">{crumb.icon}</span>
                  )}
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  to={crumb.path}
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 inline-flex items-center"
                >
                  {crumb.icon && (
                    <span className="mr-1.5">{crumb.icon}</span>
                  )}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
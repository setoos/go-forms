import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  BarChart3, 
  // Settings, 
  FileQuestion, 
  // ClipboardList, 
  // Mail, 
  // Users, 
  // GraduationCap, 
  // Award 
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();
  
  const quickActions = [
    { 
      label: 'Create Quiz', 
      icon: <PlusCircle className="h-5 w-5" />, 
      onClick: () => navigate('/admin/quizzes/new'),
      color: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    { 
      label: 'My GoForms', 
      icon: <FileQuestion className="h-5 w-5" />, 
      onClick: () => navigate('/admin/quizzes'),
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    { 
      label: 'View Analytics', 
      icon: <BarChart3 className="h-5 w-5" />, 
      onClick: () => navigate('/admin/analytics'),
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    { 
      label: 'Report Templates', 
      icon: <FileText className="h-5 w-5" />, 
      onClick: () => navigate('/admin/reports'),
      color: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  ];
  
  // const formCategories = [
  //   { 
  //     label: 'Lead Magnets', 
  //     icon: <Mail className="h-5 w-5" />, 
  //     onClick: () => navigate('/forms/categories/lead-magnet'),
  //     color: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
  //   },
  //   { 
  //     label: 'HR Forms', 
  //     icon: <Users className="h-5 w-5" />, 
  //     onClick: () => navigate('/forms/categories/hr'),
  //     color: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
  //   },
  //   { 
  //     label: 'Academic Quizzes', 
  //     icon: <GraduationCap className="h-5 w-5" />, 
  //     onClick: () => navigate('/forms/categories/academic'),
  //     color: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
  //   },
  //   { 
  //     label: 'Certificates', 
  //     icon: <Award className="h-5 w-5" />, 
  //     onClick: () => navigate('/forms/categories/certificate'),
  //     color: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
  //   }
  // ];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${action.color}`}
          >
            {action.icon}
            <span className="mt-2 text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
      
      {/* <h3 className="text-sm font-medium text-gray-700 mb-3">Form Categories</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {formCategories.map((category, index) => (
          <button
            key={index}
            onClick={category.onClick}
            className={`flex items-center justify-center p-3 rounded-lg transition-colors ${category.color}`}
          >
            {category.icon}
            <span className="ml-2 text-sm hidden sm:inline">{category.label}</span>
          </button>
        ))}
      </div> */}
    </div>
  );
}
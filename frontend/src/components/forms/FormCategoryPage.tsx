import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Mail,
  Users,
  GraduationCap,
  Award,
  Calendar,
  Tag,
  Briefcase,
  CheckSquare,
  Download,
  FileText,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../../lib/toast';

// Category metadata
const categories = {
  'lead-magnet': {
    id: 'lead-magnet',
    name: 'Lead Magnet Templates',
    icon: <Mail className="h-5 w-5" />,
    description: 'Forms designed to capture leads and grow your audience',
    subcategories: [
      { id: 'newsletter', name: 'Email Newsletter Signup' },
      { id: 'resource', name: 'Free Resource Download' },
      { id: 'webinar', name: 'Webinar/Event Registration' },
      { id: 'consultation', name: 'Consultation Booking' },
      { id: 'demo', name: 'Product Demo Request' }
    ]
  },
  'hr': {
    id: 'hr',
    name: 'HR Evaluation Forms',
    icon: <Users className="h-5 w-5" />,
    description: 'Professional forms for human resources and employee management',
    subcategories: [
      { id: 'performance', name: 'Performance Review' },
      { id: 'application', name: 'Job Application' },
      { id: 'interview', name: 'Interview Feedback' },
      { id: 'training', name: 'Training Assessment' },
      { id: 'survey', name: 'Employee Satisfaction' }
    ]
  },
  'academic': {
    id: 'academic',
    name: 'Academic Quiz Formats',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Educational assessment and evaluation templates',
    subcategories: [
      { id: 'multiple-choice', name: 'Multiple Choice Exam' },
      { id: 'essay', name: 'Essay Question Format' },
      { id: 'rubric', name: 'Assessment Rubric' },
      { id: 'progress', name: 'Progress Tracking' },
      { id: 'evaluation', name: 'Course Evaluation' }
    ]
  },
  'certificate': {
    id: 'certificate',
    name: 'Certificate Formats',
    icon: <Award className="h-5 w-5" />,
    description: 'Professional certificate and recognition templates',
    subcategories: [
      { id: 'completion', name: 'Course Completion' },
      { id: 'achievement', name: 'Achievement Recognition' },
      { id: 'professional', name: 'Professional Certification' },
      { id: 'training', name: 'Training Completion' },
      { id: 'workshop', name: 'Workshop Attendance' }
    ]
  }
};

// Mock template data for the selected category
const getTemplatesForCategory = (categoryId: string) => {
  // This would typically come from an API
  const templates = [
    {
      id: `${categoryId}-1`,
      title: categoryId === 'lead-magnet' ? 'Email Newsletter Signup' :
             categoryId === 'hr' ? 'Employee Performance Review' :
             categoryId === 'academic' ? 'Multiple Choice Exam Template' : 'Course Completion Certificate',
      description: 'Professional template with customizable fields and modern design.',
      subcategory: categoryId === 'lead-magnet' ? 'newsletter' :
                  categoryId === 'hr' ? 'performance' :
                  categoryId === 'academic' ? 'multiple-choice' : 'completion',
      previewImage: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=1974&auto=format&fit=crop',
      tags: ['professional', 'modern', 'customizable'],
      industry: 'Education',
      lastUpdated: '2025-04-15'
    },
    {
      id: `${categoryId}-2`,
      title: categoryId === 'lead-magnet' ? 'E-book Download Form' :
             categoryId === 'hr' ? 'Job Application Form' :
             categoryId === 'academic' ? 'Essay Question Format' : 'Achievement Recognition Template',
      description: 'Clean and minimal design with essential fields and clear instructions.',
      subcategory: categoryId === 'lead-magnet' ? 'resource' :
                  categoryId === 'hr' ? 'application' :
                  categoryId === 'academic' ? 'essay' : 'achievement',
      previewImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1974&auto=format&fit=crop',
      tags: ['minimal', 'clean', 'professional'],
      industry: 'Corporate',
      lastUpdated: '2025-04-10'
    },
    {
      id: `${categoryId}-3`,
      title: categoryId === 'lead-magnet' ? 'Webinar Registration Form' :
             categoryId === 'hr' ? 'Interview Feedback Form' :
             categoryId === 'academic' ? 'Student Assessment Rubric' : 'Professional Certification Design',
      description: 'Comprehensive template with all necessary fields and professional layout.',
      subcategory: categoryId === 'lead-magnet' ? 'webinar' :
                  categoryId === 'hr' ? 'interview' :
                  categoryId === 'academic' ? 'rubric' : 'professional',
      previewImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4?q=80&w=1770&auto=format&fit=crop',
      tags: ['comprehensive', 'professional', 'detailed'],
      industry: 'Professional Services',
      lastUpdated: '2025-04-05'
    },
    {
      id: `${categoryId}-4`,
      title: categoryId === 'lead-magnet' ? 'Consultation Booking Form' :
             categoryId === 'hr' ? 'Training Assessment Form' :
             categoryId === 'academic' ? 'Progress Tracking Form' : 'Training Completion Certificate',
      description: 'User-friendly template with intuitive layout and clear instructions.',
      subcategory: categoryId === 'lead-magnet' ? 'consultation' :
                  categoryId === 'hr' ? 'training' :
                  categoryId === 'academic' ? 'progress' : 'training',
      previewImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1974&auto=format&fit=crop',
      tags: ['user-friendly', 'intuitive', 'clear'],
      industry: 'Education',
      lastUpdated: '2025-03-28'
    },
    {
      id: `${categoryId}-5`,
      title: categoryId === 'lead-magnet' ? 'Product Demo Request Form' :
             categoryId === 'hr' ? 'Employee Satisfaction Survey' :
             categoryId === 'academic' ? 'Course Evaluation Template' : 'Workshop Attendance Certificate',
      description: 'Elegant template with modern design and essential fields.',
      subcategory: categoryId === 'lead-magnet' ? 'demo' :
                  categoryId === 'hr' ? 'survey' :
                  categoryId === 'academic' ? 'evaluation' : 'workshop',
      previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1770&auto=format&fit=crop',
      tags: ['elegant', 'modern', 'essential'],
      industry: 'Corporate',
      lastUpdated: '2025-03-22'
    }
  ];
  
  return templates;
};

// Industries for filtering
const industries = [
  'Education',
  'Marketing',
  'Technology',
  'Human Resources',
  'Corporate',
  'Consulting',
  'Publishing',
  'Professional Services',
  'Events',
  'All Industries'
];

export default function FormCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  
  if (!categoryId || !categories[categoryId as keyof typeof categories]) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Category Not Found</h3>
          <p className="text-gray-500 mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/forms/templates')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const category = categories[categoryId as keyof typeof categories];
  const templates = getTemplatesForCategory(categoryId);
  
  // Filter templates based on search, subcategory, and industry
  const filteredTemplates = templates.filter(template => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Subcategory filter
    if (selectedSubcategory && template.subcategory !== selectedSubcategory) {
      return false;
    }
    
    // Industry filter
    if (selectedIndustry !== 'All Industries' && template.industry !== selectedIndustry) {
      return false;
    }
    
    return true;
  });

  const handleSubcategoryFilter = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(industry);
  };

  const handleDownload = (templateId: string, format: 'pdf' | 'html') => {
    showToast(`Downloading template in ${format.toUpperCase()} format`, 'success');
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/forms/templates/${templateId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/forms/templates')}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center">
            {React.cloneElement(category.icon, { className: 'h-6 w-6 text-purple-600 mr-3' })}
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          </div>
          <p className="mt-1 text-gray-600">{category.description}</p>
        </div>
      </div>

      {/* Search and Filters */}
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
              placeholder="Search templates..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedIndustry}
                onChange={(e) => handleIndustryFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory(null);
                setSelectedIndustry('All Industries');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Subcategory Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSubcategoryFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedSubcategory === null
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All {category.name}
          </button>
          {category.subcategories.map(subcategory => (
            <button
              key={subcategory.id}
              onClick={() => handleSubcategoryFilter(subcategory.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedSubcategory === subcategory.id
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory(null);
                setSelectedIndustry('All Industries');
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Template Preview Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={template.previewImage} 
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-4 text-white">
                      <h3 className="font-semibold text-lg">{template.title}</h3>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {template.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      Updated: {template.lastUpdated}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.industry}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(template.id, 'pdf')}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(template.id, 'html')}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                        title="Download HTML"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template.id)}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
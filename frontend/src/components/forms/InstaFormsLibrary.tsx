import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Copy, FileText, Users, GraduationCap, Award, Mail, Calendar, Video, PhoneCall, Monitor, ClipboardList, Briefcase, FileQuestion, Star, BookOpen, CheckSquare, AlignCenterVertical as Certificate, Medal, Bookmark, ChevronDown, ChevronUp, ExternalLink, Printer } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { showToast } from '../../lib/toast';

// Form template interface
interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: 'lead-magnet' | 'hr' | 'academic' | 'certificate';
  subcategory: string;
  previewImage: string;
  pdfUrl?: string;
  digitalUrl?: string;
  tags: string[];
  industry?: string;
  accessibility: {
    wcag: string;
    screenReaderFriendly: boolean;
    highContrast: boolean;
  };
  lastUpdated: string;
}

// Form templates data
const formTemplates: FormTemplate[] = [
  // Lead Magnet Templates
  {
    id: 'lm-newsletter-1',
    title: 'Email Newsletter Signup',
    description: 'Clean, minimal design for email newsletter signups with name, email, and interest fields.',
    category: 'lead-magnet',
    subcategory: 'newsletter',
    previewImage: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?q=80&w=1974&auto=format&fit=crop',
    pdfUrl: '/templates/newsletter-signup.pdf',
    digitalUrl: '/templates/newsletter-signup.html',
    tags: ['email', 'newsletter', 'marketing', 'signup'],
    industry: 'Marketing',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-15'
  },
  {
    id: 'lm-ebook-1',
    title: 'E-book Download Form',
    description: 'Conversion-optimized form for e-book and resource downloads with minimal required fields.',
    category: 'lead-magnet',
    subcategory: 'resource',
    previewImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1974&auto=format&fit=crop',
    pdfUrl: '/templates/ebook-download.pdf',
    digitalUrl: '/templates/ebook-download.html',
    tags: ['ebook', 'download', 'resource', 'lead generation'],
    industry: 'Publishing',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-04-10'
  },
  {
    id: 'lm-webinar-1',
    title: 'Webinar Registration Form',
    description: 'Complete webinar registration form with time zone selection and reminder preferences.',
    category: 'lead-magnet',
    subcategory: 'webinar',
    previewImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e4?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/webinar-registration.pdf',
    digitalUrl: '/templates/webinar-registration.html',
    tags: ['webinar', 'event', 'registration', 'virtual'],
    industry: 'Education',
    accessibility: {
      wcag: 'AAA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-05'
  },
  {
    id: 'lm-consultation-1',
    title: 'Consultation Booking Form',
    description: 'Professional consultation booking form with calendar integration and service selection.',
    category: 'lead-magnet',
    subcategory: 'consultation',
    previewImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1974&auto=format&fit=crop',
    pdfUrl: '/templates/consultation-booking.pdf',
    digitalUrl: '/templates/consultation-booking.html',
    tags: ['consultation', 'booking', 'appointment', 'services'],
    industry: 'Consulting',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-03-28'
  },
  {
    id: 'lm-demo-1',
    title: 'Product Demo Request Form',
    description: 'Streamlined product demo request form with qualification questions and scheduling options.',
    category: 'lead-magnet',
    subcategory: 'demo',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/product-demo.pdf',
    digitalUrl: '/templates/product-demo.html',
    tags: ['demo', 'product', 'saas', 'b2b'],
    industry: 'Technology',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-03-22'
  },

  // HR Evaluation Forms
  {
    id: 'hr-performance-1',
    title: 'Employee Performance Review',
    description: 'Comprehensive employee performance evaluation form with competency assessment and goal tracking.',
    category: 'hr',
    subcategory: 'performance',
    previewImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/performance-review.pdf',
    digitalUrl: '/templates/performance-review.html',
    tags: ['performance', 'evaluation', 'employee', 'review'],
    industry: 'Human Resources',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-12'
  },
  {
    id: 'hr-application-1',
    title: 'Job Application Form',
    description: 'Professional job application form with resume upload, work history, and custom screening questions.',
    category: 'hr',
    subcategory: 'application',
    previewImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/job-application.pdf',
    digitalUrl: '/templates/job-application.html',
    tags: ['job', 'application', 'hiring', 'recruitment'],
    industry: 'Human Resources',
    accessibility: {
      wcag: 'AAA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-08'
  },
  {
    id: 'hr-interview-1',
    title: 'Interview Feedback Form',
    description: 'Structured interview feedback form with candidate evaluation criteria and hiring recommendation.',
    category: 'hr',
    subcategory: 'interview',
    previewImage: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/interview-feedback.pdf',
    digitalUrl: '/templates/interview-feedback.html',
    tags: ['interview', 'feedback', 'hiring', 'candidate'],
    industry: 'Human Resources',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-03-30'
  },
  {
    id: 'hr-training-1',
    title: 'Training Assessment Form',
    description: 'Training program assessment form with learning outcomes evaluation and improvement suggestions.',
    category: 'hr',
    subcategory: 'training',
    previewImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/training-assessment.pdf',
    digitalUrl: '/templates/training-assessment.html',
    tags: ['training', 'assessment', 'learning', 'development'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-03-25'
  },
  {
    id: 'hr-satisfaction-1',
    title: 'Employee Satisfaction Survey',
    description: 'Comprehensive employee satisfaction survey with engagement metrics and anonymous feedback options.',
    category: 'hr',
    subcategory: 'survey',
    previewImage: 'https://images.unsplash.com/photo-1529119513315-c7c361862fc7?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/employee-satisfaction.pdf',
    digitalUrl: '/templates/employee-satisfaction.html',
    tags: ['satisfaction', 'survey', 'engagement', 'feedback'],
    industry: 'Human Resources',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-03-18'
  },

  // Academic Quiz Formats
  {
    id: 'ac-multiple-1',
    title: 'Multiple Choice Exam Template',
    description: 'Versatile multiple choice exam template with answer key and automatic scoring.',
    category: 'academic',
    subcategory: 'multiple-choice',
    previewImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/multiple-choice.pdf',
    digitalUrl: '/templates/multiple-choice.html',
    tags: ['multiple choice', 'exam', 'quiz', 'assessment'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-14'
  },
  {
    id: 'ac-essay-1',
    title: 'Essay Question Format',
    description: 'Academic essay question format with rubric, word count limits, and citation guidelines.',
    category: 'academic',
    subcategory: 'essay',
    previewImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1773&auto=format&fit=crop',
    pdfUrl: '/templates/essay-question.pdf',
    digitalUrl: '/templates/essay-question.html',
    tags: ['essay', 'writing', 'assessment', 'academic'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-04-07'
  },
  {
    id: 'ac-rubric-1',
    title: 'Student Assessment Rubric',
    description: 'Detailed assessment rubric with performance criteria and scoring guidelines.',
    category: 'academic',
    subcategory: 'rubric',
    previewImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1774&auto=format&fit=crop',
    pdfUrl: '/templates/assessment-rubric.pdf',
    digitalUrl: '/templates/assessment-rubric.html',
    tags: ['rubric', 'assessment', 'grading', 'criteria'],
    industry: 'Education',
    accessibility: {
      wcag: 'AAA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-03-31'
  },
  {
    id: 'ac-progress-1',
    title: 'Progress Tracking Form',
    description: 'Student progress tracking form with learning objectives and achievement milestones.',
    category: 'academic',
    subcategory: 'progress',
    previewImage: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/progress-tracking.pdf',
    digitalUrl: '/templates/progress-tracking.html',
    tags: ['progress', 'tracking', 'student', 'achievement'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-03-24'
  },
  {
    id: 'ac-evaluation-1',
    title: 'Course Evaluation Template',
    description: 'Comprehensive course evaluation form with instructor assessment and content quality ratings.',
    category: 'academic',
    subcategory: 'evaluation',
    previewImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/course-evaluation.pdf',
    digitalUrl: '/templates/course-evaluation.html',
    tags: ['course', 'evaluation', 'feedback', 'instructor'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-03-20'
  },

  // Certificate Formats
  {
    id: 'cert-completion-1',
    title: 'Course Completion Certificate',
    description: 'Professional course completion certificate with customizable fields and modern design.',
    category: 'certificate',
    subcategory: 'completion',
    previewImage: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/course-completion.pdf',
    digitalUrl: '/templates/course-completion.html',
    tags: ['certificate', 'completion', 'course', 'education'],
    industry: 'Education',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-13'
  },
  {
    id: 'cert-achievement-1',
    title: 'Achievement Recognition Template',
    description: 'Elegant achievement recognition certificate for outstanding performance or milestones.',
    category: 'certificate',
    subcategory: 'achievement',
    previewImage: 'https://images.unsplash.com/photo-1523294587484-bae6cc870010?q=80&w=1964&auto=format&fit=crop',
    pdfUrl: '/templates/achievement-recognition.pdf',
    digitalUrl: '/templates/achievement-recognition.html',
    tags: ['achievement', 'recognition', 'award', 'performance'],
    industry: 'Corporate',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-04-09'
  },
  {
    id: 'cert-professional-1',
    title: 'Professional Certification Design',
    description: 'Official-looking professional certification template with seal and signature fields.',
    category: 'certificate',
    subcategory: 'professional',
    previewImage: 'https://images.unsplash.com/photo-1471970394675-613138e45da3?q=80&w=1780&auto=format&fit=crop',
    pdfUrl: '/templates/professional-certification.pdf',
    digitalUrl: '/templates/professional-certification.html',
    tags: ['professional', 'certification', 'credential', 'official'],
    industry: 'Professional Services',
    accessibility: {
      wcag: 'AAA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-04-02'
  },
  {
    id: 'cert-training-1',
    title: 'Training Completion Certificate',
    description: 'Training program completion certificate with skills acquired and instructor endorsement.',
    category: 'certificate',
    subcategory: 'training',
    previewImage: 'https://images.unsplash.com/photo-1565689157206-0fddef7589a2?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/training-completion.pdf',
    digitalUrl: '/templates/training-completion.html',
    tags: ['training', 'completion', 'skills', 'professional development'],
    industry: 'Corporate',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: true
    },
    lastUpdated: '2025-03-27'
  },
  {
    id: 'cert-workshop-1',
    title: 'Workshop Attendance Certificate',
    description: 'Workshop attendance certificate with event details and participation acknowledgment.',
    category: 'certificate',
    subcategory: 'workshop',
    previewImage: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=1770&auto=format&fit=crop',
    pdfUrl: '/templates/workshop-attendance.pdf',
    digitalUrl: '/templates/workshop-attendance.html',
    tags: ['workshop', 'attendance', 'event', 'participation'],
    industry: 'Events',
    accessibility: {
      wcag: 'AA',
      screenReaderFriendly: true,
      highContrast: false
    },
    lastUpdated: '2025-03-21'
  }
];

// Category metadata
const categories = [
  {
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
  {
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
  {
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
  {
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
];

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

export default function InstaFormsLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'lead-magnet': true,
    'hr': true,
    'academic': true,
    'certificate': true
  });
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter templates based on search, category, subcategory, and industry
  const filteredTemplates = formTemplates.filter(template => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
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

  // Group templates by category
  const templatesByCategory = categories.map(category => {
    const templatesInCategory = filteredTemplates.filter(t => t.category === category.id);
    return {
      ...category,
      templates: templatesInCategory
    };
  });

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleTemplateExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null);
  };

  const handleSubcategoryFilter = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(industry);
  };

  const handleDownload = (template: FormTemplate, format: 'pdf' | 'digital') => {
    // In a real application, this would download the template
    // For this demo, we'll just show a toast
    showToast(`Downloading ${template.title} in ${format === 'pdf' ? 'PDF' : 'HTML'} format`, 'success');
  };

  const handleUseTemplate = (template: FormTemplate) => {
    // In a real application, this would open the template in the editor
    // For this demo, we'll just show a toast
    showToast(`Opening ${template.title} in editor`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">InstaForms Library</h1>
        <p className="mt-2 text-lg text-gray-600">
          Professional form templates for every industry and purpose
        </p>
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
                setSelectedCategory(null);
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

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === null
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryFilter(category.id)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedCategory === category.id
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {React.cloneElement(category.icon, { className: 'h-4 w-4 mr-1.5' })}
              {category.name}
            </button>
          ))}
        </div>

        {/* Subcategory Pills (only show if category is selected) */}
        {selectedCategory && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSubcategoryFilter(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedSubcategory === null
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All {categories.find(c => c.id === selectedCategory)?.name}
            </button>
            {categories
              .find(c => c.id === selectedCategory)
              ?.subcategories.map(subcategory => (
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
        )}
      </div>

      {/* Templates by Category */}
      <div className="space-y-10">
        {templatesByCategory.map(category => {
          // Skip categories with no templates after filtering
          if (category.templates.length === 0) return null;
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-6 bg-gray-50 cursor-pointer"
                onClick={() => toggleCategoryExpand(category.id)}
              >
                <div className="flex items-center">
                  {React.cloneElement(category.icon, { className: 'h-6 w-6 text-purple-600 mr-3' })}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700">
                  {expandedCategories[category.id] ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Templates Grid */}
              {expandedCategories[category.id] && (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.templates.map(template => (
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
                          <div className="flex items-center">
                            {template.accessibility.screenReaderFriendly && (
                              <span title="Screen Reader Friendly" className="text-green-600 mr-1">
                                <span className="sr-only">Screen Reader Friendly</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            <span title={`WCAG ${template.accessibility.wcag} Compliant`} className="text-blue-600">
                              <span className="sr-only">WCAG {template.accessibility.wcag} Compliant</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={() => toggleTemplateExpand(template.id)}
                            className="text-sm text-purple-600 hover:text-purple-800"
                          >
                            {expandedTemplate === template.id ? 'Less info' : 'More info'}
                          </button>
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                          >
                            Use Template
                          </button>
                        </div>
                        
                        {/* Expanded Template Info */}
                        {expandedTemplate === template.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Industry</h4>
                              <p className="text-sm text-gray-600">{template.industry}</p>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Accessibility</h4>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                  WCAG {template.accessibility.wcag}
                                </span>
                                {template.accessibility.screenReaderFriendly && (
                                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                                    Screen Reader Friendly
                                  </span>
                                )}
                                {template.accessibility.highContrast && (
                                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded">
                                    High Contrast
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">All Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <button
                                onClick={() => handleDownload(template, 'pdf')}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                PDF
                              </button>
                              <button
                                onClick={() => handleDownload(template, 'digital')}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FileText className="h-4 w-4 mr-1.5" />
                                HTML
                              </button>
                              <button
                                onClick={() => window.open('#', '_blank')}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <ExternalLink className="h-4 w-4 mr-1.5" />
                                Preview
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Printer className="h-4 w-4 mr-1.5" />
                                Print
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* No results message */}
        {templatesByCategory.every(category => category.templates.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedIndustry('All Industries');
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
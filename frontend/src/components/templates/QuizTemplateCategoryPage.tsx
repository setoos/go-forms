import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  Sliders, 
  AlertCircle, 
  Loader, 
  BookOpen, 
  Briefcase, 
  Shield, 
  FileQuestion
} from 'lucide-react';
import { showToast } from '../../lib/toast';
import QuizTemplateCard from './QuizTemplateCard';

// Category metadata
const categories = {
  'academic': {
    id: 'academic',
    name: 'Academic',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Educational assessment templates for academic settings',
    subcategories: [
      { id: 'math', name: 'Mathematics' },
      { id: 'science', name: 'Science' },
      { id: 'history', name: 'History' },
      { id: 'language', name: 'Language' }
    ]
  },
  'professional': {
    id: 'professional',
    name: 'Professional Development',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Assessment templates for workplace skills and knowledge',
    subcategories: [
      { id: 'leadership', name: 'Leadership' },
      { id: 'technical', name: 'Technical Skills' },
      { id: 'soft-skills', name: 'Soft Skills' }
    ]
  },
  'compliance': {
    id: 'compliance',
    name: 'Compliance Training',
    icon: <Shield className="h-5 w-5" />,
    description: 'Templates for regulatory and policy compliance assessments',
    subcategories: [
      { id: 'safety', name: 'Safety' },
      { id: 'security', name: 'Security' },
      { id: 'ethics', name: 'Ethics' }
    ]
  },
  'employee': {
    id: 'employee',
    name: 'Employee Assessment',
    icon: <Users className="h-5 w-5" />,
    description: 'Templates for evaluating employee performance and knowledge',
    subcategories: [
      { id: 'performance', name: 'Performance' },
      { id: 'knowledge', name: 'Knowledge Check' },
      { id: 'skill', name: 'Skill Evaluation' }
    ]
  }
};

// Audience levels
const audienceLevels = [
  { id: 'all', name: 'All Levels' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'expert', name: 'Expert' }
];

// Mock function to get templates for a category
const getTemplatesForCategory = (categoryId: string) => {
  // This would normally come from an API
  return [
    {
      id: `${categoryId}-template-1`,
      title: categoryId === 'academic' ? 'Algebra Basics Quiz' :
             categoryId === 'professional' ? 'Management Fundamentals' :
             categoryId === 'compliance' ? 'Workplace Safety Fundamentals' : 'Annual Performance Review',
      description: 'Comprehensive assessment template with customizable questions and scoring',
      duration: 30,
      questionCount: 20,
      audienceLevel: 'intermediate',
      previewImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070',
      popularity: 4.8,
      lastUpdated: '2025-04-15'
    },
    {
      id: `${categoryId}-template-2`,
      title: categoryId === 'academic' ? 'Introduction to Calculus' :
             categoryId === 'professional' ? 'Team Building and Collaboration' :
             categoryId === 'compliance' ? 'Data Protection and Privacy' : 'Product Knowledge Assessment',
      description: 'In-depth assessment with varied question types and detailed analytics',
      duration: 45,
      questionCount: 25,
      audienceLevel: 'advanced',
      previewImage: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2070',
      popularity: 4.6,
      lastUpdated: '2025-04-10'
    },
    {
      id: `${categoryId}-template-3`,
      title: categoryId === 'academic' ? 'Cell Biology Fundamentals' :
             categoryId === 'professional' ? 'Programming Fundamentals' :
             categoryId === 'compliance' ? 'Business Ethics and Conduct' : 'Customer Service Skills Assessment',
      description: 'Comprehensive assessment with interactive questions and detailed feedback',
      duration: 40,
      questionCount: 30,
      audienceLevel: 'beginner',
      previewImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?q=80&w=2070',
      popularity: 4.9,
      lastUpdated: '2025-04-05'
    },
    {
      id: `${categoryId}-template-4`,
      title: categoryId === 'academic' ? 'Periodic Table and Elements' :
             categoryId === 'professional' ? 'Effective Communication Skills' :
             categoryId === 'compliance' ? 'Cybersecurity Awareness' : 'Leadership Potential Assessment',
      description: 'Interactive assessment with varied question formats and comprehensive analytics',
      duration: 35,
      questionCount: 22,
      audienceLevel: 'all',
      previewImage: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=2070',
      popularity: 4.7,
      lastUpdated: '2025-03-28'
    }
  ];
};

export default function QuizTemplateCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedAudienceLevel, setSelectedAudienceLevel] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  useEffect(() => {
    if (!categoryId || !categories[categoryId as keyof typeof categories]) {
      setError('Invalid category');
      setLoading(false);
      return;
    }
    
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      try {
        const templatesData = getTemplatesForCategory(categoryId);
        setTemplates(templatesData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load templates');
        setLoading(false);
      }
    }, 800);
  }, [categoryId]);
  
  if (!categoryId || !categories[categoryId as keyof typeof categories]) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Category Not Found</h3>
          <p className="text-gray-500 mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/templates')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }
  
  const category = categories[categoryId as keyof typeof categories];
  
  // Filter templates based on search, subcategory, audience level, and duration
  const filteredTemplates = templates.filter(template => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }
    
    // Subcategory filter - this is mocked since we don't have real subcategory data
    if (selectedSubcategory) {
      // In a real app, you'd check template.subcategory === selectedSubcategory
      // For this mock, we'll just filter randomly based on template ID
      const templateIdNumber = parseInt(template.id.split('-').pop() || '0');
      if (templateIdNumber % category.subcategories.length !== 
          category.subcategories.findIndex(s => s.id === selectedSubcategory)) {
        return false;
      }
    }
    
    // Audience level filter
    if (selectedAudienceLevel && selectedAudienceLevel !== 'all' && 
        template.audienceLevel !== selectedAudienceLevel && 
        template.audienceLevel !== 'all') {
      return false;
    }
    
    // Duration filter
    if (selectedDuration) {
      if (selectedDuration === 30 && template.duration > 30) return false;
      if (selectedDuration === 60 && (template.duration <= 30 || template.duration > 60)) return false;
      if (selectedDuration === 90 && template.duration <= 60) return false;
    }
    
    return true;
  });
  
  const handleSubcategoryFilter = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
  };
  
  const handleAudienceLevelFilter = (level: string | null) => {
    setSelectedAudienceLevel(level);
  };
  
  const handleDurationFilter = (duration: number | null) => {
    setSelectedDuration(duration);
  };
  
  const toggleTemplateExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/templates')}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/templates')}
          className="mr-4 p-2 text-gray-600 hover:text-text rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center">
            {React.cloneElement(category.icon, { className: 'h-6 w-6 text-secondary mr-3' })}
            <h1 className="text-2xl font-bold text-text">{category.name} Templates</h1>
          </div>
          <p className="mt-1 text-gray-600">{category.description}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
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
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedAudienceLevel || ''}
                onChange={(e) => handleAudienceLevelFilter(e.target.value || null)}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="">All Audience Levels</option>
                {audienceLevels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedDuration?.toString() || ''}
                onChange={(e) => handleDurationFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="">Any Duration</option>
                <option value="30">Under 30 minutes</option>
                <option value="60">30-60 minutes</option>
                <option value="90">Over 60 minutes</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory(null);
                setSelectedAudienceLevel(null);
                setSelectedDuration(null);
              }}
              className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-text bg-background hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
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
                ? 'bg-accent text-primary'
                : 'bg-gray-100 text-text hover:bg-gray-200'
            }`}
          >
            All {category.name} Templates
          </button>
          {category.subcategories.map(subcategory => (
            <button
              key={subcategory.id}
              onClick={() => handleSubcategoryFilter(subcategory.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedSubcategory === subcategory.id
                  ? 'bg-accent text-primary'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="bg-background rounded-lg shadow-md p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileQuestion className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubcategory(null);
                setSelectedAudienceLevel(null);
                setSelectedDuration(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <QuizTemplateCard
                key={template.id}
                id={template.id}
                title={template.title}
                description={template.description}
                duration={template.duration}
                questionCount={template.questionCount}
                audienceLevel={template.audienceLevel}
                previewImage={template.previewImage}
                popularity={template.popularity}
                lastUpdated={template.lastUpdated}
                onExpand={toggleTemplateExpand}
                isExpanded={expandedTemplate === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
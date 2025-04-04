import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Eye, 
  Clock, 
  Users, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Award, 
  BookOpen, 
  Briefcase, 
  Shield, 
  Brain, 
  Layers, 
  BarChart, 
  FileQuestion,
  Plus,
  ArrowRight,
  Sliders,
  Calendar
} from 'lucide-react';
import { showToast } from '../../lib/toast';
import { useAuth } from '../../lib/auth';

// Template categories and subcategories
const categories = [
  {
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
  {
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
  {
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
  {
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
];

// Audience levels
const audienceLevels = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
  { id: 'expert', name: 'Expert' },
  { id: 'all', name: 'All Levels' }
];

// Mock quiz templates data
const quizTemplates = [
  // Academic - Math
  {
    id: 'math-algebra-basics',
    title: 'Algebra Basics GoForm',
    description: 'Fundamental algebra concepts assessment with equation solving and graphing problems',
    category: 'academic',
    subcategory: 'math',
    audienceLevel: 'intermediate',
    duration: 30, // minutes
    questionCount: 15,
    questionTypes: ['multiple_choice', 'fill_blank', 'matching'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['algebra', 'mathematics', 'equations', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070',
    popularity: 4.8,
    usageCount: 1245,
    lastUpdated: '2025-04-15'
  },
  {
    id: 'math-calculus-intro',
    title: 'Introduction to Calculus',
    description: 'Assessment covering derivatives, integrals, and limits for introductory calculus students',
    category: 'academic',
    subcategory: 'math',
    audienceLevel: 'advanced',
    duration: 45,
    questionCount: 20,
    questionTypes: ['multiple_choice', 'short_answer', 'fill_blank'],
    scoringMethod: 'percentage',
    passingScore: 65,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'end_of_quiz',
    tags: ['calculus', 'mathematics', 'derivatives', 'integrals', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=2070',
    popularity: 4.6,
    usageCount: 987,
    lastUpdated: '2025-04-10'
  },
  
  // Academic - Science
  {
    id: 'science-biology-cells',
    title: 'Cell Biology Fundamentals',
    description: 'Comprehensive assessment of cell structures, functions, and processes',
    category: 'academic',
    subcategory: 'science',
    audienceLevel: 'intermediate',
    duration: 40,
    questionCount: 25,
    questionTypes: ['multiple_choice', 'true_false', 'matching', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['biology', 'cells', 'science', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?q=80&w=2070',
    popularity: 4.9,
    usageCount: 1567,
    lastUpdated: '2025-04-08'
  },
  {
    id: 'science-chemistry-periodic',
    title: 'Periodic Table and Elements',
    description: 'Assessment on chemical elements, properties, and periodic table organization',
    category: 'academic',
    subcategory: 'science',
    audienceLevel: 'intermediate',
    duration: 35,
    questionCount: 20,
    questionTypes: ['multiple_choice', 'matching', 'fill_blank'],
    scoringMethod: 'percentage',
    passingScore: 65,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['chemistry', 'periodic table', 'elements', 'science', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=2070',
    popularity: 4.7,
    usageCount: 1342,
    lastUpdated: '2025-04-05'
  },
  
  // Academic - History
  {
    id: 'history-world-war-2',
    title: 'World War II Assessment',
    description: 'Comprehensive GoForm on World War II events, figures, and impacts',
    category: 'academic',
    subcategory: 'history',
    audienceLevel: 'intermediate',
    duration: 40,
    questionCount: 25,
    questionTypes: ['multiple_choice', 'true_false', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'end_of_quiz',
    tags: ['history', 'world war', 'military', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1526136522768-d49e117c287c?q=80&w=2070',
    popularity: 4.8,
    usageCount: 1876,
    lastUpdated: '2025-04-02'
  },
  
  // Academic - Language
  {
    id: 'language-grammar-essentials',
    title: 'English Grammar Essentials',
    description: 'Assessment of essential English grammar rules and usage',
    category: 'academic',
    subcategory: 'language',
    audienceLevel: 'beginner',
    duration: 30,
    questionCount: 20,
    questionTypes: ['multiple_choice', 'fill_blank', 'true_false'],
    scoringMethod: 'percentage',
    passingScore: 75,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['english', 'grammar', 'language', 'academic'],
    previewImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073',
    popularity: 4.9,
    usageCount: 2145,
    lastUpdated: '2025-03-28'
  },
  
  // Professional Development - Leadership
  {
    id: 'leadership-management-fundamentals',
    title: 'Management Fundamentals',
    description: 'Assessment of core management principles, styles, and best practices',
    category: 'professional',
    subcategory: 'leadership',
    audienceLevel: 'intermediate',
    duration: 45,
    questionCount: 30,
    questionTypes: ['multiple_choice', 'scenario', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 80,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['leadership', 'management', 'professional development'],
    previewImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070',
    popularity: 4.9,
    usageCount: 2356,
    lastUpdated: '2025-03-25'
  },
  {
    id: 'leadership-team-building',
    title: 'Team Building and Collaboration',
    description: 'Assessment of team leadership, collaboration, and conflict resolution skills',
    category: 'professional',
    subcategory: 'leadership',
    audienceLevel: 'intermediate',
    duration: 40,
    questionCount: 25,
    questionTypes: ['scenario', 'multiple_choice', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 75,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['leadership', 'team building', 'collaboration', 'professional development'],
    previewImage: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070',
    popularity: 4.8,
    usageCount: 1987,
    lastUpdated: '2025-03-22'
  },
  
  // Professional Development - Technical Skills
  {
    id: 'technical-programming-fundamentals',
    title: 'Programming Fundamentals',
    description: 'Assessment of core programming concepts, logic, and problem-solving',
    category: 'professional',
    subcategory: 'technical',
    audienceLevel: 'beginner',
    duration: 50,
    questionCount: 30,
    questionTypes: ['multiple_choice', 'code_completion', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 70,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['programming', 'coding', 'technical skills', 'professional development'],
    previewImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070',
    popularity: 4.7,
    usageCount: 2134,
    lastUpdated: '2025-03-20'
  },
  
  // Professional Development - Soft Skills
  {
    id: 'soft-skills-communication',
    title: 'Effective Communication Skills',
    description: 'Assessment of verbal, written, and interpersonal communication abilities',
    category: 'professional',
    subcategory: 'soft-skills',
    audienceLevel: 'all',
    duration: 35,
    questionCount: 25,
    questionTypes: ['scenario', 'multiple_choice', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 75,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['communication', 'soft skills', 'professional development'],
    previewImage: 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?q=80&w=2070',
    popularity: 4.9,
    usageCount: 2567,
    lastUpdated: '2025-03-18'
  },
  
  // Compliance Training - Safety
  {
    id: 'safety-workplace-fundamentals',
    title: 'Workplace Safety Fundamentals',
    description: 'Assessment of workplace safety procedures, hazard identification, and emergency protocols',
    category: 'compliance',
    subcategory: 'safety',
    audienceLevel: 'all',
    duration: 30,
    questionCount: 20,
    questionTypes: ['multiple_choice', 'true_false', 'scenario'],
    scoringMethod: 'percentage',
    passingScore: 85,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['safety', 'workplace', 'compliance', 'training'],
    previewImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070',
    popularity: 4.8,
    usageCount: 3245,
    lastUpdated: '2025-03-15'
  },
  
  // Compliance Training - Security
  {
    id: 'security-data-protection',
    title: 'Data Protection and Privacy',
    description: 'Assessment of data security practices, privacy regulations, and information protection',
    category: 'compliance',
    subcategory: 'security',
    audienceLevel: 'all',
    duration: 35,
    questionCount: 25,
    questionTypes: ['multiple_choice', 'scenario', 'true_false'],
    scoringMethod: 'percentage',
    passingScore: 90,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['security', 'data protection', 'privacy', 'compliance', 'training'],
    previewImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2070',
    popularity: 4.9,
    usageCount: 3567,
    lastUpdated: '2025-03-12'
  },
  
  // Compliance Training - Ethics
  {
    id: 'ethics-business-conduct',
    title: 'Business Ethics and Conduct',
    description: 'Assessment of ethical business practices, conduct standards, and integrity principles',
    category: 'compliance',
    subcategory: 'ethics',
    audienceLevel: 'all',
    duration: 40,
    questionCount: 30,
    questionTypes: ['scenario', 'multiple_choice', 'short_answer'],
    scoringMethod: 'percentage',
    passingScore: 85,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['ethics', 'business conduct', 'compliance', 'training'],
    previewImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071',
    popularity: 4.8,
    usageCount: 2987,
    lastUpdated: '2025-03-10'
  },
  
  // Employee Assessment - Performance
  {
    id: 'performance-annual-review',
    title: 'Annual Performance Review',
    description: 'Comprehensive assessment for annual employee performance evaluation',
    category: 'employee',
    subcategory: 'performance',
    audienceLevel: 'all',
    duration: 45,
    questionCount: 30,
    questionTypes: ['rating_scale', 'multiple_choice', 'short_answer'],
    scoringMethod: 'custom',
    passingScore: null,
    certificateEnabled: false,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['performance', 'employee', 'evaluation', 'annual review'],
    previewImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070',
    popularity: 4.9,
    usageCount: 4567,
    lastUpdated: '2025-03-08'
  },
  
  // Employee Assessment - Knowledge Check
  {
    id: 'knowledge-product-training',
    title: 'Product Knowledge Assessment',
    description: 'Evaluation of employee knowledge about company products, features, and benefits',
    category: 'employee',
    subcategory: 'knowledge',
    audienceLevel: 'all',
    duration: 30,
    questionCount: 25,
    questionTypes: ['multiple_choice', 'true_false', 'matching'],
    scoringMethod: 'percentage',
    passingScore: 80,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'immediate',
    tags: ['knowledge check', 'product training', 'employee', 'assessment'],
    previewImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070',
    popularity: 4.7,
    usageCount: 3245,
    lastUpdated: '2025-03-05'
  },
  
  // Employee Assessment - Skill Evaluation
  {
    id: 'skill-customer-service',
    title: 'Customer Service Skills Assessment',
    description: 'Evaluation of customer service skills, problem-solving, and communication abilities',
    category: 'employee',
    subcategory: 'skill',
    audienceLevel: 'all',
    duration: 40,
    questionCount: 25,
    questionTypes: ['scenario', 'multiple_choice', 'rating_scale'],
    scoringMethod: 'percentage',
    passingScore: 75,
    certificateEnabled: true,
    analyticsEnabled: true,
    feedbackType: 'detailed',
    tags: ['customer service', 'skills', 'employee', 'assessment'],
    previewImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2069',
    popularity: 4.8,
    usageCount: 2876,
    lastUpdated: '2025-03-02'
  }
];

// Question type mapping for display
const questionTypeLabels: Record<string, string> = {
  'multiple_choice': 'Multiple Choice',
  'true_false': 'True/False',
  'fill_blank': 'Fill in the Blank',
  'short_answer': 'Short Answer',
  'matching': 'Matching',
  'scenario': 'Scenario-based',
  'rating_scale': 'Rating Scale',
  'code_completion': 'Code Completion'
};

export default function QuizTemplateLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedAudienceLevel, setSelectedAudienceLevel] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'academic': true,
    'professional': true,
    'compliance': true,
    'employee': true
  });
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'date'>('popularity');

  // Filter templates based on search, category, subcategory, and audience level
  const filteredTemplates = quizTemplates.filter(template => {
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
    
    // Audience level filter
    if (selectedAudienceLevel && 
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
  }).sort((a, b) => {
    if (sortBy === 'popularity') {
      return b.popularity - a.popularity;
    } else {
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
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

  const handleAudienceLevelFilter = (level: string | null) => {
    setSelectedAudienceLevel(level);
  };

  const handleDurationFilter = (duration: number | null) => {
    setSelectedDuration(duration);
  };

  const handleSortChange = (sortType: 'popularity' | 'date') => {
    setSortBy(sortType);
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`/admin/quizzes/new?template=${templateId}`);
    showToast('Template selected. Customize your GoForm now.', 'success');
  };

  const handlePreview = (templateId: string) => {
    navigate(`/admin/quizzes/new?template=${templateId}`);
  };

  const handleDownload = (templateId: string) => {
    showToast('Template downloaded successfully', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">GoForm Template Library</h1>
        <p className="mt-2 text-lg text-gray-600">
          Professional GoForm templates for education, professional development, compliance, and employee assessment
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
                value={selectedAudienceLevel || ''}
                onChange={(e) => handleAudienceLevelFilter(e.target.value || null)}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
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

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'popularity' | 'date')}
                className="appearance-none pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="popularity">Most Popular</option>
                <option value="date">Most Recent</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Sliders className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setSelectedAudienceLevel(null);
                setSelectedDuration(null);
                setSortBy('popularity');
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
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {template.duration} min
                          </span>
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center">
                            <FileQuestion className="h-3 w-3 mr-1" />
                            {template.questionCount} questions
                          </span>
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {audienceLevels.find(a => a.id === template.audienceLevel)?.name}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Updated: {template.lastUpdated}
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`h-3.5 w-3.5 ${i < Math.floor(template.popularity) ? 'text-yellow-400' : 'text-gray-300'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
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
                            onClick={() => handleUseTemplate(template.id)}
                            className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                          >
                            Use Template
                          </button>
                        </div>
                        
                        {/* Expanded Template Info */}
                        {expandedTemplate === template.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Question Types</h4>
                              <div className="flex flex-wrap gap-1">
                                {template.questionTypes.map(type => (
                                  <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                    {questionTypeLabels[type] || type}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Scoring & Feedback</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-xs text-gray-500">Scoring Method</p>
                                  <p className="text-sm text-gray-700 capitalize">{template.scoringMethod}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Passing Score</p>
                                  <p className="text-sm text-gray-700">{template.passingScore ? `${template.passingScore}%` : 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Feedback Type</p>
                                  <p className="text-sm text-gray-700 capitalize">{template.feedbackType.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Certificate</p>
                                  <p className="text-sm text-gray-700">{template.certificateEnabled ? 'Enabled' : 'Disabled'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Tags</h4>
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
                                onClick={() => handlePreview(template.id)}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Preview
                              </button>
                              <button
                                onClick={() => handleDownload(template.id)}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                Download
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(template.id);
                                  showToast('Template ID copied to clipboard', 'success');
                                }}
                                className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy className="h-4 w-4 mr-1.5" />
                                Copy ID
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
                setSelectedAudienceLevel(null);
                setSelectedDuration(null);
              }}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Create Custom Quiz CTA */}
      <div className="mt-12 bg-purple-50 rounded-lg p-8 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Need a Custom GoForm?</h3>
          <p className="text-gray-600 max-w-2xl">
            Can't find what you're looking for? Create a custom GoForm tailored to your specific needs with our powerful GoForm builder.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/quizzes/new')}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Custom GoForm
        </button>
      </div>
    </div>
  );
}
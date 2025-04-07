import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ClipboardList,
  Search,
  Filter,
  Download,
  Copy,
  Eye,
  ArrowRight,
  Tag,
  Calendar,
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Printer,
  Plus
} from 'lucide-react';
import { showToast } from '../../lib/toast';

// Template types
type TemplateType = 'report' | 'form';
type IndustryType = 'healthcare' | 'finance' | 'manufacturing' | 'education' | 'retail' | 'technology' | 'general';

// Template interface
interface Template {
  id: string;
  title: string;
  description: string;
  type: TemplateType;
  industry: IndustryType;
  previewImage: string;
  tags: string[];
  lastUpdated: string;
  popularity: number; // 1-5 scale
  variableCount: number;
}

// Category interface
interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// Industry icons
const industryIcons: Record<IndustryType, React.ReactNode> = {
  healthcare: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M12 5 8.5 9.5m0 0L12 13m-3.5-3.5H16"></path></svg>,
  finance: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"></path><path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"></path><path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12"></path><path d="M22 9c-4.29 1-7.14-2.11-9-5 3.25 6.9 5.15 8.15 9 14"></path></svg>,
  manufacturing: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M17 18h1"></path><path d="M12 18h1"></path><path d="M7 18h1"></path></svg>,
  education: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>,
  retail: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"></path></svg>,
  technology: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>,
  general: <FileText className="h-5 w-5" />
};

// Template categories
const templateCategories: Category[] = [
  { 
    id: 'business-reports', 
    name: 'Business Reports', 
    description: 'Templates for quarterly, annual, and project-specific reports',
    icon: <FileText className="h-6 w-6 text-secondary" />
  },
  { 
    id: 'standard-forms', 
    name: 'Standard Forms', 
    description: 'Templates for employee, customer, and vendor forms',
    icon: <ClipboardList className="h-6 w-6 text-secondary" />
  },
  { 
    id: 'industry-specific', 
    name: 'Industry-Specific', 
    description: 'Templates tailored for specific industries',
    icon: <Briefcase className="h-6 w-6 text-secondary" />
  }
];

// Sample templates
const sampleTemplates: Template[] = [
  {
    id: '1',
    title: 'Quarterly Business Report',
    description: 'Standard quarterly business report template with financial summary and KPIs',
    type: 'report',
    industry: 'general',
    previewImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1770&auto=format&fit=crop',
    tags: ['business', 'quarterly', 'financial', 'report'],
    lastUpdated: '2025-04-15',
    popularity: 5,
    variableCount: 12
  },
  {
    id: '2',
    title: 'Employee Onboarding Form',
    description: 'Comprehensive employee onboarding form with personal and employment information',
    type: 'form',
    industry: 'general',
    previewImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1770&auto=format&fit=crop',
    tags: ['hr', 'onboarding', 'employee', 'form'],
    lastUpdated: '2025-04-10',
    popularity: 5,
    variableCount: 12
  },
  {
    id: '3',
    title: 'Healthcare Patient Intake Form',
    description: 'Comprehensive patient intake form for healthcare providers',
    type: 'form',
    industry: 'healthcare',
    previewImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1770&auto=format&fit=crop',
    tags: ['healthcare', 'patient', 'intake', 'medical'],
    lastUpdated: '2025-04-05',
    popularity: 4,
    variableCount: 14
  },
  {
    id: '4',
    title: 'Financial Loan Application',
    description: 'Comprehensive loan application form for financial institutions',
    type: 'form',
    industry: 'finance',
    previewImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1770&auto=format&fit=crop',
    tags: ['finance', 'loan', 'application', 'banking'],
    lastUpdated: '2025-03-30',
    popularity: 4,
    variableCount: 18
  },
  {
    id: '5',
    title: 'Manufacturing Quality Control Report',
    description: 'Quality control report template for manufacturing processes',
    type: 'report',
    industry: 'manufacturing',
    previewImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1770&auto=format&fit=crop',
    tags: ['manufacturing', 'quality control', 'production', 'report'],
    lastUpdated: '2025-03-25',
    popularity: 4,
    variableCount: 15
  },
  {
    id: '6',
    title: 'Educational Course Evaluation Form',
    description: 'Comprehensive course evaluation form for educational institutions',
    type: 'form',
    industry: 'education',
    previewImage: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1770&auto=format&fit=crop',
    tags: ['education', 'course', 'evaluation', 'feedback'],
    lastUpdated: '2025-03-20',
    popularity: 4,
    variableCount: 18
  },
  {
    id: '7',
    title: 'Annual Business Report',
    description: 'Comprehensive annual business report template with financial analysis and strategic planning',
    type: 'report',
    industry: 'general',
    previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1715&auto=format&fit=crop',
    tags: ['business', 'annual', 'financial', 'report', 'strategic'],
    lastUpdated: '2025-03-15',
    popularity: 5,
    variableCount: 20
  },
  {
    id: '8',
    title: 'Project Status Report',
    description: 'Detailed project status report template with milestones, risks, and action items',
    type: 'report',
    industry: 'general',
    previewImage: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?q=80&w=1776&auto=format&fit=crop',
    tags: ['project', 'status', 'report', 'milestones', 'risks'],
    lastUpdated: '2025-03-10',
    popularity: 4,
    variableCount: 15
  },
  {
    id: '9',
    title: 'Customer Feedback Form',
    description: 'Comprehensive customer feedback form with satisfaction ratings and open-ended questions',
    type: 'form',
    industry: 'general',
    previewImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1770&auto=format&fit=crop',
    tags: ['customer', 'feedback', 'satisfaction', 'survey'],
    lastUpdated: '2025-03-05',
    popularity: 5,
    variableCount: 10
  }
];

// Industries for filtering
const industries = [
  { id: 'all', name: 'All Industries' },
  { id: 'general', name: 'General' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'finance', name: 'Finance' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'education', name: 'Education' },
  { id: 'retail', name: 'Retail' },
  { id: 'technology', name: 'Technology' }
];

export default function DocumentTemplateLibrary() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'business-reports': true,
    'standard-forms': true,
    'industry-specific': true
  });
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'date'>('popularity');

  // Filter templates based on search, category, and industry
  const filteredTemplates = sampleTemplates.filter(template => {
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
    if (selectedCategory) {
      if (selectedCategory === 'business-reports' && template.type !== 'report') return false;
      if (selectedCategory === 'standard-forms' && template.type !== 'form') return false;
      if (selectedCategory === 'industry-specific' && template.industry === 'general') return false;
    }
    
    // Industry filter
    if (selectedIndustry !== 'all' && template.industry !== selectedIndustry) {
      return false;
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
  const templatesByCategory = templateCategories.map(category => {
    let templatesInCategory: Template[] = [];
    
    if (category.id === 'business-reports') {
      templatesInCategory = filteredTemplates.filter(t => t.type === 'report');
    } else if (category.id === 'standard-forms') {
      templatesInCategory = filteredTemplates.filter(t => t.type === 'form');
    } else if (category.id === 'industry-specific') {
      templatesInCategory = filteredTemplates.filter(t => t.industry !== 'general');
    }
    
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
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(industry);
  };

  const handleSortChange = (sortType: 'popularity' | 'date') => {
    setSortBy(sortType);
  };

  const handleDownload = (template: Template, format: 'pdf' | 'docx' | 'html') => {
    showToast(`Downloading ${template.title} in ${format.toUpperCase()} format`, 'success');
  };

  const handleUseTemplate = (template: Template) => {
    navigate(`/admin/documents/new?template=${template.id}`);
    showToast(`Creating new document from ${template.title} template`, 'success');
  };

  const handlePreview = (template: Template) => {
    navigate(`/admin/documents/preview/${template.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">Document Template Library</h1>
        <p className="mt-2 text-lg text-gray-600">
          Professional document templates for reports, forms, and industry-specific needs
        </p>
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
              placeholder="Search templates (e.g., 'report', 'healthcare', 'onboarding')..."
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={selectedIndustry}
                onChange={(e) => handleIndustryFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                {industries.map(industry => (
                  <option key={industry.id} value={industry.id}>{industry.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'popularity' | 'date')}
                className="appearance-none pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="popularity">Most Popular</option>
                <option value="date">Most Recent</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedIndustry('all');
                setSortBy('popularity');
              }}
              className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-text bg-background hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              selectedCategory === null
                ? 'bg-accent text-primary'
                : 'bg-gray-100 text-text hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {templateCategories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryFilter(category.id)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedCategory === category.id
                  ? 'bg-accent text-primary'
                  : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              {React.cloneElement(category.icon, { className: 'h-4 w-4 mr-1.5' })}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates by Category */}
      <div className="space-y-10">
        {templatesByCategory.map(category => {
          // Skip categories with no templates after filtering
          if (category.templates.length === 0) return null;
          
          return (
            <div key={category.id} className="bg-background rounded-lg shadow-md overflow-hidden">
              {/* Category Header */}
              <div 
                className="flex items-center justify-between p-6 bg-gray-50 cursor-pointer"
                onClick={() => toggleCategoryExpand(category.id)}
              >
                <div className="flex items-center">
                  {React.cloneElement(category.icon, { className: 'h-6 w-6 text-secondary mr-3' })}
                  <div>
                    <h2 className="text-xl font-semibold text-text">{category.name}</h2>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-text">
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
                    <div key={template.id} className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
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
                            <span key={tag} className="px-2 py-1 bg-accent text-primary text-xs rounded-full">
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
                          <div className="flex items-center text-xs text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                              <circle cx="12" cy="13" r="2"></circle>
                            </svg>
                            {template.variableCount} variables
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={() => toggleTemplateExpand(template.id)}
                            className="text-sm text-secondary hover:text-primary"
                          >
                            {expandedTemplate === template.id ? 'Less info' : 'More info'}
                          </button>
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="px-3 py-1 bg-secondary text-white text-sm rounded-md hover:bg-primary"
                          >
                            Use Template
                          </button>
                        </div>
                        
                        {/* Expanded Template Info */}
                        {expandedTemplate === template.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-text mb-1">Industry</h4>
                              <div className="flex items-center">
                                {industryIcons[template.industry]}
                                <span className="text-sm text-gray-600 ml-1.5">
                                  {template.industry.charAt(0).toUpperCase() + template.industry.slice(1)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-text mb-1">Type</h4>
                              <div className="flex items-center">
                                {template.type === 'report' ? (
                                  <FileText className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ClipboardList className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="text-sm text-gray-600 ml-1.5">
                                  {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-text mb-1">All Tags</h4>
                              <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-text text-xs rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => handleDownload(template, 'pdf')}
                                className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
                              >
                                <Download className="h-4 w-4 mr-1.5" />
                                PDF
                              </button>
                              <button
                                onClick={() => handleDownload(template, 'docx')}
                                className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
                              >
                                <FileText className="h-4 w-4 mr-1.5" />
                                DOCX
                              </button>
                              <button
                                onClick={() => handleDownload(template, 'html')}
                                className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                  <polyline points="13 2 13 9 20 9"></polyline>
                                </svg>
                                HTML
                              </button>
                              <button
                                onClick={() => handlePreview(template)}
                                className="flex items-center px-3 py-1.5 border border-border rounded text-sm text-text hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Preview
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
          <div className="bg-background rounded-lg shadow-md p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedIndustry('all');
                setSortBy('popularity');
              }}
              className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      
      {/* Create Custom Template CTA */}
      <div className="mt-12 bg-accent rounded-lg p-8 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text mb-2">Need a Custom Template?</h3>
          <p className="text-gray-600 max-w-2xl">
            Can't find what you're looking for? Create a custom template tailored to your specific needs with our powerful document editor.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/documents/new')}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Custom Template
        </button>
      </div>
    </div>
  );
}
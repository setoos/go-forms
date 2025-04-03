import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye,
  Calendar,
  Download,
  AlertCircle,
  Loader,
  Check,
  FileUp,
  Filter,
  SortAsc,
  SortDesc,
  Tag,
  Briefcase,
  Clock,
  Star,
  BarChart,
  FileQuestion,
  Users,
  Award,
  Mail,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';

// Template categories
const categories = [
  { id: 'report', name: 'Report Templates', icon: <FileText className="h-5 w-5" /> },
  { id: 'form', name: 'Form Templates', icon: <FileQuestion className="h-5 w-5" /> },
  { id: 'certificate', name: 'Certificate Templates', icon: <Award className="h-5 w-5" /> },
  { id: 'email', name: 'Email Templates', icon: <Mail className="h-5 w-5" /> }
];

// Industry options
const industries = [
  'All Industries',
  'Education',
  'Healthcare',
  'Finance',
  'Technology',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Government',
  'Non-profit'
];

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [sortField, setSortField] = useState<'name' | 'created_at' | 'popularity'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'report': true,
    'form': true,
    'certificate': true,
    'email': true
  });
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadTemplates();
    }
  }, [user, authLoading]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would be a database call
      // For this demo, we'll use mock data
      const mockTemplates = [
        {
          id: '1',
          name: 'Quarterly Business Report',
          description: 'Comprehensive quarterly business report template with financial analysis and KPIs',
          category: 'report',
          industry: 'Finance',
          created_at: '2025-04-15T10:00:00Z',
          created_by: user?.id,
          version: 2,
          is_default: true,
          popularity: 4.8,
          usage_count: 245,
          tags: ['business', 'financial', 'quarterly', 'report'],
          variables: ['revenue', 'expenses', 'profit', 'growth_rate', 'customer_count']
        },
        {
          id: '2',
          name: 'Employee Performance Review',
          description: 'Detailed employee performance evaluation form with competency assessment',
          category: 'form',
          industry: 'Human Resources',
          created_at: '2025-04-10T14:30:00Z',
          created_by: user?.id,
          version: 1,
          is_default: false,
          popularity: 4.5,
          usage_count: 189,
          tags: ['hr', 'performance', 'evaluation', 'employee'],
          variables: ['employee_name', 'position', 'department', 'manager', 'review_period']
        },
        {
          id: '3',
          name: 'Course Completion Certificate',
          description: 'Professional certificate template for course completion',
          category: 'certificate',
          industry: 'Education',
          created_at: '2025-04-05T09:15:00Z',
          created_by: user?.id,
          version: 3,
          is_default: true,
          popularity: 4.9,
          usage_count: 312,
          tags: ['certificate', 'education', 'course', 'completion'],
          variables: ['student_name', 'course_name', 'completion_date', 'instructor', 'grade']
        },
        {
          id: '4',
          name: 'Welcome Email Sequence',
          description: 'Email template series for new customer onboarding',
          category: 'email',
          industry: 'Marketing',
          created_at: '2025-03-28T16:45:00Z',
          created_by: user?.id,
          version: 2,
          is_default: false,
          popularity: 4.7,
          usage_count: 278,
          tags: ['email', 'onboarding', 'welcome', 'marketing'],
          variables: ['customer_name', 'product_name', 'account_url', 'support_email', 'next_steps']
        },
        {
          id: '5',
          name: 'Project Status Report',
          description: 'Detailed project status report with milestones, risks, and action items',
          category: 'report',
          industry: 'Technology',
          created_at: '2025-03-22T11:20:00Z',
          created_by: user?.id,
          version: 1,
          is_default: false,
          popularity: 4.6,
          usage_count: 156,
          tags: ['project', 'status', 'report', 'milestones'],
          variables: ['project_name', 'project_manager', 'start_date', 'end_date', 'status']
        },
        {
          id: '6',
          name: 'Customer Satisfaction Survey',
          description: 'Comprehensive customer feedback form with satisfaction ratings',
          category: 'form',
          industry: 'Retail',
          created_at: '2025-03-18T13:10:00Z',
          created_by: user?.id,
          version: 2,
          is_default: true,
          popularity: 4.4,
          usage_count: 203,
          tags: ['customer', 'satisfaction', 'survey', 'feedback'],
          variables: ['customer_name', 'purchase_date', 'product_name', 'order_number']
        },
        {
          id: '7',
          name: 'Professional Certification',
          description: 'Elegant certification template for professional achievements',
          category: 'certificate',
          industry: 'Professional Services',
          created_at: '2025-03-12T15:30:00Z',
          created_by: user?.id,
          version: 1,
          is_default: false,
          popularity: 4.7,
          usage_count: 167,
          tags: ['certificate', 'professional', 'achievement', 'certification'],
          variables: ['recipient_name', 'certification_name', 'issue_date', 'expiration_date', 'credential_id']
        },
        {
          id: '8',
          name: 'Product Launch Announcement',
          description: 'Email template for announcing new product launches',
          category: 'email',
          industry: 'Marketing',
          created_at: '2025-03-08T10:45:00Z',
          created_by: user?.id,
          version: 3,
          is_default: true,
          popularity: 4.8,
          usage_count: 231,
          tags: ['email', 'product', 'launch', 'announcement'],
          variables: ['customer_name', 'product_name', 'launch_date', 'special_offer', 'product_url']
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates');
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      // In a real app, this would be a database call
      setTemplates(templates.filter(template => template.id !== id));
      showToast('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      // In a real app, this would be a database call
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
        created_at: new Date().toISOString(),
        version: 1,
        is_default: false
      };
      
      setTemplates([newTemplate, ...templates]);
      showToast('Template duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating template:', error);
      showToast('Failed to duplicate template', 'error');
    }
  };

  const handleSetAsDefault = async (template: any) => {
    try {
      // In a real app, this would be a database call
      setTemplates(templates.map(t => ({
        ...t,
        is_default: t.id === template.id ? true : 
          (t.category === template.category ? false : t.is_default)
      })));
      
      showToast('Template set as default successfully', 'success');
    } catch (error) {
      console.error('Error setting template as default:', error);
      showToast('Failed to set template as default', 'error');
    }
  };

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleExport = (template: any) => {
    try {
      const dataStr = JSON.stringify(template, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showToast('Template exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting template:', error);
      showToast('Failed to export template', 'error');
    }
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const importedTemplate = JSON.parse(content);
            
            // Validate the imported template
            if (!importedTemplate.name || !importedTemplate.category) {
              throw new Error('Invalid template format');
            }
            
            // Check for duplicate name
            const isDuplicate = templates.some(t => t.name.toLowerCase() === importedTemplate.name.toLowerCase());
            const templateName = isDuplicate ? `${importedTemplate.name} (Imported)` : importedTemplate.name;
            
            // Add to templates list
            const newTemplate = {
              ...importedTemplate,
              id: Date.now().toString(),
              name: templateName,
              created_at: new Date().toISOString(),
              created_by: user?.id,
              version: 1,
              is_default: false
            };
            
            setTemplates([newTemplate, ...templates]);
            showToast('Template imported successfully', 'success');
          } catch (error) {
            console.error('Error parsing imported template:', error);
            showToast('Failed to import template: Invalid format', 'error');
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Error importing template:', error);
        showToast('Failed to import template', 'error');
      }
    };
    
    input.click();
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleTemplateExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  const toggleSort = (field: 'name' | 'created_at' | 'popularity') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters and sorting
  const filteredTemplates = templates.filter(template => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!template.name.toLowerCase().includes(query) && 
          !template.description.toLowerCase().includes(query) &&
          !template.tags.some((tag: string) => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Apply category filter
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }
    
    // Apply industry filter
    if (selectedIndustry !== 'All Industries' && template.industry !== selectedIndustry) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'popularity') {
      return sortDirection === 'asc'
        ? a.popularity - b.popularity
        : b.popularity - a.popularity;
    } else {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-12 w-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to access this page</p>
          <Link
            to="/auth"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Templates</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadTemplates}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
          <p className="text-gray-600">Manage your document, form, and certificate templates</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleImportTemplate}
            className="flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <FileUp className="w-5 h-5 mr-2" />
            Import Template
          </button>
          <Link
            to="/admin/reports"
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Search templates..."
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="appearance-none pl-8 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field as 'name' | 'created_at' | 'popularity');
                  setSortDirection(direction as 'asc' | 'desc');
                }}
                className="appearance-none pl-8 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="popularity-desc">Most Popular</option>
                <option value="popularity-asc">Least Popular</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {sortField === 'name' ? (
                  <Tag className="h-4 w-4 text-gray-400" />
                ) : sortField === 'created_at' ? (
                  <Clock className="h-4 w-4 text-gray-400" />
                ) : (
                  <Star className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
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
              onClick={() => setSelectedCategory(category.id)}
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-12 w-12 text-purple-600 animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? 'Try a different search term' : 'Create your first template to get started'}
          </p>
          <Link
            to="/admin/reports"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
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
                      <p className="text-sm text-gray-500">{category.templates.length} templates</p>
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

                {/* Templates Table */}
                {expandedCategories[category.id] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => toggleSort('name')}
                          >
                            <div className="flex items-center">
                              Template Name
                              {sortField === 'name' && (
                                sortDirection === 'asc' 
                                  ? <SortAsc className="ml-1 h-4 w-4" />
                                  : <SortDesc className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Industry
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => toggleSort('created_at')}
                          >
                            <div className="flex items-center">
                              Created Date
                              {sortField === 'created_at' && (
                                sortDirection === 'asc' 
                                  ? <SortAsc className="ml-1 h-4 w-4" />
                                  : <SortDesc className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => toggleSort('popularity')}
                          >
                            <div className="flex items-center">
                              Popularity
                              {sortField === 'popularity' && (
                                sortDirection === 'asc' 
                                  ? <SortAsc className="ml-1 h-4 w-4" />
                                  : <SortDesc className="ml-1 h-4 w-4" />
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {category.templates.map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {React.cloneElement(category.icon, { className: 'h-5 w-5 text-gray-400 mr-3' })}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {template.name}
                                  </div>
                                  <div className="text-sm text-gray-500 line-clamp-1">
                                    {template.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {template.industry}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                template.is_default
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {template.is_default ? 'Default' : 'Standard'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                {format(new Date(template.created_at), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < Math.floor(template.popularity) 
                                          ? 'text-yellow-400 fill-current' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                  ({template.usage_count} uses)
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={() => handlePreview(template)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Preview"
                              >
                                <Eye className="h-5 w-5 inline" />
                              </button>
                              <Link
                                to={`/admin/reports?template=${template.id}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <Edit2 className="h-5 w-5 inline" />
                              </Link>
                              <button
                                onClick={() => handleDuplicateTemplate(template)}
                                className="text-green-600 hover:text-green-900"
                                title="Duplicate"
                              >
                                <Copy className="h-5 w-5 inline" />
                              </button>
                              <button
                                onClick={() => handleExport(template)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Export"
                              >
                                <Download className="h-5 w-5 inline" />
                              </button>
                              {!template.is_default && (
                                <button
                                  onClick={() => handleSetAsDefault(template)}
                                  className="text-amber-600 hover:text-amber-900"
                                  title="Set as Default"
                                >
                                  <Check className="h-5 w-5 inline" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-5 w-5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Template Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium">{selectedTemplate.industry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Version</p>
                    <p className="font-medium">{selectedTemplate.version}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{format(new Date(selectedTemplate.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{selectedTemplate.description}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Variables</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTemplate.variables.map((variable: string) => (
                      <span key={variable} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Template Preview</h3>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Preview not available in this demo</p>
                    <p className="text-sm text-gray-400">In a real application, the template preview would be displayed here</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Usage Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Total Uses</p>
                      <BarChart className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">{selectedTemplate.usage_count}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Popularity</p>
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-2xl font-bold">{selectedTemplate.popularity.toFixed(1)}/5.0</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Version</p>
                      <Layers className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">v{selectedTemplate.version}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
              >
                Close
              </button>
              <Link
                to={`/admin/reports?template=${selectedTemplate.id}`}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Edit Template
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
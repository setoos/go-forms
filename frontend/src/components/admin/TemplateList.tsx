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
  SortDesc
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../lib/toast';
import { format } from 'date-fns';
import { useAuth } from '../../lib/auth';

interface Template {
  id: string;
  name: string;
  content: string;
  created_at: string;
  created_by: string;
  user_email?: string;
  quiz_id?: string | null;
  is_default?: boolean;
  version?: number;
  quiz_title?: string;
}

export default function TemplateList({ initialTemplates = [] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [loading, setLoading] = useState(initialTemplates.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [existingTemplateNames, setExistingTemplateNames] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'name' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'quiz'>('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialTemplates.length === 0) {
      loadTemplates();
    } else {
      // Extract template names for validation
      setExistingTemplateNames(initialTemplates.map(t => t.name));
    }
  }, [initialTemplates.length]);
  console.log({ initialTemplates });
  

  const loadTemplates = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter templates to only show those created by the current user or system templates
      const filteredTemplates = (data || []).filter(template => 
        !template.created_by || template.created_by === user.id
      );
      
      // Add user email to templates created by the current user
      const templatesWithUserEmails = filteredTemplates.map(template => {
        if (template.created_by && user && template.created_by === user.id) {
          return {
            ...template,
            user_email: user.email
          };
        }
        return {
          ...template,
          user_email: template.created_by ? 'User' : 'System'
        };
      });
      
      // Get quiz titles for templates assigned to quizzes
      const templatesWithQuizInfo = await Promise.all(
        templatesWithUserEmails.map(async (template) => {
          if (template.quiz_id) {
            const { data: quizData } = await supabase
              .from('quizzes')
              .select('title')
              .eq('id', template.quiz_id)
              .single();
              
            return {
              ...template,
              quiz_title: quizData?.title || 'Unknown Quiz'
            };
          }
          return template;
        })
      );
      
      setTemplates(templatesWithQuizInfo);
      
      // Extract template names for validation
      setExistingTemplateNames(filteredTemplates.map(t => t.name));
    } catch (error) {
      console.error('Error loading templates:', error);
      setError(error instanceof Error ? error.message : 'Failed to load templates');
      showToast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const deletedTemplate = templates.find(template => template.id === id);
      setTemplates(templates.filter(template => template.id !== id));
      
      // Update existing template names
      if (deletedTemplate) {
        setExistingTemplateNames(prev => prev.filter(name => name !== deletedTemplate.name));
      }
      
      showToast('Template deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Failed to delete template', 'error');
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: `${template.name} (Copy)`,
          content: template.content,
          created_by: user?.id,
          quiz_id: template.quiz_id,
          is_default: false,
          version: 1
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add user email to the new template
      const newTemplate = {
        ...data,
        user_email: user?.email || 'User',
        quiz_title: template.quiz_title
      };
      
      setTemplates([newTemplate, ...templates]);
      
      // Update existing template names
      setExistingTemplateNames(prev => [...prev, newTemplate.name]);
      
      showToast('Template duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating template:', error);
      showToast('Failed to duplicate template', 'error');
    }
  };

  const handleSetAsDefault = async (template: Template) => {
    try {
      // First, unset any existing default for this quiz
      if (template.quiz_id) {
        await supabase
          .from('report_templates')
          .update({ is_default: false })
          .eq('quiz_id', template.quiz_id)
          .eq('is_default', true);
      } else {
        await supabase
          .from('report_templates')
          .update({ is_default: false })
          .is('quiz_id', null)
          .eq('is_default', true);
      }
      
      // Then set this template as default
      const { error } = await supabase
        .from('report_templates')
        .update({ is_default: true })
        .eq('id', template.id);
        
      if (error) throw error;
      
      // Update local state
      setTemplates(templates.map(t => ({
        ...t,
        is_default: t.id === template.id ? true : 
          (t.quiz_id === template.quiz_id ? false : t.is_default)
      })));
      
      showToast('Template set as default successfully', 'success');
    } catch (error) {
      console.error('Error setting template as default:', error);
      showToast('Error setting template as default: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleExport = (template: Template) => {
    try {
      const dataStr = JSON.stringify(template, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
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
            if (!importedTemplate.name || !importedTemplate.content) {
              throw new Error('Invalid template format');
            }
            
            // Check for duplicate name
            const isDuplicate = templates.some(t => t.name.toLowerCase() === importedTemplate.name.toLowerCase());
            const templateName = isDuplicate ? `${importedTemplate.name} (Imported)` : importedTemplate.name;
            
            // Insert the template
            const { data, error } = await supabase
              .from('report_templates')
              .insert({
                name: templateName,
                content: importedTemplate.content,
                created_by: user?.id,
                version: 1
              })
              .select()
              .single();
              
            if (error) throw error;
            
            // Add to templates list
            setTemplates([
              {
                ...data,
                user_email: user?.email || 'User'
              },
              ...templates
            ]);
            
            // Update existing template names
            setExistingTemplateNames(prev => [...prev, templateName]);
            
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

  const toggleSort = (field: 'name' | 'created_at') => {
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
          !template.quiz_title?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Apply type filter
    if (filterType === 'global' && template.quiz_id) {
      return false;
    }
    if (filterType === 'quiz' && !template.quiz_id) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Authentication Required</h3>
          <p className="text-gray-500 mb-6">You must be logged in to access this page</p>
          <Link
            to="/auth"
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
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
        <div className="bg-background rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">Error Loading Templates</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={loadTemplates}
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text">Report Templates</h1>
          <p className="text-gray-600">Manage your quiz result report templates</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleImportTemplate}
            className="flex items-center px-4 py-2 border border-secondary text-secondary rounded-lg hover:bg-accent transition-colors"
          >
            <FileUp className="w-5 h-5 mr-2" />
            Import Template
          </button>
          <Link
            to="/admin/reports"
            className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Template
          </Link>
        </div>
      </div>

      <div className="bg-background rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-background placeholder-gray-500 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              placeholder="Search templates..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'global' | 'quiz')}
                className="appearance-none pl-8 pr-10 py-2 border border-border rounded-md leading-5 bg-background focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
              >
                <option value="all">All Templates</option>
                <option value="global">Global Templates</option>
                <option value="quiz">Quiz-specific Templates</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-12 w-12 text-secondary animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first template to get started'}
            </p>
            <Link
              to="/admin/reports"
              className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-primary transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Template
            </Link>
          </div>
        ) : (
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
                    Assigned To
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-text">
                          {template.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {template.quiz_title ? template.quiz_title : 'Global (All Quizzes)'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        template.is_default
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-text'
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handlePreview(template)}
                        className="text-secondary hover:text-primary"
                        title="Preview"
                      >
                        <Eye className="h-5 w-5 inline" />
                      </button>
                      <Link
                        to={`/admin/templates/${template.id}`}
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
                        className="text-gray-600 hover:text-text"
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

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text">
                  {selectedTemplate.name}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-text"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: (() => {
                  try {
                    const parsedContent = JSON.parse(selectedTemplate.content);
                    if (Array.isArray(parsedContent) && parsedContent.length > 0 && 'title' in parsedContent[0]) {
                      return parsedContent.map(section => `
                        <div class="mb-6">
                          <h2>${section.title}</h2>
                          ${section.content}
                          ${section.subsections?.map(sub => `
                            <div class="ml-6 mb-4">
                              <h3>${sub.title}</h3>
                              ${sub.content}
                            </div>
                          `).join('') || ''}
                        </div>
                      `).join('');
                    }
                    return selectedTemplate.content;
                  } catch (e) {
                    return selectedTemplate.content;
                  }
                })() }}
              />
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-text rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}